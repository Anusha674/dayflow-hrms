import React from 'react';
import { AlertTriangleIcon, InboxIcon, Loader2Icon } from 'lucide-react';

export function Spinner({ className = '' }: {className?: string;}) {
  return <Loader2Icon className={`h-4 w-4 animate-spin ${className}`} aria-hidden="true" />;
}

export function FullPageLoader({ label = 'Loading Dayflow' }: {label?: string;}) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-3 bg-canvas">
      <Spinner className="h-6 w-6 text-brand" />
      <p className="text-sm text-muted">{label}</p>
      <span className="sr-only" role="status">
        {label}
      </span>
    </div>);

}

export function SkeletonRows({ rows = 5, className = '' }: {rows?: number;className?: string;}) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) =>
      <div key={index} className="h-11 w-full animate-pulse rounded-lg bg-black/[0.05] dark:bg-white/[0.06]" />
      )}
    </div>);

}

export function SkeletonCard({ className = '' }: {className?: string;}) {
  return (
    <div
      className={`h-28 animate-pulse rounded-2xl bg-black/[0.05] dark:bg-white/[0.06] ${className}`}
      aria-hidden="true" />);


}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = InboxIcon





}: {title: string;description?: string;action?: React.ReactNode;icon?: React.ElementType;}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brandSoft text-brand">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>);

}

export function ErrorState({ message, onRetry }: {message: string;onRetry?: () => void;}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
        <AlertTriangleIcon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-ink">{message}</p>
      {onRetry ?
      <button type="button" className="btn-outline btn-sm mt-2" onClick={onRetry}>
          Try again
        </button> :
      null}
    </div>);

}