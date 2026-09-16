import React, { createContext, useContext, useState, useEffect } from 'react';

interface DoctorAuthContextType {
  doctorId: string | null;
  doctorName: string | null;
  token: string | null;
  login: (id: string, name: string, token: string) => void;
  logout: () => void;
}

const DoctorAuthContext = createContext<DoctorAuthContextType | undefined>(undefined);

export function DoctorAuthProvider({ children }: { children: React.ReactNode }) {
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedId = sessionStorage.getItem('doctor_id');
    const savedName = sessionStorage.getItem('doctor_name');
    const savedToken = sessionStorage.getItem('doctor_token');
    
    if (savedId && savedToken) {
      setDoctorId(savedId);
      setDoctorName(savedName);
      setToken(savedToken);
    }
  }, []);

  const login = (id: string, name: string, tkn: string) => {
    setDoctorId(id);
    setDoctorName(name);
    setToken(tkn);
    sessionStorage.setItem('doctor_id', id);
    sessionStorage.setItem('doctor_name', name);
    sessionStorage.setItem('doctor_token', tkn);
  };

  const logout = () => {
    setDoctorId(null);
    setDoctorName(null);
    setToken(null);
    sessionStorage.removeItem('doctor_id');
    sessionStorage.removeItem('doctor_name');
    sessionStorage.removeItem('doctor_token');
  };

  return (
    <DoctorAuthContext.Provider value={{ doctorId, doctorName, token, login, logout }}>
      {children}
    </DoctorAuthContext.Provider>
  );
}

export function useDoctorAuth() {
  const context = useContext(DoctorAuthContext);
  if (context === undefined) {
    throw new Error('useDoctorAuth must be used within a DoctorAuthProvider');
  }
  return context;
}
