import { useState, useEffect, useCallback } from 'react';
import { getPatient } from '../api/patient';
import type { Patient } from '../types';

export function usePatient(patientId: string | null) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPatient(patientId);
      setPatient(data);
    } catch (e: any) {
      setError(e.message || 'Could not load patient data.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { patient, loading, error, refresh };
}
