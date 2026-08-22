import React from 'react';
import { CheckCircle2Icon, CloudOffIcon, ShieldCheckIcon } from 'lucide-react';

const POINTS = [
{
  icon: ShieldCheckIcon,
  title: 'Role-enforced access',
  body: 'Every request is authorised server-side — HR endpoints reject employee tokens with 403.'
},
{
  icon: CloudOffIcon,
  title: 'Works offline',
  body: 'Check-in and leave requests queue locally and sync the moment the connection returns.'
},
{
  icon: CheckCircle2Icon,
  title: 'Fully audited',
  body: 'Approvals, payroll edits and profile changes are written inside one transaction with an audit trail.'
}];


export function AuthLayout({
  children,
  aside
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 sm:p-6 bg-transparent">
      <div className="card auth-card animate-fade-rise w-full max-w-[460px] p-6 sm:p-9">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-1 mb-7 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            Dayflow
          </h1>
          <p className="text-sm text-muted">
            Enter your credentials to access your workspace
          </p>
        </div>

        {children}
        {aside}
      </div>
    </div>
  );
}