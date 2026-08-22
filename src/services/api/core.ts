import {
  STORES,
  addTo,
  getAllFrom,
  getByIndex,
  getOne,
  putIn,
  tx } from
'../db';
import { verifyToken } from '../security';
import type {
  AppNotification,
  AuditLog,
  Employee,
  PublicUser,
  Role,
  User } from
'../../types';

/** Structured API failure — mirrors FastAPI's HTTPException(status, detail). */
export class ApiError extends Error {
  status: number;
  detail: string;
  fields?: Record<string, string>;

  constructor(status: number, detail: string, fields?: Record<string, string>) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.fields = fields;
  }
}

export interface RequestContext {
  user: User;
  employee: Employee | null;
  role: Role;
}

export type Handler = (
ctx: RequestContext,
params: string[],
body: Record<string, unknown>)
=> Promise<unknown>;

export interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  pattern: RegExp;
  handler: Handler;
  public?: boolean;
}

export const route = (
method: Route['method'],
path: string,
handler: Handler,
isPublic = false)
: Route => ({
  method,
  pattern: new RegExp(`^${path.replace(/\{[^}]+\}/g, '([^/]+)')}$`),
  handler,
  public: isPublic
});

/** Resolves the bearer token into a verified user + employee record. */
export async function authenticate(token: string | null): Promise<RequestContext> {
  const claims = await verifyToken(token);
  if (!claims) throw new ApiError(401, 'Your session has expired. Please sign in again.');
  return tx([STORES.users, STORES.employees], 'readonly', async (t) => {
    const user = await getOne<User>(t, STORES.users, claims.sub);
    if (!user) throw new ApiError(401, 'Account no longer exists.');
    if (!user.is_verified) throw new ApiError(403, 'Please verify your email address to continue.');
    const employee = (await getOne<Employee>(t, STORES.employees, user.employee_id)) ?? null;
    return { user, employee, role: user.role };
  });
}

export function requireHR(ctx: RequestContext): void {
  if (ctx.role !== 'HR')
  throw new ApiError(403, 'Forbidden — this action is restricted to HR officers.');
}

/** Employees may only ever address their own record. */
export function assertSelfOrHR(ctx: RequestContext, employeeId: string): void {
  if (ctx.role === 'HR') return;
  if (ctx.user.employee_id !== employeeId)
  throw new ApiError(403, "Forbidden — you can only access your own records.");
}

export function publicUser(user: User): PublicUser {
  return {
    user_id: user.user_id,
    employee_id: user.employee_id,
    email: user.email,
    role: user.role,
    is_verified: user.is_verified,
    created_at: user.created_at
  };
}

export const now = (): string => new Date().toISOString();

export async function writeAudit(
t: IDBTransaction,
entry: {user_id: number;actor: string;action: string;entity: string;entity_id: string;})
: Promise<void> {
  const log: Omit<AuditLog, 'log_id'> = { ...entry, timestamp: now() };
  await addTo(t, STORES.audit_logs, log);
}

export async function notify(
t: IDBTransaction,
entry: {user_id: number;title: string;message: string;})
: Promise<void> {
  const notification: Omit<AppNotification, 'notification_id'> = {
    ...entry,
    is_read: false,
    created_at: now()
  };
  await addTo(t, STORES.notifications, notification);
}

export async function employeeUserId(t: IDBTransaction, employeeId: string): Promise<number> {
  const employee = await getOne<Employee>(t, STORES.employees, employeeId);
  if (!employee) throw new ApiError(404, 'Employee not found.');
  return employee.user_id;
}

export async function hrRecipients(t: IDBTransaction): Promise<User[]> {
  const users = await getAllFrom<User>(t, STORES.users);
  return users.filter((u) => u.role === 'HR');
}

export async function findUserByEmail(t: IDBTransaction, email: string): Promise<User | undefined> {
  return getByIndex<User>(t, STORES.users, 'email', email.toLowerCase());
}

export async function touchEmployee(t: IDBTransaction, employee: Employee): Promise<void> {
  await putIn(t, STORES.employees, { ...employee, updated_at: now() });
}

export function str(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === 'string' ? value.trim() : '';
}

export function num(body: Record<string, unknown>, key: string): number {
  const value = body[key];
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? NaN : parsed;
}

export function enumField<T extends string>(
body: Record<string, unknown>,
key: string,
allowed: readonly T[],
label: string)
: T {
  const value = str(body, key).toUpperCase() as T;
  if (!allowed.includes(value))
  throw new ApiError(422, `${label} must be one of: ${allowed.join(', ')}.`, {
    [key]: `Invalid ${label.toLowerCase()}.`
  });
  return value;
}