import { format, parseISO } from 'date-fns';

export function todayISO(date = new Date()): string {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function monthISO(date = new Date()): string {
  return todayISO(date).slice(0, 7);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return todayISO(d);
}

export function dayCount(start: string, end: string): number {
  const from = new Date(`${start}T00:00:00`).getTime();
  const to = new Date(`${end}T00:00:00`).getTime();
  return Math.max(1, Math.round((to - from) / 86_400_000) + 1);
}

export function prettyDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso.length > 10 ? iso : `${iso}T00:00:00`), 'dd MMM yyyy');
  } catch {
    return iso;
  }
}

export function prettyMonth(month?: string | null): string {
  if (!month) return '—';
  try {
    return format(parseISO(`${month}-01T00:00:00`), 'MMMM yyyy');
  } catch {
    return month;
  }
}

export function prettyTime(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'hh:mm a');
  } catch {
    return iso;
  }
}

export function prettyDateTime(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'dd MMM yyyy, hh:mm a');
  } catch {
    return iso;
  }
}

export function weekdayShort(iso: string): string {
  try {
    return format(parseISO(`${iso}T00:00:00`), 'EEE');
  } catch {
    return '';
  }
}

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

export function money(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return currency.format(value);
}

export function hours(value: number | null | undefined): string {
  if (!value) return '0h 00m';
  const h = Math.floor(value);
  const m = Math.round((value - h) * 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export function initials(name: string): string {
  return name.
  split(' ').
  filter(Boolean).
  slice(0, 2).
  map((part) => part[0]?.toUpperCase() ?? '').
  join('');
}

export function titleCase(value: string): string {
  return value.
  toLowerCase().
  split('_').
  map((part) => part.charAt(0).toUpperCase() + part.slice(1)).
  join(' ');
}