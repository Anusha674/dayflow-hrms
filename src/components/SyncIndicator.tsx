import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2Icon,
  CloudOffIcon,
  RefreshCwIcon,
  TriangleAlertIcon,
  WifiIcon } from
'lucide-react';
import { toast } from 'sonner';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { discardFailed, pendingItems, retryFailed, syncNow } from '../utils/offlineSync';
import { prettyDateTime } from '../utils/format';
import type { OutboxItem, SyncState } from '../types';

const LOOK: Record<SyncState, {label: string;icon: React.ElementType;className: string;}> = {
  ONLINE: { label: 'Online', icon: WifiIcon, className: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300' },
  OFFLINE: { label: 'Offline', icon: CloudOffIcon, className: 'text-amber-800 bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300' },
  SYNCING: { label: 'Syncing', icon: RefreshCwIcon, className: 'text-sky-800 bg-sky-100 dark:bg-sky-500/15 dark:text-sky-300' },
  SYNCED: { label: 'Synced', icon: CheckCircle2Icon, className: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300' },
  FAILED: { label: 'Sync failed', icon: TriangleAlertIcon, className: 'text-rose-700 bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300' }
};

export function SyncIndicator() {
  const { status, pending, lastSync } = useSyncStatus();
  const [open, setOpen] = useState(false);
  const [queue, setQueue] = useState<OutboxItem[]>([]);
  const wrapper = useRef<HTMLDivElement>(null);
  const look = LOOK[status];
  const Icon = look.icon;

  useEffect(() => {
    const load = () => void pendingItems().then(setQueue);
    load();
    window.addEventListener('dayflow:outbox-changed', load);
    window.addEventListener('dayflow:synced', load);
    const id = window.setInterval(load, 5000);
    return () => {
      window.removeEventListener('dayflow:outbox-changed', load);
      window.removeEventListener('dayflow:synced', load);
      window.clearInterval(id);
    };
  }, [status, pending]);

  useEffect(() => {
    const onSynced = (event: Event) => {
      const detail = (event as CustomEvent<{synced: number;failed: number;}>).detail;
      if (detail?.synced) toast.success(`${detail.synced} offline action(s) synchronised.`);
      if (detail?.failed) toast.error(`${detail.failed} queued action(s) were rejected by the server.`);
      window.dispatchEvent(new CustomEvent('dayflow:data-changed'));
    };
    window.addEventListener('dayflow:synced', onSynced);
    return () => window.removeEventListener('dayflow:synced', onSynced);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (open && wrapper.current && !wrapper.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const failed = queue.filter((item) => item.status === 'FAILED');

  return (
    <div className="relative" ref={wrapper}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={`Connection status: ${look.label}`}
        className={`badge h-8 gap-1.5 px-2.5 transition-colors duration-150 ease-soft ${look.className}`}>
        
        <Icon className={`h-3.5 w-3.5 ${status === 'SYNCING' ? 'animate-spin' : ''}`} aria-hidden="true" />
        <span className="hidden sm:inline">{look.label}</span>
        {pending > 0 ? <span className="tnum">{pending}</span> : null}
      </button>

      <AnimatePresence>
        {open ?
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-4 shadow-pop">
          
            <p className="text-sm font-semibold text-ink">Synchronisation</p>
            <p className="mt-1 text-xs text-muted">
              Last successful sync: {lastSync ? prettyDateTime(lastSync) : 'not yet'}
            </p>

            {queue.length === 0 ?
          <p className="mt-3 rounded-lg bg-brandSoft px-3 py-2 text-xs text-brand">
                Nothing queued — every action has reached the server.
              </p> :

          <ul className="mt-3 space-y-2">
                {queue.slice(0, 6).map((item) =>
            <li
              key={item.id}
              className="rounded-lg border border-line px-3 py-2 text-xs text-muted">
              
                    <span className="font-semibold text-ink">{item.label}</span>
                    <span className="block">{prettyDateTime(item.created_at)}</span>
                    {item.error ? <span className="mt-1 block text-rose-600">{item.error}</span> : null}
                  </li>
            )}
              </ul>
          }

            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-outline btn-sm" onClick={() => void syncNow()}>
                Sync now
              </button>
              {failed.length ?
            <>
                  <button type="button" className="btn-outline btn-sm" onClick={() => void retryFailed()}>
                    Retry failed
                  </button>
                  <button type="button" className="btn-ghost btn-sm text-rose-600" onClick={() => void discardFailed()}>
                    Discard failed
                  </button>
                </> :
            null}
            </div>
          </motion.div> :
        null}
      </AnimatePresence>
    </div>);

}