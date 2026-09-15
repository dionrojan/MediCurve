"""
FastAPI application entrypoint.
Exposes REST endpoints for patient triage, check-in ingestion,
natural language symptom parsing, and clinical baseline reference.
"""

from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from .models import Patient, CheckIn, Symptoms, SideEffects, Alert
    from .baseline import (
        BASELINE_TRAJECTORY,
        EXPECTED_SIDE_EFFECTS,
        CRITICAL_CHECKPOINT_DAY,
    )
    from .alert_engine import evaluate_checkin
    from .parser import parse_text
    from .seed_data import seed_demo_data
    from . import store
except (ImportError, ValueError):
    from models import Patient, CheckIn, Symptoms, SideEffects, Alert
    from baseline import (
        BASELINE_TRAJECTORY,
        EXPECTED_SIDE_EFFECTS,
        CRITICAL_CHECKPOINT_DAY,
    )
    from alert_engine import evaluate_checkin
    from parser import parse_text
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


@app.post("/parse-note")
def parse_note(payload: ParseNoteRequest):
    """
    Parses unstructured patient notes using Groq Cloud LLM (llama-3.1-8b-instant),
    with automatic deterministic keyword fallback.
    """
    return parse_text(payload.text)


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
