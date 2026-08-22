import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3Icon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  ScrollTextIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
  XIcon } from
'lucide-react';
import type { Role } from '../types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

const EMPLOYEE_NAV: NavItem[] = [
{ to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
{ to: '/app/profile', label: 'My profile', icon: UserIcon },
{ to: '/app/attendance', label: 'Attendance', icon: CalendarCheckIcon },
{ to: '/app/leave', label: 'Leave', icon: CalendarDaysIcon },
{ to: '/app/payroll', label: 'Payroll', icon: WalletIcon }];


const HR_NAV: NavItem[] = [
{ to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboardIcon },
{ to: '/admin/employees', label: 'Employees', icon: UsersIcon },
{ to: '/admin/attendance', label: 'Attendance', icon: CalendarCheckIcon },
{ to: '/admin/leave', label: 'Leave approvals', icon: ClipboardListIcon },
{ to: '/admin/payroll', label: 'Payroll', icon: WalletIcon },
{ to: '/admin/analytics', label: 'Analytics', icon: BarChart3Icon },
{ to: '/admin/reports', label: 'Reports', icon: FileTextIcon },
{ to: '/admin/audit', label: 'Audit log', icon: ScrollTextIcon }];


export function navItemsFor(role: Role): NavItem[] {
  return role === 'HR' ? HR_NAV : EMPLOYEE_NAV;
}

interface SidebarProps {
  role: Role;
  open: boolean;
  onClose: () => void;
  footer?: React.ReactNode;
}

export function Sidebar({ role, open, onClose, footer }: SidebarProps) {
  const items = navItemsFor(role);

  const content =
  <nav aria-label="Main" className="flex h-full flex-col gap-1 px-3 py-4">
      <div className="mb-4 flex items-center justify-between px-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-brandInk">
            D
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight text-ink">Dayflow</p>
            <p className="text-[11px] leading-tight text-muted">
              {role === 'HR' ? 'HR workspace' : 'Employee workspace'}
            </p>
          </div>
        </div>
        <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1.5 text-muted hover:bg-brand/10 lg:hidden"
        aria-label="Close navigation">
        
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      {items.map((item) =>
    <NavLink
      key={item.to}
      to={item.to}
      onClick={onClose}
      className={({ isActive }) =>
      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ease-soft ${
      isActive ?
      'bg-brandSoft text-brand' :
      'text-muted hover:bg-brand/[0.07] hover:text-ink'}`

      }>
      
          {({ isActive }) =>
      <>
              <item.icon className={`h-[18px] w-[18px] ${isActive ? 'text-brand' : ''}`} aria-hidden="true" />
              {item.label}
            </>
      }
        </NavLink>
    )}

      <div className="mt-auto px-1 pt-4">{footer}</div>
    </nav>;


  return (
    <>
      <aside className="hidden w-[248px] shrink-0 border-r border-line bg-surface lg:block">
        <div className="sticky top-0 h-screen">{content}</div>
      </aside>

      {open ?
      <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/45" onClick={onClose} />
          <div className="absolute left-0 top-0 h-full w-[264px] border-r border-line bg-surface shadow-pop">
            {content}
          </div>
        </div> :
      null}
    </>);

}