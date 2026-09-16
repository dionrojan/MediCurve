import { useNavigate } from 'react-router-dom';
import { ClipboardList, TrendingUp, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePatient } from '../hooks/usePatient';
import { PatientHeader } from '../components/PatientHeader';
import { UrgentNotice } from '../components/UrgentNotice';
import { TreatmentCard } from '../components/TreatmentCard';
import { CareTeamCard } from '../components/CareTeamCard';
import { MilestoneTimeline } from '../components/MilestoneTimeline';
import { RecoveryChart } from '../components/RecoveryChart';
import { CheckInHistory } from '../components/CheckInHistory';
import { DemoSwitcher } from '../components/DemoSwitcher';
import { SkeletonDashboard } from '../components/Skeleton';
import {
  getGreeting, getFirstName, getTreatmentDay,
  getNextMilestoneDay, getMilestoneName,
  getStatusColor, getStatusLabel,
} from '../utils/formatters';
import { useState, useEffect } from 'react';
import { getBaseline } from '../api/patient';
import type { BaselineTrajectory } from '../types';

export function PatientDashboard() {
  const navigate = useNavigate();
  const { patientId, login } = useAuth();
  const { patient, loading, error, refresh } = usePatient(patientId);
  const [baseline, setBaseline] = useState<BaselineTrajectory>({});

  useEffect(() => {
    getBaseline().then(b => setBaseline(b.trajectory)).catch(() => {});
  }, []);

  const treatmentDay = patient ? getTreatmentDay(patient.start_date) : 1;
  const completedDays = patient?.checkins.map(c => c.day) ?? [];
  const nextDay = getNextMilestoneDay(completedDays);


  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PatientHeader />
      <SkeletonDashboard />
    </div>
  );

  if (error || !patient) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PatientHeader />
      <div style={{ maxWidth: 600, margin: '80px auto', padding: 24, textAlign: 'center' }}>
        <AlertCircle size={48} color="#dc2626" style={{ margin: '0 auto 16px', display: 'block' }} />
        <h2 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Unable to load your records</h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>
          We couldn't connect to your care record right now. Please try again.
        </p>
        <button className="btn-primary" onClick={refresh}>Try Again</button>
      </div>
    </div>
  );

  const statusCls = getStatusColor(patient.status);
  const statusLbl = getStatusLabel(patient.status);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PatientHeader />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px' }}>

        {/* Urgent notice — highest priority */}
        {patient.active_visit_notice && (
          <UrgentNotice notice={patient.active_visit_notice} />
        )}

        {/* Welcome */}
        <div className="animate-fade-in-up" style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 4 }}>
                {getGreeting()}, {getFirstName(patient.name)} 👋
              </h1>
              <p style={{ fontSize: 16, color: '#64748b' }}>
                Let's check how your recovery is progressing.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Treatment Day', value: `${treatmentDay} / 10`, icon: <Clock size={16} /> },
                { label: 'Status', value: statusLbl, cls: statusCls },
                { label: 'Next Milestone', value: nextDay ? `Day ${nextDay}` : 'Complete!', icon: <CheckCircle2 size={16} /> },
              ].map(item => (
                <div key={item.label} className="card" style={{ padding: '14px 20px', textAlign: 'center', minWidth: 120 }}>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, fontWeight: 600 }}>{item.label}</p>
                  {item.cls ? (
                    <span className={item.cls} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                      {item.value}
                    </span>
                  ) : (
                    <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{item.value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main grid row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20, marginBottom: 24,
        }}>
          <TreatmentCard
            medication={patient.medication}
            startDate={patient.start_date}
            treatmentDay={treatmentDay}
          />

          {/* Next Check-in */}
          <div className="card animate-fade-in-up animate-delay-100" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: '#f0f9ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ClipboardList size={18} color="#0ea5e9" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Next Check-in</span>
            </div>

            {nextDay ? (
              <>
                <p style={{ fontSize: 32, fontWeight: 800, color: '#0ea5e9', marginBottom: 4 }}>Day {nextDay}</p>
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>{getMilestoneName(nextDay)}</p>
                <button className="btn-primary" style={{ width: '100%' }} onClick={() => navigate('/patient/checkin')}>
                  Complete Check-in →
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: 12 }}>
                <CheckCircle2 size={40} color="#16a34a" style={{ margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontWeight: 700, color: '#16a34a' }}>All milestones completed!</p>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Your full treatment course is on record.</p>
              </div>
            )}
          </div>

          <CareTeamCard />
        </div>

        {/* Milestone Timeline */}
        <div style={{ marginBottom: 24 }}>
          <MilestoneTimeline completedDays={completedDays} currentDay={treatmentDay} />
        </div>

        {/* Recovery Chart */}
        <div className="card animate-fade-in-up animate-delay-200" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: 17, color: '#0f172a', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} color="#0ea5e9" />
                Recovery Trajectory
              </h2>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>
                Actual symptoms vs. configured recovery reference — not a universal medical standard.
              </p>
            </div>
            <button className="btn-secondary" onClick={() => navigate('/patient/recovery')}>
              View Full Chart →
            </button>
          </div>
          <RecoveryChart checkins={patient.checkins} baseline={baseline} />
        </div>

        {/* Check-in History */}
        <div className="card animate-fade-in-up animate-delay-300" style={{ padding: 24 }}>
          <h2 style={{ fontWeight: 700, fontSize: 17, color: '#0f172a', marginBottom: 20 }}>
            Check-in History
          </h2>
          <CheckInHistory checkins={patient.checkins} />
        </div>
      </main>

      <DemoSwitcher onSwitch={(id, name) => { login(id, name, id); window.location.reload(); }} />
    </div>
  );
}
