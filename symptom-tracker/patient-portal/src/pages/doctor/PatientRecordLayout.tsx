import { useState, useEffect } from 'react';
import { useParams, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import { getPatient } from '../../api/patient';
import type { Patient } from '../../types';
import { ClinicalActionsMenu } from '../../components/doctor/actions/ClinicalActionsMenu';

export function PatientRecordLayout() {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      setLoading(true);
      getPatient(patientId)
        .then(data => setPatient(data))
        .finally(() => setLoading(false));
    }
  }, [patientId]);

  if (loading) return <div style={{ padding: 40 }}>Loading patient record...</div>;
  if (!patient) return <div style={{ padding: 40, color: '#ef4444' }}>Patient not found.</div>;

  const tabs = [
    { name: 'Overview', path: 'overview' },
    { name: 'Timeline', path: 'timeline' },
    { name: 'Check-ins', path: 'check-ins' },
    { name: 'Recovery', path: 'recovery' },
    { name: 'Medications', path: 'medications' },
    { name: 'Alerts', path: 'alerts' },
    { name: 'Interventions', path: 'interventions' }
  ];

  const currentTab = location.pathname.split('/').pop();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <button
          onClick={() => navigate('/doctor/patients')}
          style={{
            background: 'none', border: 'none', color: '#64748b', display: 'flex',
            alignItems: 'center', gap: 4, cursor: 'pointer', fontWeight: 600, fontSize: 14,
            marginBottom: 16
          }}
        >
          <ChevronLeft size={18} /> Back to Patients
        </button>

        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
                {patient.name}
                <span style={{ fontSize: 16, fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '4px 8px', borderRadius: 6 }}>
                  {patient.id}
                </span>
              </h1>
              <div style={{ display: 'flex', gap: 16, color: '#475569', fontSize: 14 }}>
                <span>{patient.age} years old</span>
                <span>•</span>
                <span>{patient.diagnosis}</span>
                <span>•</span>
                <span>Day {patient.checkins.length > 0 ? patient.checkins[patient.checkins.length - 1].day : 1} of 10</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ ...getStatusStyle(patient.status), padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
                {patient.status}
              </span>
              <ClinicalActionsMenu 
                patientId={patient.id} 
                onActionComplete={() => {
                  // Refetch patient data to show new intervention and status
                  setLoading(true);
                  getPatient(patient.id).then(data => setPatient(data)).finally(() => setLoading(false));
                }} 
              />
            </div>
          </div>

          {/* Alert Strip if Critical */}
          {patient.status === 'CRITICAL' && (
            <div style={{ background: '#fef2f2', borderTop: '1px solid #fecaca', padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertTriangle size={20} color="#dc2626" />
              <span style={{ color: '#991b1b', fontWeight: 600, fontSize: 14 }}>
                Active Critical Alert: Patient requires immediate review.
              </span>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', borderTop: '1px solid #e2e8f0', padding: '0 32px', overflowX: 'auto' }}>
            {tabs.map(tab => (
              <Link
                key={tab.path}
                to={`/doctor/patients/${patient.id}/${tab.path}`}
                style={{
                  padding: '16px 20px', textDecoration: 'none', fontSize: 14, fontWeight: currentTab === tab.path ? 700 : 500,
                  color: currentTab === tab.path ? '#0ea5e9' : '#64748b',
                  borderBottom: currentTab === tab.path ? '2px solid #0ea5e9' : '2px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                {tab.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Outlet for Tab Content */}
      <Outlet context={{ patient }} />
    </div>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'CRITICAL': return { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' };
    case 'WARNING': return { background: '#fefce8', color: '#a16207', border: '1px solid #fef08a' };
    case 'VISIT_REQUESTED': return { background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' };
    case 'RESOLVED': return { background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' };
    case 'OK': default: return { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' };
  }
}
