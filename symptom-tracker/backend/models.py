from datetime import datetime, date
from typing import List, Optional, Literal
import uuid
from pydantic import BaseModel, Field

try:
    from pydantic import computed_field
except ImportError:
    # Fallback for Pydantic v1 environments
    def computed_field(func):
        return property(func)

SeverityLevel = Literal["OK", "WARNING", "CRITICAL"]


class Symptoms(BaseModel):
    """
    Core symptoms tracked across the recovery timeline.
    Scales:
      - facial_pain: 0 (none) to 5 (severe)
      - congestion: 0 (clear) to 5 (completely blocked)
      - fever: True/False
      - energy: 1 (exhausted/bedridden) to 5 (normal/full energy)
    """
    facial_pain: int = Field(..., ge=0, le=5, description="Facial pain scale (0-5)")
    congestion: int = Field(..., ge=0, le=5, description="Nasal congestion scale (0-5)")
    fever: bool = Field(..., description="Presence of fever")
    energy: int = Field(..., ge=1, le=5, description="Energy level scale (1-5)")


class SideEffects(BaseModel):
    """
    Medication side effects that should NOT appear under expected recovery.
    """
    rash: bool = Field(default=False, description="Allergic rash / hives")
    diarrhea: bool = Field(default=False, description="Gastrointestinal side effect")
    nausea: bool = Field(default=False, description="Nausea")


class Alert(BaseModel):
    """
    Actionable clinical signal surfaced by the alert engine.
    """
    severity: SeverityLevel
    category: str  # e.g., "ADVERSE_REACTION", "TREATMENT_INEFFECTIVE", "ON_TRACK"
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class CheckIn(BaseModel):
    """
    Individual patient report for a specific treatment day.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    day: int = Field(..., ge=1, description="Treatment day number (e.g. 1, 3, 5)")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    symptoms: Symptoms
    side_effects: SideEffects = Field(default_factory=SideEffects)
    adherence: bool = Field(default=True, description="Whether prescribed doses were taken as directed")
    raw_notes: Optional[str] = Field(default=None, description="Patient's free-text notes")
    alerts: List[Alert] = Field(default_factory=list, description="Signals evaluated by alert engine")


def compute_patient_status(checkins: List[CheckIn]) -> SeverityLevel:
    """
    Derives the patient's current status based on their latest check-in alerts.
    Hierarchy: CRITICAL > WARNING > OK
    """
    if not checkins:
        return "OK"

    # Evaluate the most recent check-in
    latest_checkin = checkins[-1]
    if not latest_checkin.alerts:
        return "OK"

    severities = {alert.severity for alert in latest_checkin.alerts}
    if "CRITICAL" in severities:
        return "CRITICAL"
    if "WARNING" in severities:
        return "WARNING"
    return "OK"


class Patient(BaseModel):
    """
    Patient profile. Status is dynamically derived from check-in alerts.
    """
    id: str
    name: str
    age: int
    diagnosis: str
    medication: str
    start_date: date = Field(default_factory=date.today)
    checkins: List[CheckIn] = Field(default_factory=list)

    @computed_field
    @property
    def status(self) -> SeverityLevel:
        """Derived status from latest check-ins."""
        return compute_patient_status(self.checkins)
