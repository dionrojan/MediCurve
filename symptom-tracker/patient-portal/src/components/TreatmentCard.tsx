import { Pill, Calendar, Clock } from 'lucide-react';
import { parseMedication, formatDate } from '../utils/formatters';

interface Props {
  medication: string;
  startDate: string;
  treatmentDay: number;
  totalDays?: number;
}

export function TreatmentCard({ medication, startDate, treatmentDay, totalDays = 10 }: Props) {
  const med = parseMedication(medication);
  const progress = Math.min((treatmentDay / totalDays) * 100, 100);

  return (
    <div className="card animate-fade-in-up" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Pill size={18} color="#0ea5e9" />
        </div>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Active Treatment</span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
          {med.name}
        </p>
        <p style={{ fontSize: 15, color: '#475569', fontWeight: 500 }}>
          {med.dose} {med.frequency}
        </p>
        {med.name !== med.raw && (
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{med.raw}</p>
        )}
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
            Day {treatmentDay} of {totalDays}
          </span>
          <span style={{ fontSize: 13, color: '#0ea5e9', fontWeight: 600 }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div style={{ height: 10, background: '#e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 5,
            background: 'linear-gradient(90deg, #0ea5e9, #0d9488)',
            width: `${progress}%`,
            transition: 'width 0.8s ease',
          }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 11, color: '#94a3b8', marginTop: 4,
        }}>
          <span>Day 1</span>
          <span>Day {totalDays}</span>
        </div>
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
          <Calendar size={14} />
          Started {formatDate(startDate)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
          <Clock size={14} />
          {totalDays - treatmentDay} days remaining
        </div>
      </div>
    </div>
  );
}
