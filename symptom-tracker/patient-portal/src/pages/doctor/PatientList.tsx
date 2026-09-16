import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowRight, Activity, Calendar } from 'lucide-react';
import { getAllPatients } from '../../api/patient';
import type { Patient } from '../../types';

export function PatientList() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    getAllPatients(false).then(data => setPatients(data)).finally(() => setLoading(false));
  }, []);

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div style={{ padding: 20 }}>Loading patients...</div>;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
          All Patients
        </h1>
        <p style={{ color: '#64748b' }}>View and manage your assigned patient records.</p>
      </div>

      {/* Filters Bar */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 24, padding: 16,
        background: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <Search size={18} color="#94a3b8" style={{ marginRight: 12 }} />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 14 }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={18} color="#64748b" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0',
              background: 'white', outline: 'none', fontSize: 14, cursor: 'pointer'
            }}
          >
            <option value="All">All Statuses</option>
            <option value="CRITICAL">Critical</option>
            <option value="WARNING">Warning</option>
            <option value="VISIT_REQUESTED">Visit Requested</option>
            <option value="OK">On Track</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={thStyle}>Patient</th>
              <th style={thStyle}>Treatment Day</th>
              <th style={thStyle}>Current Medication</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  No patients found matching filters.
                </td>
              </tr>
            ) : (
              filteredPatients.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>ID: {p.id}</div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                      <Calendar size={16} color="#94a3b8" />
                      Day {p.checkins.length > 0 ? p.checkins[p.checkins.length - 1].day : 1} / 10
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontSize: 14, color: '#334155' }}>{p.medication}</div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      ...getStatusStyle(p.status)
                    }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => navigate(`/doctor/patients/${p.id}/overview`)}
                      style={{
                        padding: '6px 12px', background: 'transparent', border: '1px solid #cbd5e1',
                        borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#0f172a',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      Open Record <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = { padding: '16px 24px', fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };
const tdStyle = { padding: '16px 24px' };

function getStatusStyle(status: string) {
  switch (status) {
    case 'CRITICAL': return { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' };
    case 'WARNING': return { background: '#fefce8', color: '#a16207', border: '1px solid #fef08a' };
    case 'VISIT_REQUESTED': return { background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' };
    case 'RESOLVED': return { background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' };
    case 'OK': default: return { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' };
  }
}
