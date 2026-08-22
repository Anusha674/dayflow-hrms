import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOutIcon, MenuIcon, MoonIcon, SunIcon } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { NotificationBell } from './NotificationBell';
import { SyncIndicator } from './SyncIndicator';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { initials } from '../utils/format';
import type { Role } from '../types';

export function AppShell({ children }: {children: React.ReactNode;}) {
  const { user, employee, signOut } = useAuth();
  const { prefs, update } = usePreferences();
  const [navOpen, setNavOpen] = useState(false);
  const navigate = useNavigate();
  const role: Role = user?.role ?? 'EMPLOYEE';

  const logout = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative z-10 flex min-h-screen w-full bg-transparent">
      <Sidebar
        role={role}
        open={navOpen}
        onClose={() => setNavOpen(false)}
        footer={
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors duration-150 ease-soft hover:bg-rose-500/10 hover:text-rose-600">
          
            <LogOutIcon className="h-[18px] w-[18px]" aria-hidden="true" />
            Sign out
          </button>
        } />
      

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="rounded-lg p-2 text-muted hover:bg-brand/10 lg:hidden"
            aria-label="Open navigation">
            
            <MenuIcon className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">
              {employee?.name ?? user?.email ?? 'Dayflow'}
            </p>
            <p className="truncate text-[11px] text-muted">
              {user?.employee_id} · {role === 'HR' ? 'HR Officer' : 'Employee'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => update({ theme: prefs.theme === 'dark' ? 'light' : 'dark' })}
              aria-label={`Switch to ${prefs.theme === 'dark' ? 'light' : 'dark'} theme`}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors duration-150 ease-soft hover:bg-brand/10 hover:text-ink">
              
              {prefs.theme === 'dark' ?
              <SunIcon className="h-[18px] w-[18px]" /> :

              <MoonIcon className="h-[18px] w-[18px]" />
              }
            </button>
            <NotificationBell />
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brandSoft text-xs font-bold text-brand"
              aria-hidden="true">
              
              {initials(employee?.name ?? user?.email ?? 'D')}
            </span>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6">{children}</main>
      </div>
    </div>);

}

export function PageHeader({
  title,
  description,
  actions




}: {title: string;description?: string;actions?: React.ReactNode;}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="no-print flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>);

}