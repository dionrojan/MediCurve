import { useOutletContext } from 'react-router-dom';
import { Pill, Clock } from 'lucide-react';
import type { Patient } from '../../../types';

export function MedicationsTab() {
  const { patient } = useOutletContext<{ patient: Patient }>();

  return (
    <div style={{ padding: '32px 48px', maxWidth: 800 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Medication History</h2>
      
      <div style={{ background: '#f8fafc', border: '2px solid #0ea5e9', borderRadius: 16, padding: 24, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ background: '#e0f2fe', color: '#0ea5e9', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pill size={20} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#0ea5e9', fontWeight: 700, textTransform: 'uppercase' }}>Active Prescription</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{patient.medication}</div>
          </div>
        </div>
        <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>
          Patient has been on this treatment for {patient.checkins.length > 0 ? patient.checkins[patient.checkins.length - 1].day : 1} days.
        </p>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Clock size={18} color="#64748b" /> Prescription Changes
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {patient.interventions.filter(i => i.prescribed_medication).length === 0 ? (
          <div style={{ color: '#64748b', fontStyle: 'italic', padding: 16 }}>No medication changes have been made.</div>
        ) : (
          patient.interventions.filter(i => i.prescribed_medication).map(i => (
            <div key={i.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong style={{ color: '#0f172a' }}>Switched to {i.prescribed_medication}</strong>
                <span style={{ fontSize: 13, color: '#64748b' }}>{new Date(i.timestamp).toLocaleDateString()}</span>
              </div>
              <div style={{ fontSize: 14, color: '#475569' }}>Rationale: {i.notes}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
