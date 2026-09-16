import request from './client';
import type { Patient, CheckIn, DoctorIntervention, BaselineResponse, InterventionAction, VisitUrgency } from '../types';

export function getPatient(patientId: string): Promise<Patient> {
  return request<Patient>(`/patients/${patientId}`);
}

export interface CreatePatientPayload {
  name: string;
  age: number;
  diagnosis?: string;
  medication?: string;
}

export function createPatient(payload: CreatePatientPayload): Promise<Patient> {
  return request<Patient>('/patients', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getPatientHistory(patientId: string): Promise<CheckIn[]> {
  return request<CheckIn[]>(`/patients/${patientId}/history`);
}

export function getAllPatients(sortByPriority: boolean = true): Promise<Patient[]> {
  return request<Patient[]>(`/patients?sort_by_priority=${sortByPriority}`);
}

export interface InterventionPayload {
  action: InterventionAction;
  notes: string;
  prescribed_medication?: string;
  requires_immediate_visit?: boolean;
  visit_urgency?: VisitUrgency;
  patient_message?: string;
  doctor_name?: string;
}

export function recordIntervention(patientId: string, payload: InterventionPayload): Promise<DoctorIntervention> {
  return request<DoctorIntervention>(`/patients/${patientId}/intervene`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface UrgentVisitPayload {
  urgency: VisitUrgency;
  notes: string;
  patient_message: string;
  doctor_name?: string;
}

export function requestUrgentVisit(patientId: string, payload: UrgentVisitPayload): Promise<DoctorIntervention> {
  return request<DoctorIntervention>(`/patients/${patientId}/urgent-visit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
export function getPatientInterventions(patientId: string): Promise<DoctorIntervention[]> {
  return request<DoctorIntervention[]>(`/patients/${patientId}/interventions`);
}

export function getBaseline(): Promise<BaselineResponse> {
  return request<BaselineResponse>('/baseline');
}

export interface CheckInPayload {
  day: number;
  symptoms: {
    facial_pain: number;
    congestion: number;
    fever: boolean;
    energy: number;
  };
  side_effects: {
    rash: boolean;
    diarrhea: boolean;
    nausea: boolean;
  };
  adherence: boolean;
  raw_notes?: string;
}

export function submitCheckIn(patientId: string, payload: CheckInPayload): Promise<CheckIn> {
  return request<CheckIn>(`/patients/${patientId}/checkin`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
