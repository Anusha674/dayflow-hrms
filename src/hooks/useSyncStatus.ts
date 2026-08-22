import { useEffect, useState } from 'react';
import { subscribeSync } from '../utils/offlineSync';
import type { SyncState } from '../types';

export interface SyncSnapshot {
  status: SyncState;
  pending: number;
  lastSync: string | null;
}

export function useSyncStatus(): SyncSnapshot {
  const [snapshot, setSnapshot] = useState<SyncSnapshot>({
    status: navigator.onLine ? 'ONLINE' : 'OFFLINE',
    pending: 0,
    lastSync: null
  });
  useEffect(() => subscribeSync(setSnapshot), []);
  return snapshot;
}