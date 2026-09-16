import { History } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePatient } from '../hooks/usePatient';
import { PatientHeader } from '../components/PatientHeader';
import { ClinicianTimeline } from '../components/ClinicianTimeline';
import { SkeletonCard } from '../components/Skeleton';

export function PatientHistory() {
  const { patientId } = useAuth();
  const { patient, loading } = usePatient(patientId);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PatientHeader />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '28px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <History size={24} color="#0ea5e9" /> Care History
          </h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>
            A chronological log of clinician actions taken during your treatment.
          </p>
        </div>

        <div className="card animate-fade-in-up" style={{ padding: 28 }}>
          {loading ? (
            <>
              <SkeletonCard height={100} />
              <div style={{ marginTop: 16 }}><SkeletonCard height={100} /></div>
            </>
          ) : (
            <ClinicianTimeline interventions={patient?.interventions ?? []} />
          )}
        </div>
      </main>
    </div>
  );
}
