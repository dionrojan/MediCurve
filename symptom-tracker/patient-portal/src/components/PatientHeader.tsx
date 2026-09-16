import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, X, Activity, ClipboardList, TrendingUp, History } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const NAV = [
  { to: '/patient/dashboard', label: 'Dashboard', icon: Activity },
  { to: '/patient/checkin',   label: 'Check-in',  icon: ClipboardList },
  { to: '/patient/recovery',  label: 'My Recovery', icon: TrendingUp },
  { to: '/patient/history',   label: 'Care History', icon: History },
];

export function PatientHeader({ unreadCount = 0 }: { unreadCount?: number }) {
  const { patientName, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          display: 'flex', alignItems: 'center',
          padding: '0 24px', height: 64,
        }}>
          {/* Logo */}
          <Link to="/patient/dashboard" style={{
            display: 'flex', alignItems: 'center', gap: 10,
            textDecoration: 'none', flexShrink: 0,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg,#0ea5e9,#0d9488)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Activity size={20} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Medi<span style={{ color: '#0ea5e9' }}>Curve</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', gap: 4, marginLeft: 40, flex: 1 }} className="hide-mobile">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link key={to} to={to} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 10,
                  textDecoration: 'none', fontSize: 14, fontWeight: 500,
                  color: active ? '#0ea5e9' : '#475569',
                  background: active ? '#f0f9ff' : 'transparent',
                  transition: 'all 0.15s',
                }}>
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            {/* Notifications */}
            <Link to="/patient/profile" style={{ position: 'relative', display: 'flex' }}>
              <button className="btn-ghost" style={{ padding: '8px' }}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#dc2626', color: 'white',
                    fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{unreadCount}</span>
                )}
              </button>
            </Link>

            {/* Avatar + Name */}
            <Link to="/patient/profile" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              textDecoration: 'none', padding: '4px 8px', borderRadius: 10,
              transition: 'background 0.15s',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg,#0ea5e9,#0d9488)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: 13,
              }}>
                {patientName?.charAt(0) ?? 'P'}
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }} className="hide-mobile">
                {patientName}
              </span>
            </Link>

            {/* Logout */}
            <button className="btn-ghost" onClick={handleLogout} title="Sign out" style={{ padding: 8 }}>
              <LogOut size={18} />
            </button>

            {/* Mobile hamburger */}
            <button
              className="btn-ghost show-mobile"
              onClick={() => setMobileOpen(o => !o)}
              style={{ padding: 8 }}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div style={{
            background: 'white', borderTop: '1px solid #e2e8f0',
            padding: '12px 16px 20px', display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to} to={to}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 14px', borderRadius: 12,
                    textDecoration: 'none', fontSize: 15, fontWeight: 500,
                    color: active ? '#0ea5e9' : '#475569',
                    background: active ? '#f0f9ff' : 'transparent',
                  }}
                >
                  <Icon size={18} /> {label}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', borderRadius: 12,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#dc2626', fontSize: 15, fontWeight: 500, marginTop: 8,
              }}
            >
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        )}
      </header>

      <style>{`
        @media (max-width: 768px) { .hide-mobile { display: none !important; } }
        @media (min-width: 769px) { .show-mobile { display: none !important; } }
      `}</style>
    </>
  );
}
