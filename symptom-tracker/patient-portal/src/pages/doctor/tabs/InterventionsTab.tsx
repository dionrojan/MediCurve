import { useOutletContext } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import type { Patient } from '../../../types';

export function InterventionsTab() {
  const { patient } = useOutletContext<{ patient: Patient }>();

  const interventions = [...patient.interventions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div style={{ padding: '32px 48px', maxWidth: 800 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Clinical Interventions</h2>
      
      {interventions.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b', background: 'white', borderRadius: 16, border: '1px solid #e2e8f0' }}>
          No clinical interventions have been recorded.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {interventions.map(i => (
            <div key={i.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: '#f1f5f9', color: '#334155', padding: 8, borderRadius: 8 }}>
                    <Stethoscope size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{i.action.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>By {i.doctor_name}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{new Date(i.timestamp).toLocaleString()}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>CLINICAL NOTES</div>
                  <div style={{ color: '#334155' }}>{i.notes}</div>
                </div>
                
                {(i.prescribed_medication || i.requires_immediate_visit) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
                    {i.prescribed_medication && (
                      <div style={{ padding: 12, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                        <span style={{ display: 'block', fontSize: 12, color: '#1d4ed8', fontWeight: 600 }}>NEW MEDICATION</span>
                        <strong style={{ color: '#1e3a8a' }}>{i.prescribed_medication}</strong>
                      </div>
                    )}
                    {i.requires_immediate_visit && (
                      <div style={{ padding: 12, background: '#fff7ed', borderRadius: 8, border: '1px solid #fed7aa' }}>
                        <span style={{ display: 'block', fontSize: 12, color: '#c2410c', fontWeight: 600 }}>URGENT VISIT</span>
                        <strong style={{ color: '#9a3412' }}>{i.visit_urgency?.replace(/_/g, ' ')}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
