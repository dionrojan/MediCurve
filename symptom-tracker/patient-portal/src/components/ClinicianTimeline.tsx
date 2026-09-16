import { Clock, Pill, MessageSquare, CheckCircle, AlertTriangle, TestTube, XCircle } from 'lucide-react';
import type { DoctorIntervention } from '../types';
import { formatDateTime, getInterventionLabel } from '../utils/formatters';

interface Props {
  interventions: DoctorIntervention[];
}

const ACTION_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  REQUEST_IMMEDIATE_VISIT: { icon: <AlertTriangle size={18} />, color: '#dc2626', bg: '#fff1f2' },
  SWITCH_MEDICATION:       { icon: <Pill size={18} />,          color: '#0ea5e9', bg: '#f0f9ff' },
  DISCONTINUE_ALLERGY:     { icon: <XCircle size={18} />,       color: '#d97706', bg: '#fff7ed' },
  COUNSEL_ADHERENCE:       { icon: <MessageSquare size={18} />, color: '#7c3aed', bg: '#ede9fe' },
  ORDER_LABS:              { icon: <TestTube size={18} />,       color: '#0d9488', bg: '#f0fdfa' },
  CONFIRM_RECOVERY:        { icon: <CheckCircle size={18} />,   color: '#16a34a', bg: '#dcfce7' },
};

export function ClinicianTimeline({ interventions }: Props) {
  if (!interventions.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
        <Clock size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
        <p style={{ fontWeight: 500 }}>No clinician actions recorded</p>
        <p style={{ fontSize: 13, marginTop: 4 }}>Physician interventions will appear here.</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Vertical line */}
      <div style={{
        position: 'absolute', left: 20, top: 24, bottom: 24,
        width: 2, background: '#e2e8f0',
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {[...interventions].reverse().map((itv) => {
          const cfg = ACTION_CONFIG[itv.action] ?? { icon: <Clock size={18} />, color: '#64748b', bg: '#f8fafc' };
          return (
            <div key={itv.id} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              {/* Icon dot */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: cfg.bg, border: `2px solid ${cfg.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color: cfg.color, zIndex: 1,
                boxShadow: '0 0 0 4px white',
              }}>
                {cfg.icon}
              </div>

              <div style={{
                flex: 1, background: 'white',
                border: '1px solid #e2e8f0', borderRadius: 14,
                padding: '16px 20px', marginTop: 4,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: cfg.color }}>
                    {getInterventionLabel(itv.action)}
                  </span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{formatDateTime(itv.timestamp)}</span>
                </div>

                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 8 }}>
                  {itv.notes}
                </p>

                {itv.prescribed_medication && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: '#f0f9ff', padding: '6px 14px', borderRadius: 20,
                    fontSize: 13, color: '#0284c7', fontWeight: 600, marginBottom: 8,
                  }}>
                    <Pill size={13} /> Updated to: {itv.prescribed_medication}
                  </div>
                )}

                {itv.patient_message && (
                  <div style={{
                    background: '#fafbfc', border: '1px solid #e2e8f0',
                    borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#475569',
                  }}>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>Message to you: </span>
                    {itv.patient_message}
                  </div>
                )}

                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                  Dr. {itv.doctor_name}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
