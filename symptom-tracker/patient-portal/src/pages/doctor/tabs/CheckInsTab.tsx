import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ChevronDown, ChevronUp, Bot, FileText, CheckCircle2 } from 'lucide-react';
import type { Patient, CheckIn } from '../../../types';

export function CheckInsTab() {
  const { patient } = useOutletContext<{ patient: Patient }>();

  if (patient.checkins.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No check-ins recorded yet.</div>;
  }

  // Sort descending by day
  const sortedCheckIns = [...patient.checkins].sort((a, b) => b.day - a.day);

  return (
    <div style={{ padding: '32px 48px', maxWidth: 900 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Patient Check-ins</h2>
      <p style={{ color: '#64748b', marginBottom: 32 }}>View the raw patient notes alongside the AI-extracted symptom metrics.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {sortedCheckIns.map(checkIn => (
          <CheckInCard key={checkIn.id} data={checkIn} />
        ))}
      </div>
    </div>
  );
}

function CheckInCard({ data }: { data: CheckIn }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      
      {/* Header */}
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{ 
          padding: '20px 24px', display: 'flex', justifyContent: 'space-between', 
          alignItems: 'center', cursor: 'pointer', background: expanded ? '#f8fafc' : 'white',
          borderBottom: expanded ? '1px solid #e2e8f0' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#e0f2fe', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
            D{data.day}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 16 }}>Treatment Day {data.day}</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Submitted {new Date(data.timestamp).toLocaleString()}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {data.alerts.length > 0 && (
            <span style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', background: '#fef2f2', padding: '4px 12px', borderRadius: 20 }}>
              {data.alerts.length} Flag{data.alerts.length > 1 ? 's' : ''}
            </span>
          )}
          {expanded ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div style={{ padding: 24 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            
            {/* Raw Input Column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: '#475569', fontWeight: 600, fontSize: 14 }}>
                <FileText size={18} /> Raw Patient Input
              </div>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', minHeight: 120 }}>
                {data.raw_notes ? (
                  <p style={{ margin: 0, color: '#334155', fontStyle: 'italic', lineHeight: 1.6 }}>"{data.raw_notes}"</p>
                ) : (
                  <span style={{ color: '#94a3b8' }}>No free-text notes provided.</span>
                )}
              </div>

              {data.raw_parsed && (
                <div style={{ marginTop: 24, padding: 16, background: '#f5f3ff', borderRadius: 12, border: '1px solid #ede9fe' }}>
                  <div style={{ fontSize: 13, color: '#6d28d9', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Bot size={16} /> AI Summary Keywords
                  </div>
                  
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>SYMPTOMS DETECTED</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {data.raw_parsed.symptom_mentions?.length > 0 ? (
                        data.raw_parsed.symptom_mentions.map((s: string, idx: number) => (
                          <span key={idx} style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>{s}</span>
                        ))
                      ) : (
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>None detected</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>RED FLAGS DETECTED</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {data.raw_parsed.red_flag_keywords?.length > 0 ? (
                        data.raw_parsed.red_flag_keywords.map((r: string, idx: number) => (
                          <span key={idx} style={{ background: '#fce7f3', color: '#be185d', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>{r}</span>
                        ))
                      ) : (
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>None detected</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Adherence Report</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: data.adherence ? '#16a34a' : '#dc2626', fontWeight: 500 }}>
                  <CheckCircle2 size={18} /> {data.adherence ? 'Medication taken as prescribed' : 'Missed doses reported'}
                </div>
              </div>
            </div>

            {/* AI Extraction Column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: '#8b5cf6', fontWeight: 600, fontSize: 14 }}>
                <Bot size={18} /> AI Extracted Metrics
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <MetricBox label="Facial Pain" value={`${data.symptoms.facial_pain}/5`} />
                <MetricBox label="Congestion" value={`${data.symptoms.congestion}/5`} />
                <MetricBox label="Energy Level" value={`${data.symptoms.energy}/5`} />
                <MetricBox label="Fever" value={data.symptoms.fever ? 'Yes' : 'No'} alert={data.symptoms.fever} />
              </div>

              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Side Effects Filter</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <SideEffectBadge label="Rash" active={data.side_effects.rash} />
                  <SideEffectBadge label="Nausea" active={data.side_effects.nausea} />
                  <SideEffectBadge label="Diarrhea" active={data.side_effects.diarrhea} />
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

function MetricBox({ label, value, alert = false }: { label: string, value: string, alert?: boolean }) {
  return (
    <div style={{ 
      padding: '12px 16px', borderRadius: 8, 
      background: alert ? '#fef2f2' : 'white', 
      border: alert ? '1px solid #fecaca' : '1px solid #e2e8f0',
      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
    }}>
      <div style={{ fontSize: 12, color: alert ? '#991b1b' : '#64748b', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, color: alert ? '#b91c1c' : '#0f172a', fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function SideEffectBadge({ label, active }: { label: string, active: boolean }) {
  if (active) {
    return <span style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{label} (Active)</span>;
  }
  return <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, textDecoration: 'line-through' }}>{label}</span>;
}
