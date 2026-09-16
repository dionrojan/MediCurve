import { useState } from 'react';
import { Pill, AlertTriangle, ChevronDown, CheckCircle2 } from 'lucide-react';
import { recordIntervention, requestUrgentVisit } from '../../../api/patient';
import { useDoctorAuth } from '../../../hooks/useDoctorAuth';

export function ClinicalActionsMenu({ patientId, onActionComplete }: { patientId: string, onActionComplete: () => void }) {
  const { doctorName } = useDoctorAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'NONE' | 'SWITCH_MED' | 'URGENT_VISIT' | 'RESOLVE'>('NONE');
  
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [newMed, setNewMed] = useState('');
  const [urgency, setUrgency] = useState<'SAME_DAY_CLINIC' | 'IMMEDIATE_ER'>('SAME_DAY_CLINIC');
  const [patientMessage, setPatientMessage] = useState('');

  const handleAction = async () => {
    setLoading(true);
    try {
      if (activeModal === 'SWITCH_MED') {
        await recordIntervention(patientId, {
          action: 'SWITCH_MEDICATION',
          notes,
          prescribed_medication: newMed,
          doctor_name: doctorName || 'Attending Physician'
        });
      } else if (activeModal === 'URGENT_VISIT') {
        await requestUrgentVisit(patientId, {
          urgency,
          notes,
          patient_message: patientMessage,
          doctor_name: doctorName || 'Attending Physician'
        });
      } else if (activeModal === 'RESOLVE') {
        await recordIntervention(patientId, {
          action: 'CONFIRM_RECOVERY',
          notes,
          doctor_name: doctorName || 'Attending Physician'
        });
      }
      onActionComplete();
      setActiveModal('NONE');
      setMenuOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to execute clinical action');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        className="btn-primary" 
        onClick={() => setMenuOpen(!menuOpen)}
        style={{ padding: '10px 20px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}
      >
        Clinical Actions <ChevronDown size={16} />
      </button>

      {menuOpen && (
        <div style={{
          position: 'absolute', top: 48, right: 0, width: 240, background: 'white',
          borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0',
          overflow: 'hidden', zIndex: 50
        }}>
          <button style={menuItemStyle} onClick={() => setActiveModal('SWITCH_MED')}>
            <Pill size={16} color="#0ea5e9" /> Change Prescription
          </button>
          <button style={menuItemStyle} onClick={() => setActiveModal('URGENT_VISIT')}>
            <AlertTriangle size={16} color="#dc2626" /> Request Urgent Visit
          </button>
          <button style={menuItemStyle} onClick={() => setActiveModal('RESOLVE')}>
            <CheckCircle2 size={16} color="#16a34a" /> Mark as Resolved
          </button>
        </div>
      )}

      {/* MODALS */}
      {activeModal !== 'NONE' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)'
        }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 16, width: 500, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            {activeModal === 'SWITCH_MED' && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Change Prescription</h2>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>New Medication</label>
                  <input type="text" value={newMed} onChange={e => setNewMed(e.target.value)} placeholder="e.g. Augmentin 875mg" style={inputStyle} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Clinical Rationale (Notes)</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for switching..." style={{ ...inputStyle, minHeight: 100 }} />
                </div>
              </>
            )}

            {activeModal === 'URGENT_VISIT' && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#b91c1c' }}>Request Urgent Visit</h2>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Urgency Level</label>
                  <select value={urgency} onChange={e => setUrgency(e.target.value as any)} style={inputStyle}>
                    <option value="SAME_DAY_CLINIC">Same Day Clinic Visit</option>
                    <option value="IMMEDIATE_ER">Immediate ER / Urgent Care</option>
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Message to Patient (Appears in Portal)</label>
                  <textarea value={patientMessage} onChange={e => setPatientMessage(e.target.value)} placeholder="Please come into the clinic immediately..." style={{ ...inputStyle, minHeight: 80 }} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Internal Clinical Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Rationale..." style={{ ...inputStyle, minHeight: 80 }} />
                </div>
              </>
            )}

            {activeModal === 'RESOLVE' && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#15803d' }}>Mark as Resolved</h2>
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Closing Clinical Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Patient has recovered successfully..." style={{ ...inputStyle, minHeight: 100 }} />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveModal('NONE')} style={{ padding: '10px 16px', background: 'transparent', border: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAction} disabled={loading} className="btn-primary" style={{ padding: '10px 24px', background: activeModal === 'URGENT_VISIT' ? '#ef4444' : '#0f172a' }}>
                {loading ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const menuItemStyle = {
  width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
  background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#334155',
  borderBottom: '1px solid #f1f5f9', textAlign: 'left' as const
};

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, outline: 'none', fontSize: 14 };
