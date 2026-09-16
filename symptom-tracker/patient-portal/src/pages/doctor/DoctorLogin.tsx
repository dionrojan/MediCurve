import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Lock, Eye, EyeOff } from 'lucide-react';
import { useDoctorAuth } from '../../hooks/useDoctorAuth';
import { loginDoctor } from '../../api/doctors';

export function DoctorLogin() {
  const navigate = useNavigate();
  const { login } = useDoctorAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginDoctor(email, password);
      login(res.doctor_id, res.name, res.token);
      navigate('/doctor/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('dr.sarah@medicurve.clinic');
    setPassword('medicurve123');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f1f5f9'
    }}>
      <div className="card animate-fade-in-up" style={{ width: '100%', maxWidth: 440, padding: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20
          }}>
            <Stethoscope size={28} color="white" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
            Welcome to MediCurve
          </h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>
            Clinician Patient Records
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, color: '#334155', marginBottom: 8 }}>
              Doctor ID / Email
            </label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. dr.sarah@medicurve.clinic"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 12,
                border: '1.5px solid #e2e8f0', outline: 'none', fontSize: 15
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, color: '#334155', marginBottom: 8 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: 16, top: 15 }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{
                  width: '100%', padding: '14px 16px 14px 44px', borderRadius: 12,
                  border: '1.5px solid #e2e8f0', outline: 'none', fontSize: 15
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 16, top: 15,
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0
                }}
              >
                {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '12px',
              fontSize: 14, color: '#991b1b', marginBottom: 24
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '14px', fontSize: 16, marginBottom: 16, background: '#0f172a' }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <button
          type="button"
          onClick={fillDemo}
          style={{
            width: '100%', padding: '12px', fontSize: 14, color: '#475569',
            background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 12, cursor: 'pointer'
          }}
        >
          Use Demo Doctor Credentials
        </button>
      </div>
    </div>
  );
}
