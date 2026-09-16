import { AlertTriangle, AlertOctagon, Calendar } from 'lucide-react';
import type { DoctorIntervention } from '../types';
import { formatDateTime } from '../utils/formatters';
import { useState } from 'react';

interface Props {
  notice: DoctorIntervention;
}

const URGENCY_CONFIG: Record<string, { bg: string; border: string; text: string; label: string; icon: typeof AlertTriangle }> = {
  IMMEDIATE_ER:    { bg: '#fff1f2', border: '#fecdd3', text: '#991b1b', label: 'Immediate — Go to Emergency Room', icon: AlertOctagon },
  SAME_DAY_CLINIC: { bg: '#fff7ed', border: '#fed7aa', text: '#9a3412', label: 'Same-Day Clinic Visit Required',    icon: AlertTriangle },
  NEXT_DAY_CLINIC: { bg: '#fefce8', border: '#fef08a', text: '#854d0e', label: 'Next-Day Clinic Visit Required',    icon: AlertTriangle },
};

export function UrgentNotice({ notice }: Props) {
  const [expanded, setExpanded] = useState(false);
  const config = URGENCY_CONFIG[notice.visit_urgency ?? 'SAME_DAY_CLINIC'];
  const Icon = config.icon;

  return (
    <div className="animate-fade-in-up" style={{
      background: config.bg,
      border: `1.5px solid ${config.border}`,
      borderRadius: 16,
      padding: '20px 24px',
      marginBottom: 24,
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        {/* Pulsing icon */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: config.text, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={22} color="white" />
          </div>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: `2px solid ${config.text}`,
            animation: 'pulse-ring 1.5s ease-out infinite',
          }} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: config.text }}>
              Immediate Medical Notice
            </span>
            <span style={{
              background: config.text, color: 'white',
              fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
              letterSpacing: '0.05em',
            }}>
              {config.label}
            </span>
          </div>

          <p style={{ color: config.text, fontSize: 15, fontWeight: 500, marginBottom: 8, opacity: 0.9 }}>
            {notice.patient_message || 'Your clinician has requested an urgent in-person evaluation. Please follow the instructions below.'}
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: config.text, opacity: 0.8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={13} />
              {formatDateTime(notice.timestamp)}
            </span>
            <span>Dr. {notice.doctor_name}</span>
          </div>

          {expanded && (
            <div style={{
              marginTop: 16, padding: 16,
              background: 'white', borderRadius: 12,
              border: `1px solid ${config.border}`,
            }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: config.text, marginBottom: 6 }}>Clinical Notes</p>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{notice.notes}</p>
            </div>
          )}

          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              marginTop: 12, background: config.text, color: 'white',
              border: 'none', borderRadius: 10, padding: '8px 18px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {expanded ? 'Hide Instructions' : 'View Full Instructions'}
          </button>
        </div>
      </div>
    </div>
  );
}
