import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, ShieldCheck, CheckCircle2, UserPlus, FileText } from 'lucide-react';
import { createPatient } from '../api/patient';

export function PatientSignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [diagnosis, setDiagnosis] = useState('Acute Bacterial Sinusitis');
  const [medication, setMedication] = useState('Amoxicillin 875mg BID (10-day course)');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successId, setSuccessId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) { setError('Please enter a valid age (1-120).'); return; }

    setLoading(true);
    try {
      const patient = await createPatient({
        name: name.trim(),
        age: ageNum,
        diagnosis,
        medication,
      });
      setSuccessId(patient.id);
    } catch (e: any) {
      setError(e.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (successId) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f8fafc', padding: 24,
      }}>
        <div className="card animate-fade-in-up" style={{ padding: 48, maxWidth: 500, textAlign: 'center', width: '100%' }}>
          <CheckCircle2 size={64} color="#16a34a" style={{ margin: '0 auto 20px', display: 'block' }} />
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Registration Complete!</h2>
          <p style={{ fontSize: 16, color: '#475569', marginBottom: 28, lineHeight: 1.6 }}>
            Your account has been created successfully. Please save your Patient ID, as you will need it to sign in.
          </p>
          
          <div style={{
            background: '#f0f9ff', border: '2px dashed #bae6fd',
            borderRadius: 16, padding: '24px', marginBottom: 32,
          }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#0284c7', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Your Patient ID
            </p>
            <p style={{ fontSize: 40, fontWeight: 800, color: '#0369a1', letterSpacing: '0.05em' }}>
              {successId}
            </p>
          </div>

          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
            Demo password is: <code style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: 4 }}>medicurve123</code>
          </p>
          
          <button className="btn-primary" onClick={() => navigate('/login')} style={{ width: '100%', fontSize: 16, padding: 16 }}>
            Sign In to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 40%, #f0fdfa 100%)',
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '60px 80px',
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%)',
      }} className="hide-mobile">
        <div style={{ maxWidth: 440 }}>
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
          <h1 style={{ fontSize: 44, fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.03em' }}>
            Start tracking your recovery.
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, marginBottom: 40 }}>
            Join MediCurve to stay connected with your care team. 
            Get proactive monitoring and instant clinical feedback directly from your phone.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Feature icon={<UserPlus />} text="Quick 1-minute registration" />
            <Feature icon={<FileText />} text="AI-powered symptom extraction" />
            <Feature icon={<ShieldCheck />} text="Secure HIPAA-compliant data" />
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        width: '100%', maxWidth: 540, display: 'flex',
        flexDirection: 'column', justifyContent: 'center',
        padding: '40px 48px', background: 'white',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.08)',
        overflowY: 'auto'
      }}>
        {/* Mobile logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }} className="show-mobile">
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

        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Create an Account
        </h2>
        <p style={{ fontSize: 15, color: '#64748b', marginBottom: 32 }}>
          Already have an account? <Link to="/login" style={{ color: '#0ea5e9', fontWeight: 600, textDecoration: 'none' }}>Sign In here.</Link>
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, color: '#374151', marginBottom: 6 }}>Full Name</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. John Doe"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#0ea5e9')}
              onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, color: '#374151', marginBottom: 6 }}>Age</label>
            <input
              type="number" value={age} onChange={e => setAge(e.target.value)}
              placeholder="e.g. 45"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#0ea5e9')}
              onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, color: '#374151', marginBottom: 6 }}>Clinical Diagnosis</label>
            <select 
              value={diagnosis} onChange={e => setDiagnosis(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#0ea5e9')}
              onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
            >
              <option value="Acute Bacterial Sinusitis">Acute Bacterial Sinusitis</option>
              <option value="Community Acquired Pneumonia">Community Acquired Pneumonia</option>
              <option value="Urinary Tract Infection">Urinary Tract Infection</option>
            </select>
          </div>

          <div style={{ marginBottom: 32 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, color: '#374151', marginBottom: 6 }}>Prescribed Medication</label>
            <input
              type="text" value={medication} onChange={e => setMedication(e.target.value)}
              placeholder="e.g. Amoxicillin 875mg BID"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#0ea5e9')}
              onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
            />
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
              In a real scenario, diagnosis and medication would be pre-populated by your clinic.
            </p>
          </div>

          {error && (
            <div style={{
              background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10, padding: '12px 16px',
              fontSize: 14, color: '#991b1b', marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '16px', fontSize: 16 }}>
            {loading ? 'Creating Account…' : 'Create Account'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24, padding: '12px 16px', background: '#f0fdf4', borderRadius: 12 }}>
          <ShieldCheck size={18} color="#16a34a" />
          <p style={{ fontSize: 13, color: '#15803d', fontWeight: 500, lineHeight: 1.5 }}>
            Your data is securely stored and never shared outside your care team.
          </p>
        </div>
      </div>

      <style>{`
        @media(max-width:768px){
          .hide-mobile{display:none!important}
          .show-mobile{display:flex!important}
          div[style*="max-width: 540px"]{max-width:100%!important;padding:32px 24px!important}
        }
        @media(min-width:769px){.show-mobile{display:none!important}}
      `}</style>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '14px 16px',
  border: '1.5px solid #e2e8f0', borderRadius: 12,
  fontSize: 15, outline: 'none', transition: 'border-color 0.15s',
  fontFamily: 'inherit', background: 'white', color: '#0f172a'
};

function Feature({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        {icon}
      </div>
      <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: 15, fontWeight: 500 }}>{text}</span>
    </div>
  );
}
