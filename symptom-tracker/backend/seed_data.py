"""
Pre-loaded clinical demo scenarios.
Populates the in-memory store with three distinct patient personas:
1. Improving (On-track recovery)
2. Non-responding (Treatment ineffective / Day 5 checkpoint failure)
3. Adverse Reaction (Drug hypersensitivity / Allergic rash)
"""

from datetime import date, datetime, timedelta
from typing import List

try:
    from .models import Patient, CheckIn, Symptoms, SideEffects
    from . import store
except (ImportError, ValueError):
    from models import Patient, CheckIn, Symptoms, SideEffects
    import store


def seed_demo_data(reset_first: bool = True) -> List[Patient]:
    """
    Seeds the in-memory store with 3 realistic patient journeys.
    """
    if reset_first:
        store.clear_store()

    today = date.today()

    # -------------------------------------------------------------
    # Persona 1: Marcus Vance (Improving / On Track)
    # -------------------------------------------------------------
    p1 = Patient(
        id="P101",
        name="Marcus Vance",
        age=38,
        diagnosis="Acute Bacterial Sinusitis",
        medication="Amoxicillin 875mg BID (10-day course)",
        start_date=today - timedelta(days=5),
    )
    store.add_patient(p1)

    p1_checkins = [
        CheckIn(
            patient_id=p1.id,
            day=1,
            timestamp=datetime.now() - timedelta(days=4),
            symptoms=Symptoms(facial_pain=4, congestion=4, fever=True, energy=2),
            side_effects=SideEffects(),
            raw_notes="Severe pressure behind cheeks and forehead. Starting antibiotic today.",
        ),
        CheckIn(
            patient_id=p1.id,
            day=3,
            timestamp=datetime.now() - timedelta(days=2),
            symptoms=Symptoms(facial_pain=3, congestion=3, fever=False, energy=3),
            side_effects=SideEffects(),
            raw_notes="Fever broke yesterday. Pressure is still present but starting to ease.",
        ),
        CheckIn(
            patient_id=p1.id,
            day=5,
            timestamp=datetime.now(),
            symptoms=Symptoms(facial_pain=1, congestion=2, fever=False, energy=4),
            side_effects=SideEffects(),
            raw_notes="Feeling much better. Almost back to my usual routine, minimal facial pain.",
        ),
    ]
    for c in p1_checkins:
        store.add_checkin(p1.id, c)

    # -------------------------------------------------------------
    # Persona 2: Elena Rostova (Non-Responding / Treatment Ineffective)
    # -------------------------------------------------------------
    p2 = Patient(
        id="P102",
        name="Elena Rostova",
        age=46,
        diagnosis="Acute Bacterial Sinusitis",
        medication="Amoxicillin 875mg BID (10-day course)",
        start_date=today - timedelta(days=5),
    )
    store.add_patient(p2)

    p2_checkins = [
        CheckIn(
            patient_id=p2.id,
            day=1,
            timestamp=datetime.now() - timedelta(days=4),
            symptoms=Symptoms(facial_pain=4, congestion=4, fever=True, energy=2),
            side_effects=SideEffects(),
            raw_notes="Throbbing pain in maxillary sinuses, thick green nasal discharge, fever.",
        ),
        CheckIn(
            patient_id=p2.id,
            day=3,
            timestamp=datetime.now() - timedelta(days=2),
            symptoms=Symptoms(facial_pain=4, congestion=4, fever=True, energy=2),
            side_effects=SideEffects(),
            raw_notes="No improvement yet. Still having afternoon chills and heavy nasal congestion.",
        ),
        CheckIn(
            patient_id=p2.id,
            day=5,
            timestamp=datetime.now(),
            symptoms=Symptoms(facial_pain=4, congestion=4, fever=True, energy=1),
            side_effects=SideEffects(),
            raw_notes="Day 5 on antibiotics and pain is worse. Teeth and forehead ache severely. Still running a fever.",
        ),
    ]
    for c in p2_checkins:
        store.add_checkin(p2.id, c)

    # -------------------------------------------------------------
    # Persona 3: David Kim (Adverse Reaction / Hypersensitivity)
    # -------------------------------------------------------------
    p3 = Patient(
        id="P103",
        name="David Kim",
        age=29,
        diagnosis="Acute Bacterial Sinusitis",
        medication="Amoxicillin 875mg BID (10-day course)",
        start_date=today - timedelta(days=3),
    )
    store.add_patient(p3)

    p3_checkins = [
        CheckIn(
            patient_id=p3.id,
            day=1,
            timestamp=datetime.now() - timedelta(days=2),
            symptoms=Symptoms(facial_pain=4, congestion=3, fever=True, energy=2),
            side_effects=SideEffects(),
            raw_notes="Sinus headache and congested nose. Started first capsule at lunch.",
        ),
        CheckIn(
            patient_id=p3.id,
            day=3,
            timestamp=datetime.now(),
            symptoms=Symptoms(facial_pain=2, congestion=2, fever=False, energy=3),
            side_effects=SideEffects(rash=True),
            raw_notes="Sinuses feel noticeably clearer, but I woke up this morning with red itchy hives across my chest and arms.",
        ),
    ]
    for c in p3_checkins:
        store.add_checkin(p3.id, c)

    return store.list_patients()


if __name__ == "__main__":
    patients = seed_demo_data()
    print(f"Seeded {len(patients)} patients:")
    for p in patients:
        latest = store.get_latest_checkin(p.id)
        alert_msgs = [f"[{a.severity}] {a.category}" for a in latest.alerts] if latest else []
        print(f" - {p.name} ({p.id}) | Status: {p.status} | Latest Alerts: {', '.join(alert_msgs)}")
