import { User, Calendar, Pill, Stethoscope } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePatient } from '../hooks/usePatient';
import { PatientHeader } from '../components/PatientHeader';
import { formatDate } from '../utils/formatters';

export function PatientProfile() {
  const { patientId } = useAuth();
  const { patient } = usePatient(patientId);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PatientHeader />
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '28px 24px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>My Profile</h1>

        {/* Avatar */}
        <div className="card animate-fade-in-up" style={{ padding: 32, textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg,#0ea5e9,#0d9488)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', color: 'white', fontWeight: 800, fontSize: 28,
          }}>
            {patient?.name?.charAt(0) ?? 'P'}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{patient?.name}</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>Patient ID: {patient?.id}</p>
        </div>

        {/* Details */}
        <div className="card animate-fade-in-up animate-delay-100" style={{ padding: 28 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 20 }}>Treatment Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ProfileRow icon={<User size={16} />} label="Age" value={patient?.age ? `${patient.age} years` : '—'} />
            <ProfileRow icon={<Stethoscope size={16} />} label="Diagnosis" value={patient?.diagnosis ?? '—'} />
            <ProfileRow icon={<Pill size={16} />} label="Current Medication" value={patient?.medication ?? '—'} />
            <ProfileRow icon={<Calendar size={16} />} label="Treatment Started" value={patient?.start_date ? formatDate(patient.start_date) : '—'} />
            <ProfileRow icon={<User size={16} />} label="Assigned Doctor" value="Dr. Sarah Lin, MD" />
            <ProfileRow icon={<Stethoscope size={16} />} label="Clinic" value="MediCurve Outpatient Clinic" />
          </div>
        </div>
      </main>
    </div>
  );
}

function ProfileRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: '#f0f9ff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#0ea5e9', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>{label.toUpperCase()}</p>
        <p style={{ fontSize: 15, color: '#0f172a', fontWeight: 500 }}>{value}</p>
      </div>
    </div>
  );
}
