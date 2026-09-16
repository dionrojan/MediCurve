import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface AuthState {
  patientId: string | null;
  patientName: string | null;
  token: string | null;
}

interface AuthContextType extends AuthState {
  login: (patientId: string, name: string, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = 'medicurve_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : { patientId: null, patientName: null, token: null };
    } catch {
      return { patientId: null, patientName: null, token: null };
    }
  });

  const login = (patientId: string, name: string, token: string) => {
    const next = { patientId, patientName: name, token };
    setAuth(next);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  };

  const logout = () => {
    setAuth({ patientId: null, patientName: null, token: null });
    sessionStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, isAuthenticated: !!auth.token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
