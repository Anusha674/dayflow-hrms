import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldXIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FullPageLoader } from './Loading';
import type { Role } from '../types';

/** Route-level guard. The API enforces the same rule again on every call — this
 *  only keeps the user out of screens they cannot use. */
export function ProtectedRoute({
  allow,
  children



}: {allow: Role[];children: React.ReactNode;}) {
  const { user, booting } = useAuth();
  const location = useLocation();

  if (booting) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!allow.includes(user.role)) return <AccessDenied role={user.role} />;
  return <>{children}</>;
}

function AccessDenied({ role }: {role: Role;}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
        <ShieldXIcon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h1 className="text-lg font-semibold text-ink">403 — Access denied</h1>
      <p className="max-w-md text-sm text-muted">
        Your account is signed in as <strong>{role === 'HR' ? 'HR Officer' : 'Employee'}</strong> and
        is not permitted to open this area. The API rejects these requests independently of the
        interface.
      </p>
      <Link className="btn-primary mt-2" to={role === 'HR' ? '/admin/dashboard' : '/app/dashboard'}>
        Back to my dashboard
      </Link>
    </div>);

}