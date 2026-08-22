import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, LogInIcon, LogOutIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/AppShell';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Spinner } from '../../components/Loading';
import { useAsync } from '../../hooks/useAsync';
import { attendanceService } from '../../services/resources';
import { friendlyError, OfflineQueuedError } from '../../services/apiClient';
import { downloadCSV } from '../../utils/exporters';
import { addDays, hours, prettyDate, prettyTime, todayISO, weekdayShort } from '../../utils/format';
import type { Attendance } from '../../types';

export function EmployeeAttendance() {
  const [view, setView] = useState<'weekly' | 'history'>('weekly');
  const [weekAnchor, setWeekAnchor] = useState(todayISO());
  const [busy, setBusy] = useState<'in' | 'out' | null>(null);

  const weekly = useAsync(() => attendanceService.weekly(weekAnchor), [weekAnchor]);
  const history = useAsync(() => attendanceService.mine(), []);

  const refreshAll = async () => {
    await Promise.all([weekly.reload(), history.reload()]);
  };

  const punch = async (kind: 'in' | 'out') => {
    setBusy(kind);
    try {
      await (kind === 'in' ? attendanceService.checkIn() : attendanceService.checkOut());
      toast.success(kind === 'in' ? 'Checked in.' : 'Checked out.');
      await refreshAll();
    } catch (error) {
      if (error instanceof OfflineQueuedError) toast.warning(error.message);else
      toast.error(friendlyError(error));
    } finally {
      setBusy(null);
    }
  };

  const today = history.data?.find((row) => row.date === todayISO()) ?? null;

  return (
    <>
      <PageHeader
        title="My attendance"
        description="Daily and weekly view of your presence, hours and status."
        actions={
        <>
            <button
            type="button"
            className="btn-primary btn-sm"
            onClick={() => punch('in')}
            disabled={busy !== null || Boolean(today?.check_in)}>
            
              {busy === 'in' ? <Spinner /> : <LogInIcon className="h-4 w-4" />} Check in
            </button>
            <button
            type="button"
            className="btn-outline btn-sm"
            onClick={() => punch('out')}
            disabled={busy !== null || !today?.check_in || Boolean(today?.check_out)}>
            
              {busy === 'out' ? <Spinner /> : <LogOutIcon className="h-4 w-4" />} Check out
            </button>
            <button
            type="button"
            className="btn-outline btn-sm"
            onClick={() =>
            downloadCSV(`my-attendance-${todayISO()}`, (history.data ?? []) as unknown as Record<string, unknown>[], [
            'date',
            'check_in',
            'check_out',
            'working_hours',
            'status']
            )
            }
            disabled={!history.data?.length}>
            
              <DownloadIcon className="h-4 w-4" /> CSV
            </button>
          </>
        } />
      

      <div
        role="tablist"
        aria-label="Attendance views"
        className="mb-4 inline-flex rounded-lg border border-line bg-surface p-1">
        
        {(['weekly', 'history'] as const).map((tab) =>
        <button
          key={tab}
          role="tab"
          aria-selected={view === tab}
          type="button"
          onClick={() => setView(tab)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ease-soft ${
          view === tab ? 'bg-brandSoft text-brand' : 'text-muted hover:text-ink'}`
          }>
          
            {tab === 'weekly' ? 'Weekly' : 'Full history'}
          </button>
        )}
      </div>

      {view === 'weekly' ?
      <section className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                Week of {prettyDate(weekly.data?.week_start)}
              </h2>
              <p className="text-xs text-muted">
                {hours(weekly.data?.total_hours)} logged across the week
              </p>
            </div>
            <div className="flex gap-1">
              <button
              type="button"
              className="btn-outline btn-sm"
              onClick={() => setWeekAnchor((value) => addDays(value, -7))}
              aria-label="Previous week">
              
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
              type="button"
              className="btn-outline btn-sm"
              onClick={() => setWeekAnchor(todayISO())}>
              
                This week
              </button>
              <button
              type="button"
              className="btn-outline btn-sm"
              onClick={() => setWeekAnchor((value) => addDays(value, 7))}
              aria-label="Next week"
              disabled={(weekly.data?.week_end ?? '') >= todayISO()}>
              
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {(weekly.data?.days ?? []).map((day) =>
          <li
            key={day.date}
            className={`rounded-xl border p-3 ${
            day.date === todayISO() ? 'border-brand bg-brandSoft/50' : 'border-line'}`
            }>
            
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {weekdayShort(day.date)} · {day.date.slice(8)}
                  </p>
                  {day.record ? <StatusBadge status={day.record.status} dot={false} /> : null}
                </div>
                <p className="tnum mt-2 text-lg font-semibold text-ink">
                  {hours(day.record?.working_hours)}
                </p>
                <p className="tnum text-xs text-muted">
                  {prettyTime(day.record?.check_in)} — {prettyTime(day.record?.check_out)}
                </p>
              </li>
          )}
          </ul>
        </section> :

      <section className="card overflow-hidden">
          <DataTable<Attendance>
          rows={history.data ?? []}
          loading={history.loading}
          error={history.error}
          onRetry={history.reload}
          rowKey={(row) => row.attendance_id}
          emptyTitle="No attendance recorded yet"
          emptyDescription="Your check-ins will appear here as soon as you start the day."
          cardTitle={(row) => prettyDate(row.date)}
          columns={[
          { key: 'date', header: 'Date', render: (row) => prettyDate(row.date) },
          { key: 'check_in', header: 'Check-in', render: (row) => prettyTime(row.check_in) },
          { key: 'check_out', header: 'Check-out', render: (row) => prettyTime(row.check_out) },
          {
            key: 'working_hours',
            header: 'Hours',
            align: 'right',
            render: (row) => hours(row.working_hours)
          },
          { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> }]
          } />
        
        </section>
      }
    </>);

}