import request from './client';
import type { LoginResponse } from '../types';

export async function loginPatient(patient_id: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ patient_id, password }),
  });
}
