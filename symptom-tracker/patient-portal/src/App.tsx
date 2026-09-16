import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PatientLogin }    from './pages/PatientLogin';
import { PatientDashboard } from './pages/PatientDashboard';
import { PatientCheckIn }  from './pages/PatientCheckIn';
import { PatientRecovery } from './pages/PatientRecovery';
import { PatientHistory }  from './pages/PatientHistory';
import { PatientProfile }  from './pages/PatientProfile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<PatientLogin />} />

          <Route path="/patient/dashboard" element={
            <ProtectedRoute><PatientDashboard /></ProtectedRoute>
          } />
          <Route path="/patient/checkin" element={
            <ProtectedRoute><PatientCheckIn /></ProtectedRoute>
          } />
          <Route path="/patient/recovery" element={
            <ProtectedRoute><PatientRecovery /></ProtectedRoute>
          } />
          <Route path="/patient/history" element={
            <ProtectedRoute><PatientHistory /></ProtectedRoute>
          } />
          <Route path="/patient/profile" element={
            <ProtectedRoute><PatientProfile /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
