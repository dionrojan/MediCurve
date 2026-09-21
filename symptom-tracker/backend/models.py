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
    timestamp: datetime = Field(default_factory=datetime.now)


class CheckIn(BaseModel):
    """
    Individual patient report for a specific treatment day.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    day: int = Field(..., ge=1, description="Treatment day number (e.g. 1, 3, 5)")
    timestamp: datetime = Field(default_factory=datetime.now)
    symptoms: Symptoms
    side_effects: SideEffects = Field(default_factory=SideEffects)
    adherence: bool = Field(default=True, description="Whether prescribed doses were taken as directed")
    raw_notes: Optional[str] = Field(default=None, description="Patient's free-text notes")
    raw_parsed: Optional[dict] = Field(default=None, description="AI extraction reasoning")
    alerts: List[Alert] = Field(default_factory=list, description="Signals evaluated by alert engine")


SeverityLevel = Literal["OK", "WARNING", "CRITICAL", "RESOLVED", "VISIT_REQUESTED"]

InterventionAction = Literal[
    "REQUEST_IMMEDIATE_VISIT",  # Urgent recall / in-person clinic visit
    "SWITCH_MEDICATION",        # e.g., switch to Augmentin on Day 5 failure
    "DISCONTINUE_ALLERGY",      # e.g., stop Amoxicillin immediately due to rash
    "COUNSEL_ADHERENCE",        # e.g., patient missed doses
    "ORDER_LABS",               # e.g., culture or CT scan
    "CONFIRM_RECOVERY",         # e.g., patient is on track
]

VisitUrgency = Literal["IMMEDIATE_ER", "SAME_DAY_CLINIC", "NEXT_DAY_CLINIC"]


class DoctorIntervention(BaseModel):
    """
    Clinician intervention action taken in response to triage signals.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    action: InterventionAction
    notes: str = Field(..., description="Clinical rationale charted by the physician")
    prescribed_medication: Optional[str] = Field(default=None, description="Updated medication if changed")
    requires_immediate_visit: bool = Field(default=False, description="Whether the patient is summoned for an urgent visit")
    visit_urgency: Optional[VisitUrgency] = Field(default=None, description="Urgency of the in-person visit")
    patient_message: Optional[str] = Field(default=None, description="Direct notification dispatched to the patient")
    doctor_name: str = Field(default="Attending Physician", description="Physician who took action")
    timestamp: datetime = Field(default_factory=datetime.now)


def compute_patient_status(
    checkins: List[CheckIn],
    interventions: Optional[List[DoctorIntervention]] = None,
) -> SeverityLevel:
    """
    Derives the patient's current status based on latest check-ins and physician interventions.
    If an immediate visit was summoned: VISIT_REQUESTED.
    If a critical issue was actively addressed by doctor: RESOLVED.
    Otherwise derives from latest check-in alerts: CRITICAL > WARNING > OK.
    """
    # 1. Check physician interventions first
    if interventions:
        latest_intervention = interventions[-1]
        if latest_intervention.requires_immediate_visit:
            return "VISIT_REQUESTED"

        # If doctor took decisive action (switched med, discontinued allergy, or confirmed recovery)
        if latest_intervention.action in ["SWITCH_MEDICATION", "DISCONTINUE_ALLERGY", "CONFIRM_RECOVERY"]:
            if checkins:
                latest_checkin = checkins[-1]
                t_itv = latest_intervention.timestamp.replace(tzinfo=None)
                t_chk = latest_checkin.timestamp.replace(tzinfo=None)
                if t_itv >= t_chk:
                    return "RESOLVED"
            else:
                return "RESOLVED"

    # 2. Derive from check-in alerts
    if not checkins:
        return "OK"

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
    Patient profile. Status is dynamically derived from check-in alerts and doctor interventions.
    """
    id: str
    name: str
    age: int
    diagnosis: str
    medication: str
    start_date: date = Field(default_factory=date.today)
    checkins: List[CheckIn] = Field(default_factory=list)
    interventions: List[DoctorIntervention] = Field(default_factory=list)

    @computed_field
    @property
    def status(self) -> SeverityLevel:
        """Derived status from latest check-ins and interventions."""
        return compute_patient_status(self.checkins, self.interventions)

    @computed_field
    @property
    def active_visit_notice(self) -> Optional[DoctorIntervention]:
        """Returns the latest active urgent visit notice if any."""
        for itv in reversed(self.interventions):
            if itv.requires_immediate_visit:
                return itv
        return None
