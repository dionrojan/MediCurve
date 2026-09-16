import type { SeverityLevel } from '../types';

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getFirstName(name: string): string {
  return name.split(' ')[0];
}

export function getTreatmentDay(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(diff + 1, 1), 10);
}

export function getNextMilestoneDay(completedDays: number[]): number | null {
  const milestones = [1, 3, 5, 7, 9];
  return milestones.find(d => !completedDays.includes(d)) ?? null;
}

export function getMilestoneName(day: number): string {
  const names: Record<number, string> = {
    1: 'Baseline Assessment',
    3: 'Early Response Check',
    5: 'Critical Efficacy Checkpoint',
    7: 'Treatment Confirmation',
    9: 'Course Completion',
  };
  return names[day] ?? `Day ${day}`;
}

export function getStatusLabel(status: SeverityLevel): string {
  const labels: Record<SeverityLevel, string> = {
    OK: 'On Track',
    WARNING: 'Needs Attention',
    CRITICAL: 'Critical',
    VISIT_REQUESTED: 'Visit Requested',
    RESOLVED: 'Resolved',
  };
  return labels[status] ?? status;
}

export function getStatusColor(status: SeverityLevel): string {
  const colors: Record<SeverityLevel, string> = {
    OK: 'badge-ok',
    WARNING: 'badge-warning',
    CRITICAL: 'badge-critical',
    VISIT_REQUESTED: 'badge-visit',
    RESOLVED: 'badge-resolved',
  };
  return colors[status] ?? 'badge-ok';
}

export function parseMedication(med: string) {
  // e.g. "Amoxicillin 875mg BID (10-day course)"
  const match = med.match(/^([A-Za-z]+)\s+([\d.]+mg)\s+(\w+)/);
  if (match) {
    return { name: match[1], dose: match[2], frequency: match[3], raw: med };
  }
  return { name: med, dose: '', frequency: '', raw: med };
}

export function getVisitUrgencyLabel(urgency: string | null): string {
  if (!urgency) return '';
  const map: Record<string, string> = {
    IMMEDIATE_ER: 'Immediate — Go to Emergency Room',
    SAME_DAY_CLINIC: 'Same-Day Clinic Visit Required',
    NEXT_DAY_CLINIC: 'Next-Day Clinic Visit Required',
  };
  return map[urgency] ?? urgency;
}

export function getInterventionLabel(action: string): string {
  const map: Record<string, string> = {
    REQUEST_IMMEDIATE_VISIT: 'Urgent Visit Requested',
    SWITCH_MEDICATION: 'Medication Updated',
    DISCONTINUE_ALLERGY: 'Medication Discontinued (Allergy)',
    COUNSEL_ADHERENCE: 'Adherence Counseling',
    ORDER_LABS: 'Labs / Tests Ordered',
    CONFIRM_RECOVERY: 'Recovery Confirmed',
  };
  return map[action] ?? action;
}
