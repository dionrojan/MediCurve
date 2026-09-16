import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { getMilestoneName } from '../utils/formatters';

type MilestoneState = 'completed' | 'current' | 'upcoming' | 'missed';

interface Milestone {
  day: number;
  state: MilestoneState;
}

interface Props {
  completedDays: number[];
  currentDay: number;
}

export function MilestoneTimeline({ completedDays, currentDay }: Props) {
  const allMilestones = [1, 3, 5, 7, 9];

  const milestones: Milestone[] = allMilestones.map(day => {
    if (completedDays.includes(day)) return { day, state: 'completed' };
    if (day <= currentDay) return { day, state: 'missed' };
    return { day, state: 'upcoming' };
  });

  // Mark the next uncompleted as current
  const nextIdx = milestones.findIndex(m => m.state !== 'completed');
  if (nextIdx !== -1 && milestones[nextIdx].state !== 'missed') {
    milestones[nextIdx] = { ...milestones[nextIdx], state: 'current' };
  }

  const config: Record<MilestoneState, { icon: React.ReactNode; dotBg: string; dotBorder: string; labelColor: string; lineColor: string }> = {
    completed: {
      icon: <CheckCircle2 size={20} color="#16a34a" />,
      dotBg: '#dcfce7', dotBorder: '#16a34a', labelColor: '#16a34a', lineColor: '#16a34a',
    },
    current: {
      icon: <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0ea5e9', animation: 'pulse 2s infinite' }} />,
      dotBg: '#0ea5e9', dotBorder: '#0ea5e9', labelColor: '#0ea5e9', lineColor: '#e2e8f0',
    },
    upcoming: {
      icon: <Circle size={20} color="#cbd5e1" />,
      dotBg: '#f8fafc', dotBorder: '#e2e8f0', labelColor: '#94a3b8', lineColor: '#e2e8f0',
    },
    missed: {
      icon: <AlertCircle size={20} color="#f59e0b" />,
      dotBg: '#fef3c7', dotBorder: '#f59e0b', labelColor: '#b45309', lineColor: '#f59e0b',
    },
  };

  return (
    <div className="card animate-fade-in-up animate-delay-200" style={{ padding: 24, overflow: 'hidden' }}>
      <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 24 }}>
        Treatment Milestones
      </h3>

      {/* Horizontal timeline — collapses to vertical on mobile */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        position: 'relative',
        overflowX: 'auto',
        paddingBottom: 8,
      }}>
        {milestones.map((m, i) => {
          const c = config[m.state];
          return (
            <div key={m.day} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              flex: 1, minWidth: 80, position: 'relative',
            }}>
              {/* Connector line */}
              {i < milestones.length - 1 && (
                <div style={{
                  position: 'absolute', top: 18, left: '50%', right: '-50%',
                  height: 2, background: c.lineColor, zIndex: 0,
                }} />
              )}

              {/* Dot */}
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: c.dotBg, border: `2px solid ${c.dotBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1, position: 'relative', flexShrink: 0,
                ...(m.state === 'current' && {
                  boxShadow: '0 0 0 6px rgba(14,165,233,0.15)',
                }),
              }}>
                {c.icon}
              </div>

              {/* Labels */}
              <div style={{ marginTop: 10, textAlign: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: c.labelColor }}>Day {m.day}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, lineHeight: 1.3 }}>
                  {getMilestoneName(m.day)}
                </p>
                {m.state === 'completed' && (
                  <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>✓ Done</span>
                )}
                {m.state === 'current' && (
                  <span style={{ fontSize: 10, color: '#0ea5e9', fontWeight: 600 }}>→ Next</span>
                )}
                {m.state === 'missed' && (
                  <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>! Missed</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
