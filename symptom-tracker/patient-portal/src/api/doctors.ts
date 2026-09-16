import request from './client';

export interface DoctorLoginResponse {
  doctor_id: string;
  name: string;
  token: string;
}

export function loginDoctor(email: string, password: string): Promise<DoctorLoginResponse> {
  // Since the backend doesn't have a specific doctor auth endpoint yet,
  // we'll simulate a successful clinical login for demo purposes.
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (password === 'medicurve123') {
        resolve({
          doctor_id: 'D100',
          name: 'Dr. Sarah',
          token: 'D100-TOKEN',
        });
      } else {
        reject(new Error('Invalid clinician credentials. Demo password is medicurve123'));
      }
    }, 600);
  });
}
