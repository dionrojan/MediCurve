import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, UserCheck, Users, ArrowRight } from 'lucide-react';
import { useDoctorAuth } from '../../hooks/useDoctorAuth';
import { getAllPatients } from '../../api/patient';
import type { Patient } from '../../types';

export function DoctorDashboard() {
  const { doctorName } = useDoctorAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllPatients(true).then(data => {
      setPatients(data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading dashboard...</div>;

  const critical = patients.filter(p => p.status === 'CRITICAL');
  const warnings = patients.filter(p => p.status === 'WARNING');
  const visitRequested = patients.filter(p => p.status === 'VISIT_REQUESTED');
  const onTrack = patients.filter(p => p.status === 'OK' || p.status === 'RESOLVED');

  const topPriority = patients.slice(0, 4); // First 4 since they are sorted by priority

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
          Good morning, {doctorName}
        </h1>
        <p style={{ color: '#64748b' }}>Clinical monitoring overview for all assigned patients.</p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 20, marginBottom: 40
      }}>
        <MetricCard title="Critical" value={critical.length} icon={<AlertTriangle size={24} color="#ef4444" />} color="#fef2f2" />
        <MetricCard title="Visit Requested" value={visitRequested.length} icon={<Activity size={24} color="#f97316" />} color="#fff7ed" />
        <MetricCard title="Warnings" value={warnings.length} icon={<AlertTriangle size={24} color="#eab308" />} color="#fefce8" />
        <MetricCard title="On Track" value={onTrack.length} icon={<UserCheck size={24} color="#22c55e" />} color="#f0fdf4" />
        <MetricCard title="Total Patients" value={patients.length} icon={<Users size={24} color="#3b82f6" />} color="#eff6ff" />
      </div>

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Patients Requiring Attention</h2>
          <button
            onClick={() => navigate('/doctor/priority-queue')}
            style={{ background: 'none', border: 'none', color: '#0ea5e9', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            View Full Queue <ArrowRight size={16} />
          </button>
        </div>
        <div>
          {topPriority.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No patients currently need attention.</div>
          ) : (
            topPriority.map(p => (
              <div
                key={p.id}
                onClick={() => navigate(`/doctor/patients/${p.id}`)}
                style={{
                  padding: '20px 24px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 16 }}>{p.name} <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>{p.id}</span></span>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Day {p.checkins.length > 0 ? p.checkins[p.checkins.length - 1].day : 1} • {p.medication}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                    ...getStatusStyle(p.status)
                  }}>
                    {p.status}
                  </span>
                  <ArrowRight size={18} color="#cbd5e1" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color }: { title: string, value: number, icon: any, color: string }) {
  return (
    <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500, marginTop: 4 }}>{title}</div>
      </div>
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
