from typing import Dict, List, Optional, Any

try:
    from .models import Patient, CheckIn, DoctorIntervention
    from .alert_engine import evaluate_checkin
except (ImportError, ValueError):
    from models import Patient, CheckIn, DoctorIntervention
    from alert_engine import evaluate_checkin


# Primary in-memory store for patients and their check-in histories
_patients: Dict[str, Patient] = {}


def add_patient(patient: Patient) -> Patient:
    """
    Registers a new patient in the store.
    If the patient already exists, updates their profile.
    """
    _patients[patient.id] = patient
    return patient


def get_patient(patient_id: str) -> Optional[Patient]:
    """
    Retrieves a patient by ID, including their check-in history and computed status.
    """
    return _patients.get(patient_id)


def list_patients(sort_by_priority: bool = True) -> List[Patient]:
    """
    Returns all patients.
    If sort_by_priority is True, orders them by clinical urgency:
    CRITICAL first, then VISIT_REQUESTED, then WARNING, then OK, then RESOLVED.
    """
    patients = list(_patients.values())
    if sort_by_priority:
        priority_rank = {
            "CRITICAL": 0,
            "VISIT_REQUESTED": 1,
            "WARNING": 2,
            "OK": 3,
            "RESOLVED": 4,
        }
        patients.sort(key=lambda p: priority_rank.get(p.status, 5))
    return patients


def add_checkin(patient_id: str, checkin: CheckIn) -> CheckIn:
    """
    Adds a check-in for a patient.
    Automatically passes the check-in through the alert engine to generate
    and attach triage signals before appending it to history.
    """
    patient = get_patient(patient_id)
    if not patient:
        raise ValueError(f"Patient with ID '{patient_id}' not found.")

    # Guarantee patient_id consistency
    checkin.patient_id = patient_id

    # If alerts are not already attached, evaluate them against history and baseline
    if not checkin.alerts:
        checkin.alerts = evaluate_checkin(checkin, history=patient.checkins)

    # Idempotent day update: replace existing check-in for the same day if present
    existing_idx = next((i for i, c in enumerate(patient.checkins) if c.day == checkin.day), None)
    if existing_idx is not None:
        patient.checkins[existing_idx] = checkin
    else:
        patient.checkins.append(checkin)
        patient.checkins.sort(key=lambda c: c.day)

    return checkin


def add_intervention(patient_id: str, intervention: DoctorIntervention) -> DoctorIntervention:
    """
    Records a physician intervention for a patient.
    - If medication changed, updates patient.medication automatically.
    - If immediate visit requested, sets patient's status to VISIT_REQUESTED.
    - Automatically resolves prior critical check-in flags if intervention addresses it.
    """
    patient = get_patient(patient_id)
    if not patient:
        raise ValueError(f"Patient with ID '{patient_id}' not found.")

    intervention.patient_id = patient_id

    # Update active prescription if doctor changed it
    if intervention.prescribed_medication:
        patient.medication = intervention.prescribed_medication

    patient.interventions.append(intervention)
    return intervention


def get_patient_interventions(patient_id: str) -> List[DoctorIntervention]:
    """
    Retrieves the complete log of clinician interventions for a patient.
    """
    patient = get_patient(patient_id)
    if not patient:
        return []
    return patient.interventions


def get_patient_history(patient_id: str) -> List[CheckIn]:
    """
    Retrieves the complete check-in history for a patient in chronological order.
    """
    patient = get_patient(patient_id)
    if not patient:
        return []
    return patient.checkins


def get_latest_checkin(patient_id: str) -> Optional[CheckIn]:
    """
    Retrieves the most recent check-in for a patient, or None if no check-ins exist.
    """
    history = get_patient_history(patient_id)
    return history[-1] if history else None


def clear_store() -> None:
    """
    Clears all stored data (useful for resetting or seeding demos).
    """
    _patients.clear()


def get_triage_stats() -> Dict[str, Any]:
    """
    Computes aggregate metrics for the clinician dashboard:
    patient counts by triage status, adherence rates, and alert counts.
    """
    patients = list(_patients.values())
    total = len(patients)

    critical = sum(1 for p in patients if p.status == "CRITICAL")
    visit_requested = sum(1 for p in patients if p.status == "VISIT_REQUESTED")
    warning = sum(1 for p in patients if p.status == "WARNING")
    on_track = sum(1 for p in patients if p.status == "OK")
    resolved = sum(1 for p in patients if p.status == "RESOLVED")

    # Aggregate adherence across all recorded check-ins
    all_checkins = [c for p in patients for c in p.checkins]
    adherent_checkins = sum(1 for c in all_checkins if c.adherence)
    adherence_rate = round((adherent_checkins / len(all_checkins)) * 100, 1) if all_checkins else 100.0

    return {
        "total_patients": total,
        "critical_count": critical,
        "visit_requested_count": visit_requested,
        "warning_count": warning,
        "on_track_count": on_track,
        "resolved_count": resolved,
        "total_checkins_recorded": len(all_checkins),
        "adherence_rate_pct": adherence_rate,
        "cohort": "Acute Bacterial Sinusitis (Amoxicillin 10-Day)",
        "critical_checkpoint_day": 5,
    }
