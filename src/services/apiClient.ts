/**
 * Transport layer. Today it dispatches to the in-browser API handler; pointing
 * it at a live FastAPI host is a one-line change (`axios(baseURL + path)`),
 * because request shape, auth header and error contract are identical.
 *
 * Mutations flagged `offline: true` are written to the IndexedDB outbox when
 * the device is offline and replayed by the sync manager.
 */
import { handleRequest, ApiError } from './api';
import { STORES, addTo, tx } from './db';
import type { OutboxItem } from '../types';

export const TOKEN_KEY = 'dayflow_token';

export interface RequestOptions {
  body?: Record<string, unknown>;
  /** Queue this mutation locally if the browser is offline. */
  offline?: boolean;
  /** Human label shown in the sync tray. */
  label?: string;
}

export class OfflineQueuedError extends Error {
  queued = true;
  constructor(message: string) {
    super(message);
    this.name = 'OfflineQueuedError';
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);else
    localStorage.removeItem(TOKEN_KEY);
  } catch {

    /* storage unavailable — session stays in memory */}
}

export const isOnline = (): boolean => navigator.onLine;

async function enqueue(
method: string,
path: string,
body: Record<string, unknown>,
label: string)
: Promise<void> {
  const item: Omit<OutboxItem, 'id'> = {
    method,
    path,
    body,
    label,
    token: getToken(),
    status: 'PENDING',
    attempts: 0,
    error: null,
    created_at: new Date().toISOString()
  };
  await tx([STORES.outbox], 'readwrite', (t) => addTo(t, STORES.outbox, item));
  window.dispatchEvent(new CustomEvent('dayflow:outbox-changed'));
}

async function send<T>(
method: 'GET' | 'POST' | 'PUT' | 'DELETE',
path: string,
options: RequestOptions = {})
: Promise<T> {
  const body = options.body ?? {};
  if (options.offline && !isOnline()) {
    // Offline actions carry the true client time so the record is accurate on replay.
    const stamped = {
      client_timestamp: new Date().toISOString(),
      client_date: new Date().toISOString().slice(0, 10),
      ...body
    };
    await enqueue(method, path, stamped, options.label ?? `${method} ${path}`);
    throw new OfflineQueuedError(
      'You are offline. Your action has been saved and will sync automatically when the connection returns.'
    );
  }
  return handleRequest<T>({ method, path, body, token: getToken() });
}

export const api = {
  get: <T,>(path: string, params?: Record<string, unknown>) => send<T>('GET', path, { body: params }),
  post: <T,>(path: string, body?: Record<string, unknown>, options?: RequestOptions) =>
  send<T>('POST', path, { ...options, body }),
  put: <T,>(path: string, body?: Record<string, unknown>, options?: RequestOptions) =>
  send<T>('PUT', path, { ...options, body }),
  del: <T,>(path: string) => send<T>('DELETE', path)
};

/** Turns any thrown value into a message that is safe to show a user. */
export function friendlyError(error: unknown): string {
  if (error instanceof OfflineQueuedError) return error.message;
  if (error instanceof ApiError) return error.detail;
  if (error instanceof Error && error.name === 'ConstraintError')
  return 'That record already exists.';
  return 'Something went wrong. Please try again.';
}

export function fieldErrors(error: unknown): Record<string, string> {
  return error instanceof ApiError && error.fields ? error.fields : {};
}

export { ApiError };