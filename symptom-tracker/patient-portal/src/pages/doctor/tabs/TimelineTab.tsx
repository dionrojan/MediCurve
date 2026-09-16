import { useOutletContext } from 'react-router-dom';
import { Activity, Stethoscope, AlertTriangle, Calendar, MessageSquare } from 'lucide-react';
import type { Patient, CheckIn, DoctorIntervention, Alert } from '../../../types';

export function TimelineTab() {
  const { patient } = useOutletContext<{ patient: Patient }>();

  // Combine Check-ins, Alerts, and Interventions into a single chronological timeline
  type TimelineEvent = 
    | { type: 'CHECK_IN'; date: Date; data: CheckIn }
    | { type: 'ALERT'; date: Date; data: Alert; checkInDay: number }
    | { type: 'INTERVENTION'; date: Date; data: DoctorIntervention };

  const events: TimelineEvent[] = [];

  patient.checkins.forEach(c => {
    events.push({ type: 'CHECK_IN', date: new Date(c.timestamp), data: c });
    c.alerts.forEach(a => {
      events.push({ type: 'ALERT', date: new Date(a.timestamp), data: a, checkInDay: c.day });
    });
  });

  patient.interventions.forEach(i => {
    events.push({ type: 'INTERVENTION', date: new Date(i.timestamp), data: i });
  });

  // Sort descending (newest first)
  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  if (events.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No events recorded for this patient.</div>;
  }

  return (
    <div style={{ padding: '32px 48px', maxWidth: 800 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 32 }}>Longitudinal Clinical Journey</h2>
      
      <div style={{ position: 'relative', paddingLeft: 24 }}>
        {/* Timeline Line */}
        <div style={{ position: 'absolute', left: 8, top: 24, bottom: 0, width: 2, background: '#e2e8f0' }} />

        {events.map((event, index) => {
          const isLast = index === events.length - 1;
          return (
            <div key={index} style={{ position: 'relative', marginBottom: isLast ? 0 : 32 }}>
              {event.type === 'CHECK_IN' && <CheckInEvent data={event.data} />}
              {event.type === 'ALERT' && <AlertEvent data={event.data} day={event.checkInDay} />}
              {event.type === 'INTERVENTION' && <InterventionEvent data={event.data} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CheckInEvent({ data }: { data: CheckIn }) {
  return (
    <div style={eventCardStyle}>
      <div style={iconDotStyle('#0ea5e9', '#e0f2fe')}><Activity size={16} /></div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>Patient Check-in: Day {data.day}</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{new Date(data.timestamp).toLocaleString()}</div>
      </div>
      <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><span style={{ color: '#64748b' }}>Pain:</span> <strong>{data.symptoms.facial_pain}/5</strong></div>
          <div><span style={{ color: '#64748b' }}>Congestion:</span> <strong>{data.symptoms.congestion}/5</strong></div>
          <div><span style={{ color: '#64748b' }}>Energy:</span> <strong>{data.symptoms.energy}/5</strong></div>
          <div><span style={{ color: '#64748b' }}>Adherence:</span> <strong>{data.adherence ? 'Yes' : 'No'}</strong></div>
        </div>
        {data.raw_notes && (
          <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 12, display: 'flex', gap: 8 }}>
            <MessageSquare size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
            <span style={{ color: '#334155', fontStyle: 'italic' }}>"{data.raw_notes}"</span>
          </div>
        )}
      </div>
    </div>
  );
}

function AlertEvent({ data, day }: { data: Alert, day: number }) {
  const isCritical = data.severity === 'CRITICAL';
  return (
    <div style={{ ...eventCardStyle, border: `1px solid ${isCritical ? '#fca5a5' : '#fcd34d'}`, background: isCritical ? '#fef2f2' : '#fffbeb' }}>
      <div style={iconDotStyle(isCritical ? '#dc2626' : '#d97706', isCritical ? '#fef2f2' : '#fffbeb')}><AlertTriangle size={16} /></div>
      <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, color: isCritical ? '#991b1b' : '#92400e', fontSize: 15 }}>
          {isCritical ? 'CRITICAL ALERT' : 'WARNING'}
        </div>
        <div style={{ fontSize: 13, color: isCritical ? '#b91c1c' : '#b45309' }}>{new Date(data.timestamp).toLocaleString()}</div>
      </div>
      <div style={{ color: isCritical ? '#7f1d1d' : '#78350f', fontSize: 14 }}>
        <strong>{data.category.replace(/_/g, ' ')}</strong>
        <p style={{ margin: '4px 0 0' }}>{data.message}</p>
      </div>
    </div>
  );
}

function InterventionEvent({ data }: { data: DoctorIntervention }) {
  return (
    <div style={{ ...eventCardStyle, border: '1px solid #cbd5e1', background: '#f8fafc' }}>
      <div style={iconDotStyle('#334155', '#f1f5f9')}><Stethoscope size={16} /></div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>Clinician Intervention</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{new Date(data.timestamp).toLocaleString()}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
        <div style={{ color: '#0f172a', fontWeight: 600 }}>Action: {data.action.replace(/_/g, ' ')}</div>
        
        {data.prescribed_medication && (
          <div><span style={{ color: '#64748b' }}>Prescription updated to:</span> <strong>{data.prescribed_medication}</strong></div>
        )}
        
        {data.requires_immediate_visit && (
          <div style={{ color: '#c2410c', fontWeight: 600 }}>Urgent Visit Requested: {data.visit_urgency?.replace(/_/g, ' ')}</div>
        )}
        
        <div style={{ background: 'white', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>CLINICAL RATIONALE</div>
          <div style={{ color: '#334155' }}>{data.notes}</div>
        </div>
        
        <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>
          Action taken by {data.doctor_name}
        </div>
      </div>
    </div>
  );
}

const eventCardStyle = {
  background: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: 20,
  position: 'relative' as const,
  marginLeft: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
};

const iconDotStyle = (color: string, bg: string) => ({
  position: 'absolute' as const,
  left: -40,
  top: 20,
  width: 32,
  height: 32,
  borderRadius: '50%',
  background: bg,
  color: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: `2px solid ${color}`,
  zIndex: 1
});
