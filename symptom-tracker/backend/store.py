from typing import Dict, List, Optional

try:
    from .models import Patient, CheckIn
    from .alert_engine import evaluate_checkin
except (ImportError, ValueError):
    from models import Patient, CheckIn
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
    CRITICAL first, then WARNING, then OK.
    """
    patients = list(_patients.values())
    if sort_by_priority:
        priority_rank = {"CRITICAL": 0, "WARNING": 1, "OK": 2}
        patients.sort(key=lambda p: priority_rank.get(p.status, 3))
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

    # Append to patient's check-in timeline (automatically updates patient.status)
    patient.checkins.append(checkin)
    return checkin


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
