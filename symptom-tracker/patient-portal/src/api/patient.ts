import request from './client';
import type { Patient, CheckIn, DoctorIntervention, BaselineResponse } from '../types';

export function getPatient(patientId: string): Promise<Patient> {
  return request<Patient>(`/patients/${patientId}`);
}

export function getPatientHistory(patientId: string): Promise<CheckIn[]> {
  return request<CheckIn[]>(`/patients/${patientId}/history`);
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
