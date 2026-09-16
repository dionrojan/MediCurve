import { useAuth } from '../hooks/useAuth';

const PERSONAS = [
  { id: 'P101', name: 'Marcus Vance', scenario: 'On Track' },
  { id: 'P102', name: 'Elena Rostova', scenario: 'Treatment Ineffective' },
  { id: 'P103', name: 'David Kim', scenario: 'Allergic Reaction' },
];

interface Props {
  onSwitch: (id: string, name: string) => void;
}

export function DemoSwitcher({ onSwitch }: Props) {
  const { patientId } = useAuth();

  if (!import.meta.env.DEV) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 999,
      background: '#1e293b', borderRadius: 16, padding: '16px 20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)', minWidth: 220,
    }}>
      <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, marginBottom: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Demo Persona Switcher
      </p>
      {PERSONAS.map(p => (
        <button
          key={p.id}
          onClick={() => onSwitch(p.id, p.name)}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            background: patientId === p.id ? '#0ea5e9' : '#334155',
            border: 'none', borderRadius: 10, padding: '8px 12px',
            cursor: 'pointer', marginBottom: 6, color: 'white',
            fontSize: 13, fontWeight: 500,
            transition: 'background 0.15s',
          }}
        >
          <span style={{ fontWeight: 700 }}>{p.id}</span> — {p.name}
          <br />
          <span style={{ fontSize: 11, opacity: 0.7 }}>{p.scenario}</span>
        </button>
      ))}
    </div>
  );
}
