import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Activity, AlertTriangle, TrendingDown } from 'lucide-react';
import { RecoveryChart } from '../../../components/RecoveryChart';
import { getBaseline } from '../../../api/patient';
import type { Patient, BaselineResponse } from '../../../types';

export function RecoveryTab() {
  const { patient } = useOutletContext<{ patient: Patient }>();
  const [baseline, setBaseline] = useState<BaselineResponse | null>(null);

  useEffect(() => {
    getBaseline().then(data => setBaseline(data));
  }, []);

  if (!baseline) return <div style={{ padding: 40, color: '#64748b' }}>Loading trajectory baseline...</div>;

  return (
    <div style={{ padding: '32px 48px', maxWidth: 1000 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Symptom Recovery Trajectory</h2>
      <p style={{ color: '#64748b', marginBottom: 32 }}>Comparing actual patient reported symptoms against the expected clinical baseline for acute bacterial sinusitis.</p>

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32, marginBottom: 32 }}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={20} color="#0ea5e9" /> Clinical Chart
          </h3>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, fontWeight: 500, color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 2, background: '#0ea5e9' }} /> Actual Pain</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 2, background: '#0d9488' }} /> Actual Congestion</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 2, border: '2px dashed #93c5fd' }} /> Expected Trajectory</span>
          </div>
        </div>
        
        {patient.checkins.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
            No check-in data available to plot trajectory.
          </div>
        ) : (
          <RecoveryChart checkins={patient.checkins} baseline={baseline.trajectory} />
        )}
      </div>

      {/* Trajectory Analysis Summary */}
      {patient.status === 'CRITICAL' || patient.status === 'WARNING' ? (
        <div style={{ background: '#fef2f2', borderRadius: 16, border: '1px solid #fecaca', padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#991b1b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingDown size={20} /> Trajectory Deviation Detected
          </h3>
          <p style={{ color: '#7f1d1d', lineHeight: 1.6, fontSize: 15, margin: 0 }}>
            The patient's symptom progression is actively deviating from the expected baseline curve. 
            Facial pain and congestion scores remain elevated past the Day 5 critical checkpoint. 
            This indicates potential treatment failure or a lack of response to the current prescription of <strong>{patient.medication}</strong>.
          </p>
        </div>
      ) : (
        <div style={{ background: '#f0fdf4', borderRadius: 16, border: '1px solid #bbf7d0', padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#166534', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={20} /> On Track
          </h3>
          <p style={{ color: '#15803d', lineHeight: 1.6, fontSize: 15, margin: 0 }}>
            The patient is tracking closely to or outperforming the expected recovery baseline. No intervention is clinically necessary at this time based on the trajectory.
          </p>
        </div>
      )}
    </div>
  );
}
