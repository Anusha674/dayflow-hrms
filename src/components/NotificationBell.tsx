import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BellIcon, CheckCheckIcon } from 'lucide-react';
import { notificationService } from '../services/resources';
import { prettyDateTime } from '../utils/format';
import { EmptyState } from './Loading';
import type { AppNotification } from '../types';

const CACHE_KEY = 'dayflow_notification_cache';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) as AppNotification[] : [];
    } catch {
      return [];
    }
  });
  const [unread, setUnread] = useState(0);
  const wrapper = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await notificationService.list();
      setItems(data.items);
      setUnread(data.unread);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data.items.slice(0, 20)));
      } catch {

        /* ignore */}
    } catch {

      /* keep cached list */}
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(load, 20_000);
    const onSynced = () => void load();
    window.addEventListener('dayflow:synced', onSynced);
    window.addEventListener('dayflow:data-changed', onSynced);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('dayflow:synced', onSynced);
      window.removeEventListener('dayflow:data-changed', onSynced);
    };
  }, [load]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (open && wrapper.current && !wrapper.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const markRead = async (id: number) => {
    setItems((prev) => prev.map((n) => n.notification_id === id ? { ...n, is_read: true } : n));
    setUnread((count) => Math.max(0, count - 1));
    try {
      await notificationService.markRead(id);
    } catch {
      void load();
    }
  };

  const markAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
    try {
      await notificationService.markAllRead();
    } catch {
      void load();
    }
  };

  return (
    <div className="relative" ref={wrapper}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors duration-150 ease-soft hover:bg-brand/10 hover:text-ink">
        
        <BellIcon className="h-[18px] w-[18px]" />
        {unread > 0 ?
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span> :
        null}
      </button>

      <AnimatePresence>
        {open ?
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-surface shadow-pop">
          
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <p className="text-sm font-semibold text-ink">Notifications</p>
              <button
              type="button"
              onClick={markAll}
              disabled={!unread}
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand disabled:text-faint">
              
                <CheckCheckIcon className="h-3.5 w-3.5" /> Mark all read
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ?
            <EmptyState title="You're all caught up" description="New updates will appear here." /> :

            <ul className="divide-y divide-line">
                  {items.map((item) =>
              <li key={item.notification_id}>
                      <button
                  type="button"
                  onClick={() => !item.is_read && markRead(item.notification_id)}
                  className={`flex w-full gap-3 px-4 py-3 text-left transition-colors duration-150 ease-soft hover:bg-brand/[0.06] ${
                  item.is_read ? '' : 'bg-brandSoft/60'}`
                  }>
                  
                        <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    item.is_read ? 'bg-transparent' : 'bg-brand'}`
                    }
                    aria-hidden="true" />
                  
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-ink">{item.title}</span>
                          <span className="mt-0.5 block text-sm text-muted">{item.message}</span>
                          <span className="mt-1 block text-[11px] text-faint">
                            {prettyDateTime(item.created_at)}
                          </span>
                        </span>
                      </button>
                    </li>
              )}
                </ul>
            }
            </div>
          </motion.div> :
        null}
      </AnimatePresence>
    </div>);

}