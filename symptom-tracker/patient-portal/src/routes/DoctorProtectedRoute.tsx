import React from 'react';
import { Navigate } from 'react-router-dom';
import { useDoctorAuth } from '../hooks/useDoctorAuth';

export function DoctorProtectedRoute({ children }: { children: React.ReactNode }) {
  const { doctorId } = useDoctorAuth();

  if (!doctorId) {
    return <Navigate to="/doctor/login" replace />;
  }

  return <>{children}</>;
}
