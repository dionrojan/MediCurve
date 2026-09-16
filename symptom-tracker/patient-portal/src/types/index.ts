// Shared TypeScript types mirroring the FastAPI Pydantic models

export type SeverityLevel = 'OK' | 'WARNING' | 'CRITICAL' | 'RESOLVED' | 'VISIT_REQUESTED';

export type InterventionAction =
  | 'REQUEST_IMMEDIATE_VISIT'
  | 'SWITCH_MEDICATION'
  | 'DISCONTINUE_ALLERGY'
  | 'COUNSEL_ADHERENCE'
  | 'ORDER_LABS'
  | 'CONFIRM_RECOVERY';

export type VisitUrgency = 'IMMEDIATE_ER' | 'SAME_DAY_CLINIC' | 'NEXT_DAY_CLINIC';

export interface Symptoms {
  facial_pain: number;
  congestion: number;
  fever: boolean;
  energy: number;
}

export interface SideEffects {
  rash: boolean;
  diarrhea: boolean;
  nausea: boolean;
}

export interface Alert {
  severity: SeverityLevel;
  category: string;
  message: string;
  timestamp: string;
}

export interface CheckIn {
  id: string;
  patient_id: string;
  day: number;
  timestamp: string;
  symptoms: Symptoms;
  side_effects: SideEffects;
  adherence: boolean;
  raw_notes: string | null;
  alerts: Alert[];
}

export interface DoctorIntervention {
  id: string;
  patient_id: string;
  action: InterventionAction;
  notes: string;
  prescribed_medication: string | null;
  requires_immediate_visit: boolean;
  visit_urgency: VisitUrgency | null;
  patient_message: string | null;
  doctor_name: string;
  timestamp: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  diagnosis: string;
  medication: string;
  start_date: string;
  checkins: CheckIn[];
  interventions: DoctorIntervention[];
  status: SeverityLevel;
  active_visit_notice: DoctorIntervention | null;
}

export interface LoginResponse {
  patient_id: string;
  name: string;
  token: string;
}

export interface ParsedNote {
  source: string;
  symptom_mentions: string[];
  severity_guess: number;
  red_flag_keywords: string[];
}

export interface ParsedCheckIn {
  facial_pain: number;
  congestion: number;
  fever: boolean;
  energy: number;
  rash: boolean;
  nausea: boolean;
  diarrhea: boolean;
}

export interface BaselineTrajectory {
  [day: string]: {
    facial_pain: number;
    congestion: number;
    fever: boolean;
    energy: number;
  };
}

export interface BaselineResponse {
  trajectory: BaselineTrajectory;
  expected_side_effects: { rash: boolean; diarrhea: boolean; nausea: boolean };
  critical_checkpoint_day: number;
}

export const MILESTONE_DAYS = [1, 3, 5, 7, 9] as const;

export type MilestoneDay = typeof MILESTONE_DAYS[number];
