import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/resources';
import { friendlyError, setToken, getToken } from '../services/apiClient';
import type { Employee, PublicUser, Role } from '../types';

interface AuthValue {
  user: PublicUser | null;
  employee: Employee | null;
  role: Role | null;
  booting: boolean;
  signIn: (email: string, password: string) => Promise<PublicUser>;
  signOut: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

const SESSION_CACHE = 'dayflow_session_hint';

export function AuthProvider({ children }: {children: React.ReactNode;}) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [booting, setBooting] = useState(true);

  const load = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setEmployee(null);
      return;
    }
    try {
      const data = await authService.me();
      setUser(data.user);
      setEmployee(data.employee);
      try {
        localStorage.setItem(
          SESSION_CACHE,
          JSON.stringify({ email: data.user.email, role: data.user.role })
        );
      } catch {

        /* ignore */}
    } catch {
      setToken(null);
      setUser(null);
      setEmployee(null);
    }
  }, []);

  useEffect(() => {
    void load().finally(() => setBooting(false));
  }, [load]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const data = await authService.login(email, password);
      setToken(data.access_token);
      setUser(data.user);
      setEmployee(data.employee);
      return data.user;
    } catch (error) {
      throw new Error(friendlyError(error));
    }
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
    setEmployee(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ user, employee, role: user?.role ?? null, booting, signIn, signOut, refresh: load }),
    [user, employee, booting, signIn, signOut, load]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}