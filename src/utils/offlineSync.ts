/**
 * Synchronisation manager.
 *
 * Drains the IndexedDB outbox whenever connectivity returns, replaying each
 * queued mutation against the API with the token captured at queue time. The
 * backend re-validates every replayed request, so an offline action can still
 * be rejected (duplicate check-in, overlapping leave) — those are surfaced as
 * FAILED rather than silently dropped.
 */
import { STORES, deleteFrom, getAllFrom, putIn, tx } from '../services/db';
import { handleRequest, ApiError } from '../services/api';
import type { OutboxItem, SyncState } from '../types';

export const LAST_SYNC_KEY = 'dayflow_last_sync';

type Listener = (state: {status: SyncState;pending: number;lastSync: string | null;}) => void;

const listeners = new Set<Listener>();
let status: SyncState = navigator.onLine ? 'ONLINE' : 'OFFLINE';
let pending = 0;
let draining = false;

function readLastSync(): string | null {
  try {
    return localStorage.getItem(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

function emit(): void {
  const snapshot = { status, pending, lastSync: readLastSync() };
  listeners.forEach((listener) => listener(snapshot));
}

export function subscribeSync(listener: Listener): () => void {
  listeners.add(listener);
  listener({ status, pending, lastSync: readLastSync() });
  return () => listeners.delete(listener);
}

export async function pendingItems(): Promise<OutboxItem[]> {
  return tx([STORES.outbox], 'readonly', (t) => getAllFrom<OutboxItem>(t, STORES.outbox));
}

async function refreshPending(): Promise<OutboxItem[]> {
  const items = await pendingItems();
  pending = items.filter((i) => i.status !== 'FAILED').length;
  return items;
}

export async function syncNow(): Promise<{synced: number;failed: number;}> {
  if (draining) return { synced: 0, failed: 0 };
  const items = (await refreshPending()).filter((i) => i.status !== 'FAILED');
  if (!navigator.onLine) {
    status = 'OFFLINE';
    emit();
    return { synced: 0, failed: 0 };
  }
  if (!items.length) {
    status = 'ONLINE';
    emit();
    return { synced: 0, failed: 0 };
  }

  draining = true;
  status = 'SYNCING';
  emit();

  let synced = 0;
  let failed = 0;
  for (const item of items) {
    try {
      await handleRequest({
        method: item.method as 'POST',
        path: item.path,
        body: item.body as Record<string, unknown>,
        token: item.token
      });
      await tx([STORES.outbox], 'readwrite', (t) => deleteFrom(t, STORES.outbox, item.id));
      synced += 1;
    } catch (error) {
      failed += 1;
      const detail = error instanceof ApiError ? error.detail : 'Sync failed. Will retry.';
      const attempts = item.attempts + 1;
      const permanent = error instanceof ApiError && error.status >= 400 && error.status < 500;
      await tx([STORES.outbox], 'readwrite', (t) =>
      putIn(t, STORES.outbox, {
        ...item,
        attempts,
        error: detail,
        status: permanent || attempts >= 5 ? 'FAILED' : 'PENDING'
      } as OutboxItem)
      );
    }
  }

  await refreshPending();
  draining = false;
  status = failed ? 'FAILED' : 'SYNCED';
  if (synced) {
    try {
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch {

      /* ignore */}
  }
  emit();
  window.dispatchEvent(new CustomEvent('dayflow:synced', { detail: { synced, failed } }));
  if (!failed) {
    window.setTimeout(() => {
      if (!draining && status === 'SYNCED') {
        status = navigator.onLine ? 'ONLINE' : 'OFFLINE';
        emit();
      }
    }, 2500);
  }
  return { synced, failed };
}

export async function discardFailed(): Promise<void> {
  const items = await pendingItems();
  for (const item of items.filter((i) => i.status === 'FAILED')) {
    await tx([STORES.outbox], 'readwrite', (t) => deleteFrom(t, STORES.outbox, item.id));
  }
  await refreshPending();
  status = navigator.onLine ? 'ONLINE' : 'OFFLINE';
  emit();
}

export async function retryFailed(): Promise<void> {
  const items = await pendingItems();
  for (const item of items.filter((i) => i.status === 'FAILED')) {
    await tx([STORES.outbox], 'readwrite', (t) =>
    putIn(t, STORES.outbox, { ...item, status: 'PENDING', attempts: 0, error: null })
    );
  }
  await syncNow();
}

let started = false;

export function startSyncManager(): void {
  if (started) return;
  started = true;

  window.addEventListener('online', () => {
    status = 'ONLINE';
    emit();
    void syncNow();
  });
  window.addEventListener('offline', () => {
    status = 'OFFLINE';
    emit();
  });
  window.addEventListener('dayflow:outbox-changed', () => {
    void refreshPending().then(emit);
  });

  void refreshPending().then(() => {
    emit();
    if (navigator.onLine) void syncNow();
  });
  // Periodic safety net for flaky connections that never fire an 'online' event.
  window.setInterval(() => {
    if (navigator.onLine && pending > 0) void syncNow();
  }, 30_000);
}