import { useState } from 'react';
import { ChevronDown, ChevronUp, Thermometer, Wind, Zap, Activity } from 'lucide-react';
import type { CheckIn } from '../types';
import { formatDate, getStatusColor, getStatusLabel } from '../utils/formatters';

interface Props {
  checkins: CheckIn[];
}

export function CheckInHistory({ checkins }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const sorted = [...checkins].reverse();

  if (!checkins.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
        <Activity size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
        <p style={{ fontWeight: 500 }}>No check-ins recorded yet</p>
        <p style={{ fontSize: 13, marginTop: 4 }}>Your check-in history will appear here.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sorted.map(c => {
        const topAlert = c.alerts[0];
        const status = topAlert?.severity ?? 'OK';
        const isOpen = expanded === c.id;

        return (
          <div key={c.id} style={{
            border: '1px solid #e2e8f0', borderRadius: 14,
            overflow: 'hidden', transition: 'box-shadow 0.2s',
          }}>
            {/* Header */}
            <button
              onClick={() => setExpanded(isOpen ? null : c.id)}
              style={{
                width: '100%', background: 'white',
                border: 'none', cursor: 'pointer',
                padding: '16px 20px', display: 'flex',
                alignItems: 'center', gap: 16, textAlign: 'left',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: '#f0f9ff', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontWeight: 800, fontSize: 13, color: '#0ea5e9',
              }}>
                D{c.day}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Day {c.day}</span>
                  <span className={`${getStatusColor(status as any)}`} style={{
                    padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  }}>
                    {getStatusLabel(status as any)}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{formatDate(c.timestamp)}</p>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }} className="hide-mobile">
                <Metric icon={<Activity size={14} />} label="Pain" value={c.symptoms.facial_pain} max={5} />
                <Metric icon={<Wind size={14} />} label="Congestion" value={c.symptoms.congestion} max={5} />
              </div>
              {isOpen ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
            </button>

            {/* Expanded */}
            {isOpen && (
              <div style={{ borderTop: '1px solid #f1f5f9', padding: '20px 24px', background: '#fafbfc' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))',
                  gap: 12, marginBottom: 16,
                }}>
                  <StatBadge icon={<Activity size={14} />} label="Facial Pain" value={`${c.symptoms.facial_pain}/5`} />
                  <StatBadge icon={<Wind size={14} />} label="Congestion" value={`${c.symptoms.congestion}/5`} />
                  <StatBadge icon={<Thermometer size={14} />} label="Fever" value={c.symptoms.fever ? 'Yes' : 'No'} />
                  <StatBadge icon={<Zap size={14} />} label="Energy" value={`${c.symptoms.energy}/5`} />
                </div>

                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12, fontSize: 13 }}>
                  {c.side_effects.rash && <Tag color="#dc2626">Rash/Hives</Tag>}
                  {c.side_effects.diarrhea && <Tag color="#d97706">Diarrhea</Tag>}
                  {c.side_effects.nausea && <Tag color="#d97706">Nausea</Tag>}
                  <span style={{ color: '#64748b' }}>
                    Adherence: <strong>{c.adherence ? 'Yes' : 'No'}</strong>
                  </span>
                </div>

                {c.raw_notes && (
                  <div style={{
                    background: 'white', border: '1px solid #e2e8f0',
                    borderRadius: 10, padding: '12px 16px',
                  }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>YOUR NOTE</p>
                    <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{c.raw_notes}</p>
                  </div>
                )}

                {c.alerts.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    {c.alerts.map((a, i) => (
                      <div key={i} style={{
                        padding: '8px 12px', borderRadius: 8, marginBottom: 6,
                        background: a.severity === 'CRITICAL' ? '#fff1f2' :
                                    a.severity === 'WARNING' ? '#fff7ed' : '#f0fdf4',
                        fontSize: 13, color: a.severity === 'CRITICAL' ? '#991b1b' :
                                             a.severity === 'WARNING' ? '#92400e' : '#14532d',
                      }}>
                        [{a.severity}] {a.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      <style>{`@media(max-width:768px){.hide-mobile{display:none!important}}`}</style>
    </div>
  );
}

function Metric({ icon, label, value, max }: { icon: React.ReactNode; label: string; value: number; max: number }) {
  return (
    <div style={{ textAlign: 'center', fontSize: 12, color: '#64748b' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center', marginBottom: 2 }}>
        {icon} {label}
      </div>
      <strong style={{ color: '#0f172a' }}>{value}/{max}</strong>
    </div>
  );
}

function StatBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      background: 'white', border: '1px solid #e2e8f0',
      borderRadius: 10, padding: '10px 14px',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ color: '#0ea5e9' }}>{icon}</span>
      <div>
        <p style={{ fontSize: 11, color: '#94a3b8' }}>{label}</p>
        <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{value}</p>
      </div>
    </div>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      background: color + '15', color,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 600,
    }}>{children}</span>
  );
}
