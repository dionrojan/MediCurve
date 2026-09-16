import { useOutletContext } from 'react-router-dom';
import { AlertTriangle, Info } from 'lucide-react';
import type { Patient, Alert } from '../../../types';

export function AlertsTab() {
  const { patient } = useOutletContext<{ patient: Patient }>();

  const allAlerts: { day: number, alert: Alert }[] = [];
  patient.checkins.forEach(c => {
    c.alerts.forEach(a => allAlerts.push({ day: c.day, alert: a }));
  });

  allAlerts.sort((a, b) => new Date(b.alert.timestamp).getTime() - new Date(a.alert.timestamp).getTime());

  return (
    <div style={{ padding: '32px 48px', maxWidth: 800 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>System Triage Alerts</h2>
      
      {allAlerts.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b', background: 'white', borderRadius: 16, border: '1px solid #e2e8f0' }}>
          No safety or efficacy alerts have been generated.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {allAlerts.map((item, idx) => {
            const isCritical = item.alert.severity === 'CRITICAL';
            return (
              <div key={idx} style={{ 
                background: isCritical ? '#fef2f2' : '#fffbeb', 
                border: `1px solid ${isCritical ? '#fca5a5' : '#fcd34d'}`, 
                borderRadius: 12, padding: 16, display: 'flex', gap: 16 
              }}>
                <div style={{ marginTop: 2 }}>
                  {isCritical ? <AlertTriangle color="#dc2626" /> : <Info color="#d97706" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong style={{ color: isCritical ? '#991b1b' : '#92400e' }}>{item.alert.category.replace(/_/g, ' ')}</strong>
                    <span style={{ fontSize: 13, color: isCritical ? '#b91c1c' : '#b45309' }}>Day {item.day} • {new Date(item.alert.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div style={{ color: isCritical ? '#7f1d1d' : '#78350f', fontSize: 14 }}>{item.alert.message}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
