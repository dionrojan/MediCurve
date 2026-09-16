import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { CheckIn, BaselineTrajectory } from '../types';

interface Props {
  checkins: CheckIn[];
  baseline: BaselineTrajectory;
}

const MILESTONE_DAYS = [1, 3, 5, 7, 9];

export function RecoveryChart({ checkins, baseline }: Props) {
  const data = MILESTONE_DAYS.map(day => {
    const actual = checkins.find(c => c.day === day);
    const exp = baseline[day.toString()];
    return {
      day: `Day ${day}`,
      'Facial Pain (Actual)': actual?.symptoms.facial_pain,
      'Congestion (Actual)': actual?.symptoms.congestion,
      'Facial Pain (Expected)': exp?.facial_pain,
      'Congestion (Expected)': exp?.congestion,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: 'white', border: '1px solid #e2e8f0',
        borderRadius: 12, padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}>
        <p style={{ fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            <span style={{ fontSize: 13, color: '#475569' }}>
              {p.name}: <strong>{p.value ?? '—'}</strong>
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 5]} ticks={[0,1,2,3,4,5]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
            iconType="circle" iconSize={8}
          />
          <ReferenceLine x="Day 5" stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'Checkpoint', fill: '#f59e0b', fontSize: 11 }} />

          {/* Actual */}
          <Line
            type="monotone" dataKey="Facial Pain (Actual)"
            stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 5, fill: '#0ea5e9' }}
            connectNulls={false} activeDot={{ r: 7 }}
          />
          <Line
            type="monotone" dataKey="Congestion (Actual)"
            stroke="#0d9488" strokeWidth={2.5} dot={{ r: 5, fill: '#0d9488' }}
            connectNulls={false} activeDot={{ r: 7 }}
          />

          {/* Expected (dashed) */}
          <Line
            type="monotone" dataKey="Facial Pain (Expected)"
            stroke="#93c5fd" strokeWidth={1.5} strokeDasharray="5 3"
            dot={false}
          />
          <Line
            type="monotone" dataKey="Congestion (Expected)"
            stroke="#5eead4" strokeWidth={1.5} strokeDasharray="5 3"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
