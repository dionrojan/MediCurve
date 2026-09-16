import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePatient } from '../hooks/usePatient';
import { PatientHeader } from '../components/PatientHeader';
import { submitCheckIn } from '../api/patient';
import { parseToCheckIn } from '../api/parse';
import {
  getNextMilestoneDay, getMilestoneName,
} from '../utils/formatters';
import type { CheckIn, SeverityLevel } from '../types';

type Step = 'note' | 'symptoms' | 'sideEffects' | 'adherence' | 'result';

const PAIN_LABELS: Record<number, string> = { 0:'None', 1:'Mild', 2:'Mild', 3:'Moderate', 4:'Moderate', 5:'Severe' };
const CONG_LABELS: Record<number, string> = { 0:'Clear', 1:'Mild', 2:'Mild', 3:'Blocked', 4:'Blocked', 5:'Fully Obstructed' };
const ENERGY_LABELS: Record<number, string> = { 1:'Exhausted', 2:'Very low', 3:'Low', 4:'Good', 5:'Normal' };

export function PatientCheckIn() {
  const navigate = useNavigate();
  const { patientId } = useAuth();
  const { patient, refresh } = usePatient(patientId);

  const completedDays = patient?.checkins.map(c => c.day) ?? [];
  const nextDay = getNextMilestoneDay(completedDays) ?? 1;

  // Form state
  const [step, setStep] = useState<Step>('note');
  const [rawNote, setRawNote] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [aiDetected, setAiDetected] = useState<Record<string, boolean>>({});
  const [rawParsed, setRawParsed] = useState<any>(null);

  const [facialPain, setFacialPain] = useState(0);
  const [congestion, setCongestion] = useState(0);
  const [fever, setFever] = useState<boolean | null>(null);
  const [energy, setEnergy] = useState(3);

  const [rash, setRash] = useState(false);
  const [diarrhea, setDiarrhea] = useState(false);
  const [nausea, setNausea] = useState(false);

  const [adherence, setAdherence] = useState<boolean | null>(null);
  const [adherenceNote, setAdherenceNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckIn | null>(null);

  const adherenceQuestion =
    nextDay === 1 ? 'Did you take your first dose today?' :
    nextDay >= 9  ? 'Have you completed all prescribed doses of your treatment course?' :
                   'Have you taken all scheduled doses as prescribed?';

  const handleAnalyze = async () => {
    if (!rawNote.trim()) return;
    setParsing(true);
    setParseError('');
    try {
      const parsed = await parseToCheckIn(rawNote);
      const detected: Record<string, boolean> = {};
      
      const sym = parsed.suggested_symptoms;
      const se = parsed.suggested_side_effects;

      if (sym?.facial_pain !== undefined) { setFacialPain(sym.facial_pain); detected.facial_pain = true; }
      if (sym?.congestion !== undefined)  { setCongestion(sym.congestion);  detected.congestion = true; }
      if (sym?.fever !== undefined)       { setFever(sym.fever);            detected.fever = true; }
      if (sym?.energy !== undefined)      { setEnergy(sym.energy);          detected.energy = true; }
      if (se?.rash !== undefined)         { setRash(se.rash);               detected.rash = true; }
      if (se?.nausea !== undefined)       { setNausea(se.nausea);           detected.nausea = true; }
      if (se?.diarrhea !== undefined)     { setDiarrhea(se.diarrhea);       detected.diarrhea = true; }
      
      setRawParsed(parsed.raw_parsed);
      setAiDetected(detected);
      setStep('symptoms');
    } catch {
      setParseError('AI analysis unavailable — please fill in symptoms manually.');
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async () => {
    if (!patientId || adherence === null) return;
    setSubmitting(true);
    try {
      const checkin = await submitCheckIn(patientId, {
        day: nextDay,
        symptoms: { facial_pain: facialPain, congestion, fever: fever ?? false, energy },
        side_effects: { rash, diarrhea, nausea },
        adherence,
        raw_notes: rawNote || undefined,
        raw_parsed: rawParsed || undefined,
      });
      setResult(checkin);
      setStep('result');
      refresh();
    } catch (e: any) {
      alert(e.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const topSeverity: SeverityLevel = result?.alerts?.[0]?.severity ?? 'OK';

  const ResultContent: Record<SeverityLevel, { title: string; body: string; color: string; bg: string; icon: React.ReactNode }> = {
    OK: {
      title: 'You\'re On Track! 🎉',
      body: 'Your recovery is currently tracking close to the expected trajectory. Continue following your clinician\'s treatment instructions.',
      color: '#16a34a', bg: '#f0fdf4',
      icon: <CheckCircle2 size={56} color="#16a34a" />,
    },
    WARNING: {
      title: 'Needs Attention',
      body: 'A change in your recovery pattern was detected. Your care team will continue monitoring your progress.',
      color: '#d97706', bg: '#fffbeb',
      icon: <AlertTriangle size={56} color="#d97706" />,
    },
    CRITICAL: {
      title: 'Clinical Alert',
      body: 'A significant change in your reported symptoms was detected. Your care team has been notified for review. Please check your urgent notices.',
      color: '#dc2626', bg: '#fff1f2',
      icon: <AlertTriangle size={56} color="#dc2626" />,
    },
    VISIT_REQUESTED: {
      title: 'Visit Requested',
      body: 'Your clinician has requested an in-person evaluation. Please follow the instructions in your active visit notice.',
      color: '#7c3aed', bg: '#ede9fe',
      icon: <AlertTriangle size={56} color="#7c3aed" />,
    },
    RESOLVED: {
      title: 'Recovery Confirmed',
      body: 'Your clinician has confirmed your recovery is progressing well. Keep following your treatment plan.',
      color: '#0ea5e9', bg: '#f0f9ff',
      icon: <CheckCircle2 size={56} color="#0ea5e9" />,
    },
  };

  const rc = ResultContent[topSeverity];

  const steps: Step[] = ['note', 'symptoms', 'sideEffects', 'adherence'];
  const stepIndex = steps.indexOf(step);
  const progress = ((stepIndex + 1) / steps.length) * 100;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PatientHeader />

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '28px 24px' }}>

        {step !== 'result' && (
          <>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>
                {getMilestoneName(nextDay)}
              </p>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                Day {nextDay} Recovery Check-in
              </h1>
              <p style={{ fontSize: 15, color: '#64748b' }}>
                Tell us how you're feeling so your care team can monitor your recovery.
              </p>
              {/* Progress bar */}
              <div style={{ marginTop: 16, height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  background: 'linear-gradient(90deg,#0ea5e9,#0d9488)',
                  width: `${progress}%`, transition: 'width 0.4s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                {['Describe', 'Symptoms', 'Side Effects', 'Adherence'].map((s, i) => (
                  <span key={s} style={{ fontWeight: stepIndex === i ? 700 : 400, color: stepIndex === i ? '#0ea5e9' : '#94a3b8' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Step: Note */}
        {step === 'note' && (
          <div className="card animate-fade-in" style={{ padding: 28 }}>
            <h2 style={{ fontWeight: 700, fontSize: 18, color: '#0f172a', marginBottom: 6 }}>
              Describe how you're feeling
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
              Write in your own words — our AI will help extract your symptom data.
            </p>
            <textarea
              value={rawNote}
              onChange={e => setRawNote(e.target.value)}
              placeholder="Example: My cheeks are throbbing worse today and my nose feels completely blocked. I also have a temperature of 101°F."
              rows={6}
              style={{
                width: '100%', padding: '14px', border: '1.5px solid #e2e8f0',
                borderRadius: 12, fontSize: 15, fontFamily: 'inherit',
                lineHeight: 1.6, outline: 'none', resize: 'vertical',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = '#0ea5e9')}
              onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
            />
            <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                onClick={handleAnalyze}
                disabled={parsing || !rawNote.trim()}
                style={{ flex: 1, minWidth: 180 }}
              >
                <Sparkles size={16} />
                {parsing ? 'Analyzing…' : '✨ Analyze My Symptoms'}
              </button>
              <button className="btn-secondary" onClick={() => setStep('symptoms')}>
                Skip — Fill Manually
              </button>
            </div>
            {parseError && (
              <p style={{ fontSize: 13, color: '#dc2626', marginTop: 10 }}>{parseError}</p>
            )}
            {Object.keys(aiDetected).length > 0 && (
              <div style={{
                marginTop: 16, padding: '12px 16px',
                background: '#f0fdf4', borderRadius: 12,
                border: '1px solid #bbf7d0',
              }}>
                <p style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, marginBottom: 4 }}>
                  ✅ AI extracted {Object.keys(aiDetected).length} symptom values — review them in the next step.
                </p>
                <p style={{ fontSize: 12, color: '#64748b' }}>
                  These are suggestions only. You can adjust any value before submitting.
                </p>
                <button
                  className="btn-primary"
                  style={{ marginTop: 10, width: '100%' }}
                  onClick={() => setStep('symptoms')}
                >
                  Review Extracted Symptoms <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step: Symptoms */}
        {step === 'symptoms' && (
          <div className="card animate-fade-in" style={{ padding: 28 }}>
            <h2 style={{ fontWeight: 700, fontSize: 18, color: '#0f172a', marginBottom: 24 }}>
              Rate Your Symptoms
            </h2>

            <SliderRow
              label="Facial Pain & Pressure"
              value={facialPain} min={0} max={5}
              valueLabel={PAIN_LABELS[facialPain]}
              onChange={setFacialPain}
              aiDetected={aiDetected.facial_pain}
            />
            <SliderRow
              label="Nasal Congestion"
              value={congestion} min={0} max={5}
              valueLabel={CONG_LABELS[congestion]}
              onChange={setCongestion}
              aiDetected={aiDetected.congestion}
              style={{ marginTop: 24 }}
            />
            <SliderRow
              label="Energy Level"
              value={energy} min={1} max={5}
              valueLabel={ENERGY_LABELS[energy]}
              onChange={setEnergy}
              aiDetected={aiDetected.energy}
              style={{ marginTop: 24 }}
            />

            {/* Fever */}
            <div style={{ marginTop: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <label style={{ fontWeight: 600, fontSize: 15, color: '#0f172a' }}>
                  Do you currently have a fever or chills?
                </label>
                {aiDetected.fever && <AiBadge />}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[false, true].map(val => (
                  <button
                    key={String(val)}
                    onClick={() => setFever(val)}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 12, fontWeight: 600,
                      fontSize: 15, border: '1.5px solid',
                      borderColor: fever === val ? (val ? '#dc2626' : '#16a34a') : '#e2e8f0',
                      background: fever === val ? (val ? '#fff1f2' : '#f0fdf4') : 'white',
                      color: fever === val ? (val ? '#dc2626' : '#16a34a') : '#64748b',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {val ? '🌡️ Yes' : '✅ No'}
                  </button>
                ))}
              </div>
            </div>

            <NavButtons
              onBack={() => setStep('note')}
              onNext={() => setStep('sideEffects')}
              nextDisabled={fever === null}
            />
          </div>
        )}

        {/* Step: Side Effects */}
        {step === 'sideEffects' && (
          <div className="card animate-fade-in" style={{ padding: 28 }}>
            <h2 style={{ fontWeight: 700, fontSize: 18, color: '#0f172a', marginBottom: 6 }}>
              Medication Side Effects
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
              Check any that apply since your last check-in.
            </p>

            <SideEffectToggle
              label="Skin rash or hives"
              checked={rash}
              onChange={setRash}
              aiDetected={aiDetected.rash}
              danger
            />
            <SideEffectToggle
              label="Severe diarrhea or stomach cramping"
              checked={diarrhea}
              onChange={setDiarrhea}
              aiDetected={aiDetected.diarrhea}
            />
            <SideEffectToggle
              label="Persistent nausea or vomiting"
              checked={nausea}
              onChange={setNausea}
              aiDetected={aiDetected.nausea}
            />

            {/* Rash safety warning */}
            {rash && (
              <div className="animate-fade-in" style={{
                marginTop: 20, background: '#fff7ed',
                border: '1.5px solid #fed7aa',
                borderRadius: 14, padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <AlertTriangle size={22} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontWeight: 700, color: '#d97706', marginBottom: 6 }}>
                      ⚠️ Possible Medication Reaction
                    </p>
                    <p style={{ fontSize: 14, color: '#92400e', lineHeight: 1.6 }}>
                      You reported a rash or hives. This may indicate a drug hypersensitivity reaction.
                      Follow the emergency / contact instructions provided by your clinician and seek
                      appropriate medical attention promptly. Do not stop medication without clinician guidance.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <NavButtons onBack={() => setStep('symptoms')} onNext={() => setStep('adherence')} />
          </div>
        )}

        {/* Step: Adherence */}
        {step === 'adherence' && (
          <div className="card animate-fade-in" style={{ padding: 28 }}>
            <h2 style={{ fontWeight: 700, fontSize: 18, color: '#0f172a', marginBottom: 24 }}>
              Medication Adherence
            </h2>

            <p style={{ fontWeight: 600, fontSize: 15, color: '#0f172a', marginBottom: 12 }}>
              {adherenceQuestion}
            </p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {[true, false].map(val => (
                <button
                  key={String(val)}
                  onClick={() => setAdherence(val)}
                  style={{
                    flex: 1, padding: '14px', borderRadius: 12, fontWeight: 700,
                    fontSize: 15, border: '1.5px solid',
                    borderColor: adherence === val ? (val ? '#16a34a' : '#d97706') : '#e2e8f0',
                    background: adherence === val ? (val ? '#f0fdf4' : '#fffbeb') : 'white',
                    color: adherence === val ? (val ? '#16a34a' : '#d97706') : '#64748b',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {val ? '✅ Yes' : '❌ No'}
                </button>
              ))}
            </div>

            {adherence === false && (
              <div className="animate-fade-in">
                <label style={{ display: 'block', fontWeight: 600, fontSize: 14, color: '#374151', marginBottom: 6 }}>
                  What prevented you from taking your medication? (optional)
                </label>
                <textarea
                  value={adherenceNote}
                  onChange={e => setAdherenceNote(e.target.value)}
                  placeholder="e.g. I forgot, side effects made it hard, ran out of medication..."
                  rows={3}
                  style={{
                    width: '100%', padding: '12px', border: '1.5px solid #e2e8f0',
                    borderRadius: 12, fontSize: 14, fontFamily: 'inherit',
                    outline: 'none', resize: 'vertical',
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              <button className="btn-secondary" onClick={() => setStep('sideEffects')} style={{ flex: 0.4 }}>
                <ChevronLeft size={16} /> Back
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={submitting || adherence === null}
                style={{ flex: 1 }}
              >
                {submitting ? 'Submitting…' : 'Submit Check-in →'}
              </button>
            </div>
          </div>
        )}

        {/* Result */}
        {step === 'result' && result && (
          <div className="card animate-fade-in" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ marginBottom: 20 }}>{rc.icon}</div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: rc.color, marginBottom: 12 }}>
              {rc.title}
            </h2>
            <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.7, marginBottom: 28, maxWidth: 440, margin: '0 auto 28px' }}>
              {rc.body}
            </p>

            {/* Alert details */}
            {result.alerts.length > 0 && (
              <div style={{
                background: rc.bg, borderRadius: 14, padding: '16px 20px',
                marginBottom: 24, textAlign: 'left',
              }}>
                {result.alerts.map((a, i) => (
                  <p key={i} style={{ fontSize: 14, color: rc.color, marginBottom: i < result.alerts.length - 1 ? 8 : 0 }}>
                    {a.message}
                  </p>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => navigate('/patient/dashboard')}>
                Go to Dashboard
              </button>
              <button className="btn-secondary" onClick={() => navigate('/patient/recovery')}>
                View My Recovery
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SliderRow({
  label, value, min, max, valueLabel, onChange, aiDetected, style: s,
}: {
  label: string; value: number; min: number; max: number;
  valueLabel: string; onChange: (v: number) => void;
  aiDetected?: boolean; style?: React.CSSProperties;
}) {
  return (
    <div style={s}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontWeight: 600, fontSize: 15, color: '#0f172a' }}>{label}</label>
          {aiDetected && <AiBadge />}
        </div>
        <span style={{
          fontWeight: 800, fontSize: 22, color: '#0ea5e9',
          minWidth: 40, textAlign: 'right',
        }}>{value}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ accentColor: '#0ea5e9' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
        <span>{min === 0 ? 'None / Clear' : 'Exhausted'}</span>
        <span style={{ color: '#0ea5e9', fontWeight: 600 }}>{valueLabel}</span>
        <span>Severe</span>
      </div>
    </div>
  );
}

function SideEffectToggle({
  label, checked, onChange, aiDetected, danger,
}: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
  aiDetected?: boolean; danger?: boolean;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderRadius: 12, border: '1.5px solid',
        borderColor: checked ? (danger ? '#dc2626' : '#0ea5e9') : '#e2e8f0',
        background: checked ? (danger ? '#fff1f2' : '#f0f9ff') : 'white',
        cursor: 'pointer', marginBottom: 10, transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          border: `2px solid ${checked ? (danger ? '#dc2626' : '#0ea5e9') : '#cbd5e1'}`,
          background: checked ? (danger ? '#dc2626' : '#0ea5e9') : 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'all 0.15s',
        }}>
          {checked && <CheckCircle2 size={13} color="white" />}
        </div>
        <span style={{ fontWeight: 500, fontSize: 14, color: checked ? (danger ? '#dc2626' : '#0ea5e9') : '#374151' }}>
          {label}
        </span>
        {aiDetected && <AiBadge />}
      </div>
    </div>
  );
}

function AiBadge() {
  return (
    <span style={{
      background: 'linear-gradient(90deg,#7c3aed,#0ea5e9)',
      color: 'white', fontSize: 10, fontWeight: 700,
      padding: '2px 8px', borderRadius: 20, letterSpacing: '0.03em',
    }}>AI detected</span>
  );
}

function NavButtons({ onBack, onNext, nextDisabled }: { onBack: () => void; onNext: () => void; nextDisabled?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
      <button className="btn-secondary" onClick={onBack} style={{ flex: 0.4 }}>
        <ChevronLeft size={16} /> Back
      </button>
      <button className="btn-primary" onClick={onNext} disabled={nextDisabled} style={{ flex: 1 }}>
        Continue <ChevronRight size={16} />
      </button>
    </div>
  );
}
