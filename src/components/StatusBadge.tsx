import React from 'react';
import { titleCase } from '../utils/format';

/** Status colours are declared as literal class strings so Tailwind always
 *  emits them, and so every surface uses exactly the same palette. */
const STYLES: Record<string, {badge: string;dot: string;}> = {
  PENDING: { badge: 'badge-pending', dot: 'bg-amber-500' },
  APPROVED: { badge: 'badge-approved', dot: 'bg-emerald-500' },
  REJECTED: { badge: 'badge-rejected', dot: 'bg-rose-500' },
  PRESENT: { badge: 'badge-present', dot: 'bg-emerald-500' },
  ABSENT: { badge: 'badge-absent', dot: 'bg-rose-500' },
  HALF_DAY: { badge: 'badge-half_day', dot: 'bg-amber-500' },
  LEAVE: { badge: 'badge-leave', dot: 'bg-sky-500' }
};

export function StatusBadge({ status, dot = true }: {status: string;dot?: boolean;}) {
  const key = status?.toUpperCase() ?? '';
  const style = STYLES[key];
  return (
    <span className={`badge ${style ? style.badge : 'badge-neutral'}`}>
      {dot && style ? <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" /> : null}
      {titleCase(key || 'unknown')}
    </span>);

}