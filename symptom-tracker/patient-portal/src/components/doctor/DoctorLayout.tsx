import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, AlertCircle, Bell, Search, LogOut } from 'lucide-react';
import { useDoctorAuth } from '../../hooks/useDoctorAuth';

export function DoctorLayout() {
  const { doctorName, logout } = useDoctorAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    window.location.href = '/doctor/login';
  };

  const navItems = [
    { name: 'Dashboard', path: '/doctor/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Patients', path: '/doctor/patients', icon: <Users size={20} /> },
    { name: 'Priority Queue', path: '/doctor/priority-queue', icon: <AlertCircle size={20} /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar */}
      <aside style={{
        width: 260,
        background: '#0f172a',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
        zIndex: 10
      }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 16 }}>⚕️</span>
            </div>
            MediCurve
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, marginLeft: 42 }}>Clinical Records</div>
        </div>

        <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderRadius: 8, color: isActive ? 'white' : '#94a3b8',
                  background: isActive ? '#1e293b' : 'transparent',
                  textDecoration: 'none', fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s'
                }}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid #1e293b' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, color: '#ef4444',
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 15, padding: '8px 12px', width: '100%'
            }}
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Header */}
        <header style={{
          height: 72, background: 'white', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px'
        }}>
          {/* Global Search Placeholder */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 8, padding: '8px 16px', width: 400 }}>
            <Search size={18} color="#64748b" style={{ marginRight: 12 }} />
            <input
              type="text"
              placeholder="Search patients by name or ID (Ctrl+K)..."
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 14 }}
            />
          </div>

          {/* Clinician Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <button style={{ background: 'none', border: 'none', position: 'relative', cursor: 'pointer' }}>
              <Bell size={20} color="#64748b" />
              <div style={{
                position: 'absolute', top: -2, right: -2, width: 8, height: 8,
                background: '#ef4444', borderRadius: '50%'
              }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderLeft: '1px solid #e2e8f0', paddingLeft: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {doctorName ? doctorName.charAt(0) : 'D'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{doctorName}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>Attending Physician</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
