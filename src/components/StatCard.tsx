import React from 'react';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ElementType;
  tone?: 'default' | 'positive' | 'warning' | 'critical';
  emphasis?: boolean;
}

const TONES: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-brandSoft text-brand',
  positive: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  critical: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
  emphasis = false
}: StatCardProps) {
  return (
    <div className={`card flex flex-col justify-between p-4 ${emphasis ? 'sm:p-5' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        {Icon ?
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONES[tone]}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span> :
        null}
      </div>
      <p
        className={`tnum mt-3 font-semibold text-ink ${
        emphasis ? 'text-3xl sm:text-4xl' : 'text-2xl'}`
        }>
        
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>);

}