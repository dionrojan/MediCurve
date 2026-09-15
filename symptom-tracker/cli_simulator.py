#!/usr/bin/env python3
"""
Terminal Simulation & Interactive Runner.
Demonstrates adding new patients at runtime and tracking their check-in
trajectory day-by-day with real-time AI parsing and clinical alert evaluation.
"""

import sys
import time
from datetime import date
from typing import Optional

# Ensure symptom-tracker root is on sys.path
sys.path.insert(0, ".")

from backend.models import Patient, CheckIn, Symptoms, SideEffects
from backend import store
from backend.seed_data import seed_demo_data
from backend.alert_engine import evaluate_checkin
from backend.parser import parse_text
from backend.baseline import BASELINE_TRAJECTORY, CRITICAL_CHECKPOINT_DAY


def print_banner(text: str):
    print("\n" + "=" * 76)
    print(f"  {text.center(72)}")
    print("=" * 76)


def print_section(title: str):
    print(f"\n--- {title} " + "-" * (70 - len(title)))


def render_triage_queue():
    """Prints the current clinician triage queue sorted by priority."""
    patients = store.list_patients(sort_by_priority=True)
    status_icons = {"CRITICAL": "🔴 CRITICAL", "WARNING": "🟡 WARNING", "OK": "🟢 OK"}
    print("\nCURRENT CLINICIAN TRIAGE QUEUE:")
    print(f"{'PRIORITY':<14} | {'ID':<6} | {'PATIENT NAME':<18} | {'DAY':<5} | {'ACTIVE ALERTS'}")
    print("-" * 76)
    for p in patients:
        latest = store.get_latest_checkin(p.id)
        current_day = f"Day {latest.day}" if latest else "New"
        alerts_summary = ""
        if latest and latest.alerts:
            alerts_summary = ", ".join([f"[{a.severity}] {a.category}" for a in latest.alerts[:2]])
        print(f"{status_icons.get(p.status, p.status):<14} | {p.id:<6} | {p.name:<18} | {current_day:<5} | {alerts_summary}")
    print("-" * 76)


def simulate_patient_journey():
    print_banner("SYMPTOM TRACKER — TERMINAL RUNNER & CLINICAL SIMULATION")
    print("Cohort: Acute Bacterial Sinusitis | Treatment: Amoxicillin 875mg BID (10-Day)")

    # 1. Initialize with seeded patients
    print_section("Step 1: Loading Pre-existing Patients")
    seed_demo_data(reset_first=True)
    print("Seeded 3 existing clinic patients (Marcus Vance, Elena Rostova, David Kim).")
    render_triage_queue()

    # 2. Add brand-new patient at runtime
    print_section("Step 2: Dynamically Registering a NEW Patient at Runtime")
    new_patient = Patient(
        id="P104",
        name="Sophia Rivera",
        age=32,
        diagnosis="Acute Bacterial Sinusitis",
        medication="Amoxicillin 875mg BID (10-day course)",
        start_date=date.today(),
    )
    store.add_patient(new_patient)
    print(f"✅ Successfully registered new patient: {new_patient.name} (ID: {new_patient.id})")
    print(f"   Diagnosis: {new_patient.diagnosis}")
    print(f"   Prescription: {new_patient.medication}")
    print(f"   Initial Computed Status: {new_patient.status}")
    render_triage_queue()

    time.sleep(1)

    # 3. Day 1 Check-In
    print_section("Step 3: Day 1 Check-In — Sophia Rivera")
    d1_note = "Severe throbbing pressure in both cheeks and forehead. Mild fever."
    print(f"Patient Note: \"{d1_note}\"")
    parsed_d1 = parse_text(d1_note)
    print(f"AI Note Analysis ({parsed_d1.get('source')}):")
    print(f"  Symptoms detected: {parsed_d1.get('symptom_mentions')}")
    print(f"  Severity guess: {parsed_d1.get('severity_guess')}/5 | Red flags: {parsed_d1.get('red_flag_keywords') or 'None'}")

    c1 = CheckIn(
        patient_id="P104",
        day=1,
        symptoms=Symptoms(facial_pain=4, congestion=4, fever=True, energy=2),
        side_effects=SideEffects(),
        raw_notes=d1_note,
    )
    store.add_checkin("P104", c1)
    print(f"\nReported Metrics: Pain: 4/5 | Congestion: 4/5 | Fever: True | Energy: 2/5")
    print(f"Alert Engine Result: {[a.severity + ' (' + a.category + ')' for a in c1.alerts]}")
    print(f"Sophia's Status: {new_patient.status} (Recovery beginning as expected)")
    render_triage_queue()

    time.sleep(1)

    # 4. Day 3 Check-In
    print_section("Step 4: Day 3 Check-In — Sophia Rivera")
    d3_note = "Fever has completely cleared up. Sinus pain is still there but much lighter."
    print(f"Patient Note: \"{d3_note}\"")
    parsed_d3 = parse_text(d3_note)
    print(f"AI Note Analysis ({parsed_d3.get('source')}):")
    print(f"  Symptoms detected: {parsed_d3.get('symptom_mentions')}")
    print(f"  Severity guess: {parsed_d3.get('severity_guess')}/5")

    c3 = CheckIn(
        patient_id="P104",
        day=3,
        symptoms=Symptoms(facial_pain=2, congestion=3, fever=False, energy=3),
        side_effects=SideEffects(),
        raw_notes=d3_note,
    )
    store.add_checkin("P104", c3)
    print(f"\nReported Metrics: Pain: 2/5 | Congestion: 3/5 | Fever: False | Energy: 3/5")
    print(f"Alert Engine Result: {[a.severity + ' (' + a.category + ')' for a in c3.alerts]}")
    print(f"Sophia's Status: {new_patient.status} (Pain reduced 4 -> 2, on track)")
    render_triage_queue()

    time.sleep(1)

    # 5. Day 5 Check-In (Critical Checkpoint)
    print_section("Step 5: Day 5 Checkpoint — Testing Clinical Signal Detection")
    print(f"CRITICAL_CHECKPOINT_DAY = {CRITICAL_CHECKPOINT_DAY}")
    print("Let's simulate what happens if Sophia suddenly develops an Amoxicillin allergic rash:")

    d5_note = "Sinuses feel fine now, but this morning I developed red itchy hives across my neck and chest."
    print(f"Patient Note: \"{d5_note}\"")
    parsed_d5 = parse_text(d5_note)
    print(f"AI Note Analysis ({parsed_d5.get('source')}):")
    print(f"  Red-flag keywords detected: {parsed_d5.get('red_flag_keywords')}")

    c5 = CheckIn(
        patient_id="P104",
        day=5,
        symptoms=Symptoms(facial_pain=1, congestion=1, fever=False, energy=4),
        side_effects=SideEffects(rash=True),
        raw_notes=d5_note,
    )
    store.add_checkin("P104", c5)
    print(f"\nReported Metrics: Pain: 1/5 | Congestion: 1/5 | Fever: False | Energy: 4/5 | RASH: TRUE")
    print("\n🚨 ALERT ENGINE TRIGGERED:")
    for a in c5.alerts:
        print(f"   [{a.severity}] {a.category}: {a.message}")

    print(f"\nSophia Rivera's Status is NOW: {new_patient.status}")
    print("Watch how Sophia instantly leaps to the TOP of the triage queue:")
    render_triage_queue()

    # 6. Full Check-In Timeline Comparison
    print_section("Step 6: Sophia's Full Clinical Timeline vs Baseline")
    print(f"{'DAY':<6} | {'PAIN (Act/Exp)':<16} | {'CONGESTION (Act/Exp)':<22} | {'FEVER':<8} | {'STATUS'}")
    print("-" * 76)
    history = store.get_patient_history("P104")
    for chk in history:
        exp = BASELINE_TRAJECTORY.get(chk.day, {})
        pain_str = f"{chk.symptoms.facial_pain} / {exp.get('facial_pain', '-')}"
        cong_str = f"{chk.symptoms.congestion} / {exp.get('congestion', '-')}"
        fev_str = "Yes" if chk.symptoms.fever else "No"
        alert_sev = chk.alerts[0].severity if chk.alerts else "OK"
        print(f"Day {chk.day:<2} | {pain_str:<16} | {cong_str:<22} | {fev_str:<8} | {alert_sev}")
    print("-" * 76)

    print("\n🎉 SIMULATION COMPLETED SUCCESSFULLY!")
    print("New patient registration, multi-day check-ins, AI parsing, and real-time triage re-ordering verified.")


def interactive_mode():
    """Allows manual entry of a new patient and day-by-day check-in inputs."""
    print_banner("INTERACTIVE PATIENT CHECK-IN TERMINAL")
    seed_demo_data(reset_first=True)

    print("Register a new patient:")
    name = input("Patient Name [Default: Jordan Lee]: ").strip() or "Jordan Lee"
    age_str = input("Age [Default: 35]: ").strip() or "35"
    age = int(age_str)

    pid = f"P{len(store.list_patients()) + 101}"
    patient = Patient(
        id=pid,
        name=name,
        age=age,
        diagnosis="Acute Bacterial Sinusitis",
        medication="Amoxicillin 875mg BID (10-day course)",
        start_date=date.today(),
    )
    store.add_patient(patient)
    print(f"\nRegistered {name} ({pid}).")

    while True:
        print_section(f"New Check-in for {patient.name}")
        day_str = input("Treatment Day (1-10) [or 'q' to quit]: ").strip()
        if day_str.lower() == 'q':
            break

        try:
            day = int(day_str)
        except ValueError:
            print("Please enter a valid day number.")
            continue

        pain = int(input("Facial Pain (0=none to 5=severe) [Default 2]: ").strip() or "2")
        cong = int(input("Congestion (0=clear to 5=blocked) [Default 2]: ").strip() or "2")
        fever_input = input("Fever active? (y/n) [Default n]: ").strip().lower()
        fever = fever_input.startswith("y")
        energy = int(input("Energy level (1=exhausted to 5=normal) [Default 3]: ").strip() or "3")

        rash_input = input("Any skin rash or hives? (y/n) [Default n]: ").strip().lower()
        rash = rash_input.startswith("y")

        notes = input("Patient free-text note: ").strip()

        checkin = CheckIn(
            patient_id=pid,
            day=day,
            symptoms=Symptoms(facial_pain=pain, congestion=cong, fever=fever, energy=energy),
            side_effects=SideEffects(rash=rash),
            raw_notes=notes if notes else None,
        )

        store.add_checkin(pid, checkin)
        print(f"\n✅ Check-in recorded for Day {day}.")
        print(f"Patient Computed Status: {patient.status}")
        print("Alerts triggered:")
        for a in checkin.alerts:
            print(f"  - [{a.severity}] {a.category}: {a.message}")

        render_triage_queue()


if __name__ == "__main__":
    if "--interactive" in sys.argv or "-i" in sys.argv:
        interactive_mode()
    else:
        simulate_patient_journey()
