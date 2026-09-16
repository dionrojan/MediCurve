import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { DoctorAuthProvider } from './hooks/useDoctorAuth';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PatientLogin }    from './pages/PatientLogin';
import { PatientDashboard } from './pages/PatientDashboard';
import { PatientCheckIn }  from './pages/PatientCheckIn';
import { PatientRecovery } from './pages/PatientRecovery';
import { PatientHistory }  from './pages/PatientHistory';
import { PatientProfile }  from './pages/PatientProfile';
import { PatientSignUp }   from './pages/PatientSignUp';
import { DemoSwitcher }    from './components/DemoSwitcher';
import { DoctorLogin }     from './pages/doctor/DoctorLogin';
import { DoctorLayout }    from './components/doctor/DoctorLayout';
import { DoctorProtectedRoute } from './routes/DoctorProtectedRoute';
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { PatientList } from './pages/doctor/PatientList';
import { PatientRecordLayout } from './pages/doctor/PatientRecordLayout';
import { OverviewTab } from './pages/doctor/tabs/OverviewTab';
import { TimelineTab } from './pages/doctor/tabs/TimelineTab';
import { CheckInsTab } from './pages/doctor/tabs/CheckInsTab';
import { RecoveryTab } from './pages/doctor/tabs/RecoveryTab';
import { MedicationsTab } from './pages/doctor/tabs/MedicationsTab';
import { AlertsTab } from './pages/doctor/tabs/AlertsTab';
import { InterventionsTab } from './pages/doctor/tabs/InterventionsTab';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DoctorAuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<PatientLogin />} />
            <Route path="/signup" element={<PatientSignUp />} />
            <Route path="/doctor/login" element={<DoctorLogin />} />

            <Route path="/doctor" element={
              <DoctorProtectedRoute>
                <DoctorLayout />
              </DoctorProtectedRoute>
            }>
              <Route path="dashboard" element={<DoctorDashboard />} />
              <Route path="patients" element={<PatientList />} />
              <Route path="priority-queue" element={<div>Priority Queue Coming Soon</div>} />
              
              <Route path="patients/:patientId" element={<PatientRecordLayout />}>
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<OverviewTab />} />
                <Route path="timeline" element={<TimelineTab />} />
                <Route path="check-ins" element={<CheckInsTab />} />
                <Route path="recovery" element={<RecoveryTab />} />
                <Route path="medications" element={<MedicationsTab />} />
                <Route path="alerts" element={<AlertsTab />} />
                <Route path="interventions" element={<InterventionsTab />} />
              </Route>
            </Route>

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
          <DemoSwitcher />
        </DoctorAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
