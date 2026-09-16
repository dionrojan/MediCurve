"""
FastAPI application entrypoint.
Exposes REST endpoints for patient triage, check-in ingestion,
natural language symptom parsing, and clinical baseline reference.
"""

from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional
from datetime import date
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from .models import (
        Patient,
        CheckIn,
        Symptoms,
        SideEffects,
        Alert,
        DoctorIntervention,
        InterventionAction,
        VisitUrgency,
    )
    from .baseline import (
        BASELINE_TRAJECTORY,
        EXPECTED_SIDE_EFFECTS,
        CRITICAL_CHECKPOINT_DAY,
    )
    from .alert_engine import evaluate_checkin
    from .parser import parse_text, map_note_to_checkin
    from .seed_data import seed_demo_data
    from . import store
except (ImportError, ValueError):
    from models import (
        Patient,
        CheckIn,
        Symptoms,
        SideEffects,
        Alert,
        DoctorIntervention,
        InterventionAction,
        VisitUrgency,
    )
    from baseline import (
        BASELINE_TRAJECTORY,
        EXPECTED_SIDE_EFFECTS,
        CRITICAL_CHECKPOINT_DAY,
    )
    from alert_engine import evaluate_checkin
    from parser import parse_text, map_note_to_checkin
    from seed_data import seed_demo_data
    import store


# -------------------------------------------------------------------
# Request Models
# -------------------------------------------------------------------
class CheckInRequest(BaseModel):
    day: int = Field(..., ge=1, le=14, description="Treatment day number")
    symptoms: Symptoms
    side_effects: Optional[SideEffects] = Field(default_factory=SideEffects)
    adherence: bool = Field(default=True, description="Whether prescribed doses were taken as directed")
    raw_notes: Optional[str] = Field(default=None, description="Patient's free-text notes")


class CreatePatientRequest(BaseModel):
    id: Optional[str] = Field(default=None, description="Optional custom ID (e.g. P104)")
    name: str = Field(..., min_length=1, description="Patient full name")
    age: int = Field(..., ge=1, le=120, description="Patient age")
    diagnosis: str = Field(default="Acute Bacterial Sinusitis", description="Clinical diagnosis")
    medication: str = Field(default="Amoxicillin 875mg BID (10-day course)", description="Prescribed medication")
    start_date: Optional[date] = Field(default=None, description="Treatment start date")


class ParseNoteRequest(BaseModel):
    text: str = Field(..., description="Free-text symptom notes from patient")


class InterventionRequest(BaseModel):
    action: InterventionAction
    notes: str = Field(..., min_length=2, description="Clinical rationale charted by the physician")
    prescribed_medication: Optional[str] = Field(default=None, description="Updated medication if switched")
    requires_immediate_visit: bool = Field(default=False, description="Whether an in-person visit is requested")
    visit_urgency: Optional[VisitUrgency] = Field(default=None, description="Urgency level for clinic visit")
    patient_message: Optional[str] = Field(default=None, description="Notification message sent to patient")
    doctor_name: str = Field(default="Attending Physician", description="Physician taking action")


class UrgentVisitRequest(BaseModel):
    urgency: VisitUrgency = Field(default="SAME_DAY_CLINIC", description="Level of urgency")
    notes: str = Field(..., min_length=2, description="Clinical reason for in-person recall")
    patient_message: str = Field(..., min_length=5, description="Instructions dispatched to patient")
    doctor_name: str = Field(default="Attending Physician")


# -------------------------------------------------------------------
# Auth Request Models
# -------------------------------------------------------------------
DEMO_PASSWORD = "medicurve123"

class LoginRequest(BaseModel):
    patient_id: str = Field(..., description="Patient ID (e.g. P101)")
    password: str = Field(..., description="Patient portal password")


class LoginResponse(BaseModel):
    patient_id: str
    name: str
    token: str  # In demo mode this is just the patient_id; swap for JWT in production


# -------------------------------------------------------------------
# Lifespan: Auto-seed on startup
# -------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-seed the 3 demo personas on startup if store is empty
    if not store.list_patients():
        seed_demo_data(reset_first=False)
    yield


# -------------------------------------------------------------------
# FastAPI App & Middleware
# -------------------------------------------------------------------
app = FastAPI(
    title="Symptom Tracker Clinical Triage API",
    description="Proactive continuous monitoring for Acute Bacterial Sinusitis on a 10-day Amoxicillin course.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------------------------
# Routes
# -------------------------------------------------------------------
@app.post("/auth/login", response_model=LoginResponse)
def patient_login(payload: LoginRequest):
    """
    Demo patient authentication.
    Verifies the patient_id exists in the store and checks the shared demo password.
    In production, replace with proper JWT-based authentication.
    """
    patient = store.get_patient(payload.patient_id.upper())
    if not patient:
        raise HTTPException(status_code=401, detail="Invalid Patient ID or password.")
    if payload.password != DEMO_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid Patient ID or password.")
    return LoginResponse(
        patient_id=patient.id,
        name=patient.name,
        token=patient.id,  # Demo token: just the patient ID
    )


@app.get("/")
def get_root():
    """System health check & clinical cohort info."""
    return {
        "status": "healthy",
        "app": "Symptom Tracker Clinical Triage API",
        "cohort": "Acute Bacterial Sinusitis — Amoxicillin 875mg BID (10-day course)",
        "critical_checkpoint_day": CRITICAL_CHECKPOINT_DAY,
    }


@app.get("/baseline")
def get_baseline():
    """Returns the clinical benchmark recovery curve and checkpoint definitions."""
    return {
        "trajectory": BASELINE_TRAJECTORY,
        "expected_side_effects": EXPECTED_SIDE_EFFECTS,
        "critical_checkpoint_day": CRITICAL_CHECKPOINT_DAY,
    }


@app.get("/patients", response_model=List[Patient])
def get_patients(sort_by_priority: bool = Query(True, description="Sort CRITICAL > WARNING > OK")):
    """
    Returns all active patients.
    By default, triages higher urgency patients to the top of the queue.
    """
    return store.list_patients(sort_by_priority=sort_by_priority)


@app.post("/patients", response_model=Patient)
def create_patient(payload: CreatePatientRequest):
    """
    Dynamically registers a new patient in the system.
    """
    import uuid
    patient_id = payload.id or f"P{uuid.uuid4().hex[:4].upper()}"
    if store.get_patient(patient_id):
        raise HTTPException(status_code=400, detail=f"Patient '{patient_id}' already exists.")

    from datetime import date
    new_patient = Patient(
        id=patient_id,
        name=payload.name,
        age=payload.age,
        diagnosis=payload.diagnosis,
        medication=payload.medication,
        start_date=payload.start_date or date.today(),
    )
    store.add_patient(new_patient)
    return new_patient


@app.get("/patients/{patient_id}", response_model=Patient)
def get_patient(patient_id: str):
    """Retrieves a single patient profile with their computed status and check-ins."""
    patient = store.get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")
    return patient


@app.get("/patients/{patient_id}/history", response_model=List[CheckIn])
def get_patient_history(patient_id: str):
    """Retrieves all past check-ins for the specified patient."""
    patient = store.get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")
    return store.get_patient_history(patient_id)


@app.post("/patients/{patient_id}/checkin", response_model=CheckIn)
def create_checkin(patient_id: str, payload: CheckInRequest):
    """
    Ingests a new check-in for a patient.
    Automatically evaluates symptoms against baseline trajectory, side effects,
    and checkpoint rules, generating prioritized clinical alerts.
    """
    patient = store.get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")

    checkin = CheckIn(
        patient_id=patient_id,
        day=payload.day,
        symptoms=payload.symptoms,
        side_effects=payload.side_effects or SideEffects(),
        adherence=payload.adherence,
        raw_notes=payload.raw_notes,
    )

    recorded = store.add_checkin(patient_id, checkin)
    return recorded


@app.post("/patients/{patient_id}/intervene", response_model=DoctorIntervention)
def record_intervention(patient_id: str, payload: InterventionRequest):
    """
    Records a clinical intervention (medication switch, allergy discontinuation, etc.).
    Automatically updates the patient's active medication if changed, and updates triage status.
    """
    patient = store.get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")

    intervention = DoctorIntervention(
        patient_id=patient_id,
        action=payload.action,
        notes=payload.notes,
        prescribed_medication=payload.prescribed_medication,
        requires_immediate_visit=payload.requires_immediate_visit,
        visit_urgency=payload.visit_urgency,
        patient_message=payload.patient_message,
        doctor_name=payload.doctor_name,
    )

    recorded = store.add_intervention(patient_id, intervention)
    return recorded


@app.post("/patients/{patient_id}/urgent-visit", response_model=DoctorIntervention)
def request_urgent_visit(patient_id: str, payload: UrgentVisitRequest):
    """
    Issues an immediate clinic recall / urgent visit notice for the patient.
    Sets patient's triage status to VISIT_REQUESTED and dispatches patient instructions.
    """
    patient = store.get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")

    intervention = DoctorIntervention(
        patient_id=patient_id,
        action="REQUEST_IMMEDIATE_VISIT",
        notes=payload.notes,
        requires_immediate_visit=True,
        visit_urgency=payload.urgency,
        patient_message=payload.patient_message,
        doctor_name=payload.doctor_name,
    )

    recorded = store.add_intervention(patient_id, intervention)
    return recorded


@app.get("/patients/{patient_id}/interventions", response_model=List[DoctorIntervention])
def get_patient_interventions(patient_id: str):
    """Returns all recorded physician interventions for the patient."""
    patient = store.get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")
    return store.get_patient_interventions(patient_id)


@app.post("/parse-note")
def parse_note(payload: ParseNoteRequest):
    """
    Parses unstructured patient notes using Groq Cloud LLM (llama-3.1-8b-instant),
    with automatic deterministic keyword fallback.
    """
    return parse_text(payload.text)


@app.post("/parse-to-checkin")
def parse_to_checkin(payload: ParseNoteRequest):
    """
    Analyzes a free-text patient note and extracts suggested structured
    check-in metrics (facial pain, congestion, fever, rash, etc.) for UI auto-fill.
    """
    return map_note_to_checkin(payload.text)


@app.get("/stats")
def get_stats():
    """
    Returns high-level triage statistics and clinical adherence metrics
    for the clinician overview dashboard.
    """
    return store.get_triage_stats()


@app.post("/seed")
def reset_and_seed():
    """Resets the store and reloads the 3 standardized demo personas."""
    patients = seed_demo_data(reset_first=True)
    return {
        "message": f"Successfully seeded {len(patients)} demo patients.",
        "patients": [p.name for p in patients],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
