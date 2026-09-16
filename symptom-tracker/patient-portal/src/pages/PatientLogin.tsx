import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { loginPatient } from '../api/auth';
import { useAuth } from '../hooks/useAuth';

const DEMO_USERS = [
  { id: 'P101', name: 'Marcus Vance',  label: '🟢 On Track',           password: 'medicurve123' },
  { id: 'P102', name: 'Elena Rostova', label: '🔴 Treatment Failure',   password: 'medicurve123' },
  { id: 'P103', name: 'David Kim',     label: '🔴 Allergic Reaction',   password: 'medicurve123' },
];

export function PatientLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [patientId, setPatientId] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!patientId.trim()) { setError('Patient ID is required.'); return; }
    if (!password.trim()) { setError('Password is required.'); return; }
    setLoading(true);
    try {
      const res = await loginPatient(patientId.trim(), password);
      login(res.patient_id, res.name, res.token);
      navigate('/patient/dashboard');
    } catch (e: any) {
      setError(e.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (id: string, pw: string) => {
    setPatientId(id);
    setPassword(pw);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 40%, #f0fdfa 100%)',
    }}>
      {/* Left panel — hero */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '60px 80px',
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%)',
      }} className="hide-mobile">
        <div style={{ maxWidth: 420 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Activity size={26} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 24, color: 'white', letterSpacing: '-0.02em' }}>
              MediCurve
            </span>
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: 20, letterSpacing: '-0.03em' }}>
            Your recovery,<br />monitored continuously.
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, marginBottom: 40 }}>
            Stay connected with your care team during your treatment.
            Check in daily, track your progress, and get support when you need it.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              '✓ Daily symptom check-ins in under 60 seconds',
              '✓ Real-time recovery tracking vs. baseline',
              '✓ Instant clinician alerts when you need them',
            ].map(item => (
              <p key={item} style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: 500 }}>{item}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{
        width: '100%', maxWidth: 520, display: 'flex',
        flexDirection: 'column', justifyContent: 'center',
        padding: '40px 48px', background: 'white',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.08)',
      }}>
        {/* Mobile logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }} className="show-mobile">
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg,#0ea5e9,#0d9488)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={20} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 20, color: '#0f172a' }}>
            Medi<span style={{ color: '#0ea5e9' }}>Curve</span>
          </span>
        </div>

        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.02em' }}>
          Welcome back
        </h2>
        <p style={{ fontSize: 15, color: '#64748b', marginBottom: 36 }}>
          Stay connected to your recovery.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Patient ID */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, color: '#374151', marginBottom: 6 }}>
              Patient ID
            </label>
            <input
              type="text"
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              placeholder="e.g. P101"
              autoComplete="username"
              style={{
                width: '100%', padding: '12px 16px',
                border: '1.5px solid #e2e8f0', borderRadius: 12,
                fontSize: 15, outline: 'none', transition: 'border-color 0.15s',
                fontFamily: 'inherit',
              }}
              onFocus={e => (e.target.style.borderColor = '#0ea5e9')}
              onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, color: '#374151', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{
                  width: '100%', padding: '12px 44px 12px 16px',
                  border: '1.5px solid #e2e8f0', borderRadius: 12,
                  fontSize: 15, outline: 'none', transition: 'border-color 0.15s',
                  fontFamily: 'inherit',
                }}
                onFocus={e => (e.target.style.borderColor = '#0ea5e9')}
                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
              />
              <button
                type="button" onClick={() => setShowPw(s => !s)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                  padding: 4,
                }}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <a href="#" style={{ fontSize: 13, color: '#0ea5e9', textDecoration: 'none', fontWeight: 500 }}>
                Forgot password?
              </a>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fff1f2', border: '1px solid #fecdd3',
              borderRadius: 10, padding: '10px 14px',
              fontSize: 14, color: '#991b1b', marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '14px', fontSize: 16 }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 24 }}>
          Don't have an account? <Link to="/signup" style={{ color: '#0ea5e9', fontWeight: 600, textDecoration: 'none' }}>Register here</Link>
        </p>

        {/* Security note */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginTop: 24, padding: '10px 14px',
          background: '#f0fdf4', borderRadius: 10,
        }}>
          <ShieldCheck size={16} color="#16a34a" />
          <p style={{ fontSize: 13, color: '#15803d', fontWeight: 500 }}>
            Your health information is protected.
          </p>
        </div>

        {/* Demo accounts */}
        <div style={{ marginTop: 28 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Demo Accounts
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {DEMO_USERS.map(u => (
              <button
                key={u.id}
                onClick={() => fillDemo(u.id, u.password)}
                style={{
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                  borderRadius: 10, padding: '10px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                  transition: 'border-color 0.15s',
                  color: '#374151',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = '#0ea5e9')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0')}
              >
                <span><strong>{u.id}</strong> — {u.name}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{u.label}</span>
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8, textAlign: 'center' }}>
            Password for all demo accounts: <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>medicurve123</code>
          </p>
        </div>
      </div>

      <style>{`
        @media(max-width:768px){
          .hide-mobile{display:none!important}
          .show-mobile{display:flex!important}
          div[style*="max-width: 520px"]{max-width:100%!important;padding:32px 24px!important}
        }
        @media(min-width:769px){.show-mobile{display:none!important}}
      `}</style>
    </div>
  );
}
