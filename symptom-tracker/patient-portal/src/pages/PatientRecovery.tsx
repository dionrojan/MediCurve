import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePatient } from '../hooks/usePatient';
import { PatientHeader } from '../components/PatientHeader';
import { RecoveryChart } from '../components/RecoveryChart';
import { CheckInHistory } from '../components/CheckInHistory';
import { SkeletonCard } from '../components/Skeleton';
import { getBaseline } from '../api/patient';
import type { BaselineTrajectory } from '../types';

export function PatientRecovery() {
  const { patientId } = useAuth();
  const { patient, loading } = usePatient(patientId);
  const [baseline, setBaseline] = useState<BaselineTrajectory>({});

  useEffect(() => {
    getBaseline().then(b => setBaseline(b.trajectory)).catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PatientHeader />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <TrendingUp size={24} color="#0ea5e9" /> My Recovery
          </h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>Track how your symptoms have changed over time.</p>
        </div>

        {/* Chart */}
        <div className="card animate-fade-in-up" style={{ padding: 28, marginBottom: 24 }}>
          <h2 style={{ fontWeight: 700, fontSize: 17, color: '#0f172a', marginBottom: 4 }}>
            Symptom Trajectory
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
            Solid lines = your actual reported values. Dashed lines = configured recovery reference (not a universal medical standard).
          </p>

          {loading ? (
            <SkeletonCard height={280} />
          ) : patient ? (
            <RecoveryChart checkins={patient.checkins} baseline={baseline} />
          ) : (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>No data available.</p>
          )}
        </div>

        {/* History */}
        <div className="card animate-fade-in-up animate-delay-100" style={{ padding: 28 }}>
          <h2 style={{ fontWeight: 700, fontSize: 17, color: '#0f172a', marginBottom: 20 }}>
            Check-in History
          </h2>
          {loading ? (
            <SkeletonCard height={120} />
          ) : (
            <CheckInHistory checkins={patient?.checkins ?? []} />
          )}
        </div>
      </main>
    </div>
  );
}
