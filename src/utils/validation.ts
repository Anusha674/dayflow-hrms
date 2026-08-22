/** Shared validation rules. The API layer re-runs every one of these — the
 *  frontend copy exists purely for fast, friendly feedback. */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
export const PHONE_RE = /^[+]?[\d][\d\s-]{7,17}$/;
export const EMPLOYEE_ID_RE = /^[A-Z]{3}\d{3,5}$/;

export interface FieldErrors {
  [field: string]: string;
}

export function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Email is required.';
  if (!EMAIL_RE.test(value.trim())) return 'Enter a valid email address.';
  return null;
}

export function validatePhone(value: string): string | null {
  if (!value.trim()) return 'Phone number is required.';
  if (!PHONE_RE.test(value.trim())) return 'Enter a valid phone number (8–18 digits).';
  return null;
}

export function validateEmployeeId(value: string): string | null {
  if (!value.trim()) return 'Employee ID is required.';
  if (!EMPLOYEE_ID_RE.test(value.trim().toUpperCase()))
  return 'Use the format EMP001 — three letters followed by 3–5 digits.';
  return null;
}

export function passwordIssues(value: string): string[] {
  const issues: string[] = [];
  if (value.length < 8) issues.push('At least 8 characters');
  if (!/[A-Z]/.test(value)) issues.push('One uppercase letter');
  if (!/[a-z]/.test(value)) issues.push('One lowercase letter');
  if (!/\d/.test(value)) issues.push('One number');
  if (!/[^A-Za-z0-9]/.test(value)) issues.push('One symbol');
  return issues;
}

export function validatePassword(value: string): string | null {
  const issues = passwordIssues(value);
  return issues.length ? `Password needs: ${issues.join(', ').toLowerCase()}.` : null;
}

export function validateRequired(value: string, label: string): string | null {
  return value && value.trim() ? null : `${label} is required.`;
}

export function validateDateRange(start: string, end: string): string | null {
  if (!start) return 'Start date is required.';
  if (!end) return 'End date is required.';
  const from = new Date(`${start}T00:00:00`);
  const to = new Date(`${end}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 'Enter valid dates.';
  if (to < from) return 'End date cannot be before the start date.';
  const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
  if (days > 30) return 'A single request cannot exceed 30 days.';
  return null;
}

export function validateAmount(value: number, label: string, max = 10_000_000): string | null {
  if (Number.isNaN(value)) return `${label} must be a number.`;
  if (value < 0) return `${label} cannot be negative.`;
  if (value > max) return `${label} exceeds the permitted maximum.`;
  return null;
}

export function firstError(errors: FieldErrors): string | null {
  const keys = Object.keys(errors);
  return keys.length ? errors[keys[0]] : null;
}