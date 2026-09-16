#!/usr/bin/env python3
"""
MediCurve CLI: Complete Terminal Runner & Role-Switching Portal.
Allows seamlessly switching between:
1. 🩺 Doctor Dashboard (Triage Queue, Patient Details, Medication Switch, Urgent Visit Notice)
2. 📝 Patient Portal (Check-in Milestones, Anchored Scales, Groq AI Auto-Fill, Patient Alerts)
3. 🤖 Automated Clinical Demo Simulation
4. ⚙️ Reset Demo Data & Patient Registration
"""

import sys
import time
from datetime import date, datetime
from typing import Optional, List

# Ensure symptom-tracker root is on sys.path
sys.path.insert(0, ".")

from backend.models import (
    Patient,
    CheckIn,
    Symptoms,
    SideEffects,
    DoctorIntervention,
    InterventionAction,
    VisitUrgency,
)
from backend import store
from backend.seed_data import seed_demo_data
from backend.alert_engine import evaluate_checkin
from backend.parser import parse_text, map_note_to_checkin
from backend.baseline import BASELINE_TRAJECTORY, CRITICAL_CHECKPOINT_DAY


def print_banner(text: str):
    print("\n" + "=" * 78)
    print(f"  {text.center(74)}")
    print("=" * 78)


def print_section(title: str):
    print(f"\n--- {title} " + "-" * max(2, (74 - len(title))))


def format_status(status: str) -> str:
    icons = {
        "CRITICAL": "🔴 CRITICAL",
        "VISIT_REQUESTED": "🚨 VISIT REQUESTED",
        "WARNING": "🟡 WARNING",
        "OK": "🟢 OK",
        "RESOLVED": "🔵 RESOLVED",
    }
    return icons.get(status, status)


def render_triage_queue():
    """Prints the current clinician triage queue sorted by priority."""
    patients = store.list_patients(sort_by_priority=True)
    print("\nCLINICIAN ACTIVE TRIAGE QUEUE:")
    print(f"{'PRIORITY':<20} | {'ID':<6} | {'PATIENT NAME':<16} | {'DAY':<5} | {'ACTIVE SIGNALS / ACTIONS'}")
    print("-" * 78)
    for p in patients:
        latest = store.get_latest_checkin(p.id)
        current_day = f"Day {latest.day}" if latest else "New"
        alerts_summary = ""

        if p.active_visit_notice:
            alerts_summary = f"[VISIT] {p.active_visit_notice.patient_message[:35]}..."
        elif latest and latest.alerts:
            alerts_summary = ", ".join([f"[{a.severity}] {a.category}" for a in latest.alerts[:2]])
        elif p.interventions:
            alerts_summary = f"Addressed: {p.interventions[-1].action}"

        print(f"{format_status(p.status):<20} | {p.id:<6} | {p.name:<16} | {current_day:<5} | {alerts_summary}")
    print("-" * 78)


# ===================================================================
# PORTAL 1: 🩺 Doctor Dashboard
# ===================================================================
def doctor_portal():
    while True:
        print_banner("🩺 DOCTOR TRIAGE & INTERVENTION DASHBOARD")
        stats = store.get_triage_stats()
        print(f"Cohort: {stats['cohort']} | Checkpoint: Day {stats['critical_checkpoint_day']}")
        print(f"Monitored Patients: {stats['total_patients']} | Critical: {stats['critical_count']} | Visit Requested: {stats['visit_requested_count']} | Adherence: {stats['adherence_rate_pct']}%")

        render_triage_queue()

        patients = store.list_patients(sort_by_priority=True)
        print("\nDoctor Actions:")
        print(" [1-N] Select Patient by ID to review & intervene")
        print(" [b]   Back to Main Menu")

        choice = input("\nEnter Patient ID to inspect (e.g. P102) or 'b': ").strip().upper()
        if choice in ["B", "BACK", "Q"]:
            break

        patient = store.get_patient(choice)
        if not patient:
            print(f"❌ Patient '{choice}' not found.")
            time.sleep(1)
            continue

        # Patient Drill-down
        while True:
            print_section(f"PATIENT CHART: {patient.name} ({patient.id})")
            print(f"Status: {format_status(patient.status)} | Age: {patient.age}")
            print(f"Diagnosis: {patient.diagnosis}")
            print(f"Active Rx: {patient.medication} (Started: {patient.start_date})")

            # Active Visit Notice
            if patient.active_visit_notice:
                v = patient.active_visit_notice
                print("\n🚨 PENDING IN-PERSON VISIT REQUEST:")
                print(f"   Urgency: {v.visit_urgency} | Clinician: {v.doctor_name}")
                print(f"   Notice Dispatched: \"{v.patient_message}\"")

            # Active Alerts
            latest_checkin = store.get_latest_checkin(patient.id)
            if latest_checkin and latest_checkin.alerts:
                print("\nActive Clinical Signals:")
                for a in latest_checkin.alerts:
                    print(f"   * [{a.severity}] {a.category}: {a.message}")

            # History Table
            history = store.get_patient_history(patient.id)
            if history:
                print("\nCheck-in Timeline:")
                print(f"{'DAY':<6} | {'PAIN (Act/Exp)':<16} | {'CONGESTION (Act/Exp)':<22} | {'FEVER':<7} | {'ADHERENCE':<10} | {'NOTE'}")
                print("-" * 78)
                for c in history:
                    exp = BASELINE_TRAJECTORY.get(c.day, {})
                    p_str = f"{c.symptoms.facial_pain} / {exp.get('facial_pain', '-')}"
                    cg_str = f"{c.symptoms.congestion} / {exp.get('congestion', '-')}"
                    fv_str = "Yes" if c.symptoms.fever else "No"
                    adh_str = "Yes" if c.adherence else "❌ No"
                    note_str = (c.raw_notes[:20] + "...") if c.raw_notes else "-"
                    print(f"Day {c.day:<2} | {p_str:<16} | {cg_str:<22} | {fv_str:<7} | {adh_str:<10} | {note_str}")
                print("-" * 78)

            # Prior Interventions
            if patient.interventions:
                print("\nPast Doctor Interventions:")
                for itv in patient.interventions:
                    print(f"   • [{itv.timestamp.strftime('%H:%M:%S')}] {itv.action} by {itv.doctor_name}: {itv.notes}")

            print("\nSelect Clinician Intervention:")
            print(" [1] 🔄 Switch Medication (e.g. Day 5 treatment failure -> Augmentin)")
            print(" [2] 🚨 Send Immediate In-Person Clinic Visit Notice (Urgent Recall)")
            print(" [3] ⛔ Discontinue Medication (Allergy/Rash)")
            print(" [4] 📩 Send Adherence Counseling Reminder")
            print(" [5] ✨ Confirm Recovery On-Track (Send Reassurance)")
            print(" [b] Back to Queue")

            act = input("\nChoose Action [1-5 or b]: ").strip().lower()
            if act in ["b", "back"]:
                break
            elif act == "1":
                new_rx = input("New Prescription [Default: Augmentin 875mg BID (7-day course)]: ").strip() or "Augmentin 875mg BID (7-day course)"
                notes = input("Clinical Rationale: ").strip() or "Suspected beta-lactamase resistance on Day 5."
                store.add_intervention(
                    patient.id,
                    DoctorIntervention(
                        patient_id=patient.id,
                        action="SWITCH_MEDICATION",
                        notes=notes,
                        prescribed_medication=new_rx,
                        doctor_name="Dr. Sarah Lin, MD",
                    ),
                )
                print(f"\n✅ Prescription updated to '{new_rx}'. Patient status updated to RESOLVED.")
                time.sleep(1.5)
            elif act == "2":
                print("Visit Urgency: [1] SAME_DAY_CLINIC  [2] IMMEDIATE_ER  [3] NEXT_DAY_CLINIC")
                u_pick = input("Choose urgency [1-3, Default 1]: ").strip()
                urgency = "IMMEDIATE_ER" if u_pick == "2" else ("NEXT_DAY_CLINIC" if u_pick == "3" else "SAME_DAY_CLINIC")
                msg = input("Notice message to patient: ").strip() or "Please STOP medication and report to Clinic Room 2B today at 2:00 PM for evaluation."
                notes = input("Chart rationale: ").strip() or "Immediate evaluation requested for adverse symptom development."
                store.add_intervention(
                    patient.id,
                    DoctorIntervention(
                        patient_id=patient.id,
                        action="REQUEST_IMMEDIATE_VISIT",
                        requires_immediate_visit=True,
                        visit_urgency=urgency,
                        patient_message=msg,
                        notes=notes,
                        doctor_name="Dr. Sarah Lin, MD",
                    ),
                )
                print(f"\n🚨 Immediate visit notice dispatched to {patient.name}! Status: VISIT_REQUESTED.")
                time.sleep(1.5)
            elif act == "3":
                notes = input("Allergy notes: ").strip() or "Discontinued Amoxicillin immediately due to maculopapular rash."
                store.add_intervention(
                    patient.id,
                    DoctorIntervention(
                        patient_id=patient.id,
                        action="DISCONTINUE_ALLERGY",
                        notes=notes,
                        doctor_name="Dr. Sarah Lin, MD",
                    ),
                )
                print(f"\n⛔ Medication discontinued and charted. Status updated to RESOLVED.")
                time.sleep(1.5)
            elif act == "4":
                store.add_intervention(
                    patient.id,
                    DoctorIntervention(
                        patient_id=patient.id,
                        action="COUNSEL_ADHERENCE",
                        notes="Counselled patient on importance of completing antibiotic schedule.",
                        doctor_name="Dr. Sarah Lin, MD",
                    ),
                )
                print(f"\n📩 Adherence notice sent to patient.")
                time.sleep(1.5)
            elif act == "5":
                store.add_intervention(
                    patient.id,
                    DoctorIntervention(
                        patient_id=patient.id,
                        action="CONFIRM_RECOVERY",
                        notes="Patient recovery on track. Reassured to finish 10-day course.",
                        doctor_name="Dr. Sarah Lin, MD",
                    ),
                )
                print(f"\n✨ Reassurance note sent.")
                time.sleep(1.5)


# ===================================================================
# PORTAL 2: 📝 Patient Portal
# ===================================================================
def patient_portal():
    while True:
        print_banner("📝 PATIENT DAILY RECOVERY CHECK-IN")
        patients = store.list_patients(sort_by_priority=False)
        print("Select Your Patient Profile:")
        for idx, p in enumerate(patients):
            print(f" [{idx+1}] {p.name} ({p.id}) — {p.diagnosis}")
        print(" [n] Register Brand-New Patient")
        print(" [b] Back to Main Menu")

        choice = input("\nChoose Profile [1-N, n, b]: ").strip().lower()
        if choice in ["b", "back", "q"]:
            break
        elif choice == "n":
            pname = input("Your Full Name: ").strip() or "Alex Mercer"
            page = int(input("Age: ").strip() or "30")
            pid = f"P{len(patients) + 101}"
            patient = Patient(
                id=pid,
                name=pname,
                age=page,
                diagnosis="Acute Bacterial Sinusitis",
                medication="Amoxicillin 875mg BID (10-day course)",
                start_date=date.today(),
            )
            store.add_patient(patient)
            print(f"\n✅ Registered {pname} ({pid}).")
        else:
            try:
                p_idx = int(choice) - 1
                patient = patients[p_idx]
            except (ValueError, IndexError):
                print("Invalid selection.")
                continue

        # Patient View Interface
        print_section(f"Welcome, {patient.name}")
        print(f"Prescribed: {patient.medication}")

        # Check for Active Doctor Notice
        if patient.active_visit_notice:
            v = patient.active_visit_notice
            print("\n" + "!" * 78)
            print(f"🚨 URGENT MESSAGE FROM YOUR DOCTOR ({v.doctor_name}):")
            print(f"   \"{v.patient_message}\"")
            print(f"   Urgency: {v.visit_urgency} | Dispatched: {v.timestamp.strftime('%b %d, %H:%M')}")
            print("!" * 78 + "\n")

        # Determine next recommended checkin day
        history = store.get_patient_history(patient.id)
        done_days = {c.day for c in history}
        all_milestones = [1, 3, 5, 7, 9]
        next_suggested = next((d for d in all_milestones if d not in done_days), 1)

        day_descriptions = {
            1: "Day 1 — Baseline / Start of Treatment",
            3: "Day 3 — Early Response & Allergy Window",
            5: "Day 5 — ⭐ Critical Efficacy Checkpoint",
            7: "Day 7 — Treatment Confirmation",
            9: "Day 9 — Course Completion & Adherence",
        }

        print(f"Next recommended milestone: Day {next_suggested} ({day_descriptions.get(next_suggested, '')})")
        day_input = input(f"Enter Treatment Day to report for [Default: {next_suggested}]: ").strip() or str(next_suggested)
        day = int(day_input)

        print(f"\n--- Reporting for Day {day} ---")

        # Free-text first option for Groq AI auto-fill
        print("Tip: You can type a quick note first, and AI will auto-fill your sliders!")
        quick_note = input("Optional free-text note (or press Enter to skip to questions): ").strip()
        autofill = None
        if quick_note:
            autofill = map_note_to_checkin(quick_note)
            print(f"   🤖 AI Parsed Note ({autofill['raw_parsed'].get('source')}):")
            print(f"      Symptoms: {autofill['raw_parsed'].get('symptom_mentions')}")
            print(f"      Suggested Pain: {autofill['suggested_symptoms']['facial_pain']}/5 | Fever: {autofill['suggested_symptoms']['fever']}")
            if autofill['suggested_side_effects']['rash']:
                print("      ⚠️ AI DETECTED ALLERGY RED-FLAG: Rash mentioned!")

        # Questions with intelligent defaults
        def_pain = str(autofill["suggested_symptoms"]["facial_pain"]) if autofill else ("2" if day >= 5 else "4")
        def_cong = str(autofill["suggested_symptoms"]["congestion"]) if autofill else ("2" if day >= 5 else "4")
        def_fever = "y" if (autofill and autofill["suggested_symptoms"]["fever"]) else ("n" if day >= 5 else "y")
        def_energy = str(autofill["suggested_symptoms"]["energy"]) if autofill else ("4" if day >= 7 else ("3" if day >= 5 else "2"))
        def_rash = "y" if (autofill and autofill["suggested_side_effects"]["rash"]) else "n"

        # 1. Pain
        pain = int(input(f"Facial Pain (0=none, 1-2=mild, 3-4=moderate, 5=severe) [Default: {def_pain}]: ").strip() or def_pain)

        # 2. Congestion
        cong = int(input(f"Nasal Congestion (0=clear, 1-2=mild, 3-4=blocked, 5=closed) [Default: {def_cong}]: ").strip() or def_cong)

        # 3. Fever
        fever_input = input(f"Do you currently have a fever? (y/n) [Default: {def_fever}]: ").strip().lower() or def_fever
        fever = fever_input.startswith("y")

        # 4. Energy
        energy = int(input(f"Overall energy level (1=bedridden to 5=full energy) [Default: {def_energy}]: ").strip() or def_energy)

        # 5. Side effects
        rash_input = input(f"Any new skin rash or hives? (y/n) [Default: {def_rash}]: ").strip().lower() or def_rash
        rash = rash_input.startswith("y")
        if rash:
            print("\n  ⚠️  PATIENT SAFETY ALERT: A new rash while on antibiotics may be an allergic reaction.")
            print("      Stop taking your medication and contact your doctor immediately.\n")

        diarrhea_input = input("Any frequent diarrhea or stomach cramps? (y/n) [Default: n]: ").strip().lower() or "n"
        diarrhea = diarrhea_input.startswith("y")

        nausea_input = input("Any persistent nausea or upset stomach? (y/n) [Default: n]: ").strip().lower() or "n"
        nausea = nausea_input.startswith("y")

        # 6. Adherence
        if day == 1:
            adh_prompt = "Did you take your first prescribed dose today? (y/n) [Default: y]: "
        elif day == 9:
            adh_prompt = "Have you completed all prescribed doses of your 10-day course? (y/n) [Default: y]: "
        else:
            adh_prompt = "Have you taken all scheduled Amoxicillin doses as prescribed? (y/n) [Default: y]: "

        adh_input = input(adh_prompt).strip().lower() or "y"
        adherence = adh_input.startswith("y")

        checkin = CheckIn(
            patient_id=patient.id,
            day=day,
            symptoms=Symptoms(facial_pain=pain, congestion=cong, fever=fever, energy=energy),
            side_effects=SideEffects(rash=rash, diarrhea=diarrhea, nausea=nausea),
            adherence=adherence,
            raw_notes=quick_note if quick_note else None,
        )

        store.add_checkin(patient.id, checkin)
        print(f"\n✅ Day {day} check-in recorded successfully for {patient.name}!")

        # Show patient feedback
        if checkin.alerts:
            top = checkin.alerts[0]
            if top.severity == "CRITICAL":
                print(f"\n🚨 NOTICE: {top.message}\n   Your report has been flagged for immediate physician review.")
            elif top.severity == "WARNING":
                print(f"\n⚠️  ADVISORY: {top.message}")
            else:
                print(f"\n✨ RECOVERY ON TRACK: {top.message}")

        input("\n[Press ENTER to continue]: ")


# ===================================================================
# Main Menu
# ===================================================================
def main_menu():
    # Ensure seeded on initial launch
    if not store.list_patients():
        seed_demo_data(reset_first=False)

    while True:
        print_banner("MEDICURVE CLINICAL PORTAL — TERMINAL RUNNER")
        print("Continuous Triage for Bacterial Sinusitis (Amoxicillin 10-Day Course)\n")
        print("Select Portal Mode:")
        print(" [1] 🩺 Doctor Dashboard (Triage Queue, Patient Chart, Med Switch, Urgent Visit Notice)")
        print(" [2] 📝 Patient Portal (Report Daily Symptoms, Groq AI Auto-fill, Check-ins)")
        print(" [3] 🤖 Run Automated End-to-End Simulation")
        print(" [4] ⚙️ Reset Demo Data (Marcus, Elena, David)")
        print(" [q] Quit Application")

        choice = input("\nEnter Choice [1-4 or q]: ").strip().lower()
        if choice in ["q", "quit", "exit"]:
            print("\nGoodbye!")
            break
        elif choice == "1":
            doctor_portal()
        elif choice == "2":
            patient_portal()
        elif choice == "3":
            # Run automated simulation
            from cli_simulator import simulate_patient_journey
            simulate_patient_journey()
            input("\n[Press ENTER to return to Main Menu]: ")
        elif choice == "4":
            patients = seed_demo_data(reset_first=True)
            print(f"\n✅ Store reset. Seeded {len(patients)} standard personas (Elena, David, Marcus).")
            time.sleep(1)


# Import the automated simulation from earlier function
def simulate_patient_journey():
    print_banner("AUTOMATED CLINICAL SIMULATION WALKTHROUGH")
    seed_demo_data(reset_first=True)
    render_triage_queue()

    print_section("1. Registering New Patient at Runtime: Sophia Rivera (P104)")
    new_patient = Patient(
        id="P104",
        name="Sophia Rivera",
        age=32,
        diagnosis="Acute Bacterial Sinusitis",
        medication="Amoxicillin 875mg BID (10-day course)",
        start_date=date.today(),
    )
    store.add_patient(new_patient)
    render_triage_queue()

    print_section("2. Sophia Checks in on Day 1 (Baseline)")
    c1 = CheckIn(
        patient_id="P104",
        day=1,
        symptoms=Symptoms(facial_pain=4, congestion=4, fever=True, energy=2),
        side_effects=SideEffects(),
        raw_notes="Cheeks throbbing, mild fever.",
    )
    store.add_checkin("P104", c1)
    render_triage_queue()

    print_section("3. Sophia Checks in on Day 3 (Allergic Rash Appears)")
    c3 = CheckIn(
        patient_id="P104",
        day=3,
        symptoms=Symptoms(facial_pain=2, congestion=2, fever=False, energy=3),
        side_effects=SideEffects(rash=True),
        raw_notes="Face is better, but red itchy hives broke out on neck.",
    )
    store.add_checkin("P104", c3)
    render_triage_queue()

    print_section("4. Doctor Intervenes: Dispatches Immediate In-Person Visit Notice")
    itv = DoctorIntervention(
        patient_id="P104",
        action="REQUEST_IMMEDIATE_VISIT",
        requires_immediate_visit=True,
        visit_urgency="SAME_DAY_CLINIC",
        patient_message="STOP taking Amoxicillin. Please report to Clinic Room 2B today at 2:00 PM for allergy assessment.",
        notes="Maculopapular rash on Day 3 indicates drug hypersensitivity.",
        doctor_name="Dr. Sarah Lin, MD",
    )
    store.add_intervention("P104", itv)
    render_triage_queue()


if __name__ == "__main__":
    if "--demo" in sys.argv:
        simulate_patient_journey()
    else:
        main_menu()
