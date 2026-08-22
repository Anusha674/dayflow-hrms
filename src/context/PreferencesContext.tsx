import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const PREFS_KEY = 'dayflow_preferences';

export interface Preferences {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  density: 'comfortable' | 'compact';
  lastEmployeeId: string | null;
}

const DEFAULTS: Preferences = {
  theme: 'light',
  sidebarCollapsed: false,
  density: 'comfortable',
  lastEmployeeId: null
};

function read(): Preferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Preferences>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

interface PreferencesValue {
  prefs: Preferences;
  update: (patch: Partial<Preferences>) => void;
}

const PreferencesContext = createContext<PreferencesValue | null>(null);

export function PreferencesProvider({ children }: {children: React.ReactNode;}) {
  const [prefs, setPrefs] = useState<Preferences>(read);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {

      /* storage full or blocked */}
    document.documentElement.classList.toggle('dark', prefs.theme === 'dark');
  }, [prefs]);

  const value = useMemo<PreferencesValue>(
    () => ({ prefs, update: (patch) => setPrefs((prev) => ({ ...prev, ...patch })) }),
    [prefs]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used inside PreferencesProvider');
  return ctx;
}