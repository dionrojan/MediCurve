import { useOutletContext } from 'react-router-dom';
import { Pill, Activity, Calendar, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { Patient } from '../../../types';

export function OverviewTab() {
  const { patient } = useOutletContext<{ patient: Patient }>();

  const latestCheckIn = patient.checkins.length > 0 
    ? patient.checkins[patient.checkins.length - 1] 
    : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, padding: 32 }}>
      
      {/* Main Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Current Treatment */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Pill size={20} color="#0ea5e9" /> Current Treatment
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>PRESCRIPTION</div>
                <div style={{ fontSize: 16, color: '#0f172a', fontWeight: 500 }}>{patient.medication}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>DIAGNOSIS</div>
                <div style={{ fontSize: 16, color: '#0f172a', fontWeight: 500 }}>{patient.diagnosis}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>START DATE</div>
                <div style={{ fontSize: 15, color: '#334155' }}>
                  <Calendar size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  {new Date(patient.start_date).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>TREATMENT DAY</div>
                <div style={{ fontSize: 15, color: '#334155' }}>Day {latestCheckIn ? latestCheckIn.day : 1} of 10</div>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Check-in Detail */}
        {latestCheckIn ? (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={20} color="#0ea5e9" /> Latest Patient Report
            </h2>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
              Submitted on {new Date(latestCheckIn.timestamp).toLocaleString()}
            </div>
            
            {latestCheckIn.raw_notes && (
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 20, borderLeft: '4px solid #cbd5e1' }}>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>PATIENT NOTES</div>
                <p style={{ color: '#334155', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>"{latestCheckIn.raw_notes}"</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <MetricBox label="Facial Pain" value={`${latestCheckIn.symptoms.facial_pain} / 5`} />
              <MetricBox label="Congestion" value={`${latestCheckIn.symptoms.congestion} / 5`} />
              <MetricBox label="Energy Level" value={`${latestCheckIn.symptoms.energy} / 5`} />
              <MetricBox label="Fever" value={latestCheckIn.symptoms.fever ? 'Yes' : 'No'} highlight={latestCheckIn.symptoms.fever} />
            </div>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center', color: '#64748b' }}>
            No check-ins recorded yet.
          </div>
        )}

      </div>

      {/* Right Column (Clinical Snapshot) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Snapshot Panel */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ background: '#0f172a', color: 'white', padding: '16px 20px', fontWeight: 600, fontSize: 15 }}>
            Clinical Snapshot
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <SnapshotRow label="Status" value={
              <span style={{ fontWeight: 700, color: getStatusColor(patient.status) }}>{patient.status}</span>
            } />
            <SnapshotRow label="Adherence" value={
              latestCheckIn?.adherence 
                ? <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}><ShieldCheck size={14} /> Confirmed</span>
                : <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={14} /> Reported Missed</span>
            } />
            <SnapshotRow label="Safety Flags" value={
              latestCheckIn?.side_effects.rash || latestCheckIn?.side_effects.diarrhea || latestCheckIn?.side_effects.nausea ? (
                <span style={{ color: '#dc2626', fontWeight: 600 }}>Active</span>
              ) : <span style={{ color: '#64748b' }}>None</span>
            } />
            
            <div style={{ height: 1, background: '#e2e8f0', margin: '4px 0' }} />
            
            <SnapshotRow label="Interventions" value={patient.interventions.length.toString()} />
            <SnapshotRow label="Alerts" value={
              patient.checkins.reduce((acc, c) => acc + c.alerts.length, 0).toString()
            } />
          </div>
        </div>

      </div>
    </div>
  );
}

function MetricBox({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div style={{ 
      padding: '12px 16px', borderRadius: 8, 
      background: highlight ? '#fef2f2' : '#f8fafc', 
      border: highlight ? '1px solid #fecaca' : '1px solid #e2e8f0' 
    }}>
      <div style={{ fontSize: 12, color: highlight ? '#991b1b' : '#64748b', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, color: highlight ? '#b91c1c' : '#0f172a', fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function SnapshotRow({ label, value }: { label: string, value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ color: '#0f172a', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'CRITICAL': return '#dc2626';
    case 'WARNING': return '#d97706';
    case 'VISIT_REQUESTED': return '#ea580c';
    case 'RESOLVED': return '#475569';
    case 'OK': default: return '#16a34a';
  }
}
