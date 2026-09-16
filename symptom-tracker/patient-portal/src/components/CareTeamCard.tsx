import { Phone, User } from 'lucide-react';

export function CareTeamCard() {
  return (
    <div className="card animate-fade-in-up animate-delay-100" style={{ padding: 24 }}>
      <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 16 }}>Your Care Team</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'linear-gradient(135deg,#0ea5e9,#0d9488)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <User size={22} color="white" />
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Dr. Sarah Lin, MD</p>
          <p style={{ fontSize: 13, color: '#64748b' }}>Assigned Clinician</p>
        </div>
      </div>
      <a href="tel:+919999999999" style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#f0f9ff', borderRadius: 10, padding: '10px 14px',
        textDecoration: 'none', color: '#0284c7', fontWeight: 500, fontSize: 14,
        transition: 'background 0.15s',
      }}>
        <Phone size={16} />
        Clinic: +91 99999 99999
      </a>
    </div>
  );
}
