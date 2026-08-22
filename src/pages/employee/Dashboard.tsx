import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  LogInIcon,
  LogOutIcon,
  WalletIcon } from
'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { PageHeader } from '../../components/AppShell';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState, ErrorState, SkeletonCard, Spinner } from '../../components/Loading';
import { useAsync } from '../../hooks/useAsync';
import { attendanceService, dashboardService } from '../../services/resources';
import { friendlyError, OfflineQueuedError } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { hours, money, prettyDate, prettyDateTime, prettyTime, titleCase, weekdayShort } from '../../utils/format';

const CACHE_KEY = 'dayflow_cached_dashboard';

export function EmployeeDashboard() {
  const { employee, user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => dashboardService.employee(), [], CACHE_KEY);
  const [busy, setBusy] = useState<'in' | 'out' | null>(null);

  const punch = async (kind: 'in' | 'out') => {
    setBusy(kind);
    try {
      await (kind === 'in' ? attendanceService.checkIn() : attendanceService.checkOut());
      toast.success(kind === 'in' ? 'Checked in. Have a good day.' : 'Checked out. Hours recorded.');
      await reload();
      window.dispatchEvent(new CustomEvent('dayflow:data-changed'));
    } catch (err) {
      if (err instanceof OfflineQueuedError) toast.warning(err.message);else
      toast.error(friendlyError(err));
    } finally {
      setBusy(null);
    }
  };

  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const today = data?.today ?? null;
  const chart = (data?.last_14_days ?? []).map((day) => ({
    label: weekdayShort(day.date),
    date: day.date,
    hours: day.hours
  }));

  return (
    <>
      <PageHeader
        title={`Good day, ${employee?.name?.split(' ')[0] ?? 'there'}`}
        description={`${user?.employee_id} · ${employee?.designation ?? '—'} · ${employee?.department ?? '—'}`}
        actions={
        <>
            <Link to="/app/leave" className="btn-outline btn-sm">
              Apply for leave
            </Link>
            <Link to="/app/payroll" className="btn-outline btn-sm">
              View payslip
            </Link>
          </>
        } />
      

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Primary: today's attendance — the one thing this screen exists for */}
        <section className="card p-5 lg:col-span-8 lg:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Today · {prettyDate(new Date().toISOString().slice(0, 10))}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                  {today?.check_in ? prettyTime(today.check_in) : 'Not checked in'}
                </h2>
                {today ? <StatusBadge status={today.status} /> : null}
              </div>
              <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <div>
                  <dt className="text-xs text-muted">Check-in</dt>
                  <dd className="tnum font-semibold text-ink">{prettyTime(today?.check_in)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Check-out</dt>
                  <dd className="tnum font-semibold text-ink">{prettyTime(today?.check_out)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Hours today</dt>
                  <dd className="tnum font-semibold text-ink">{hours(today?.working_hours)}</dd>
                </div>
              </dl>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                className="btn-primary"
                onClick={() => punch('in')}
                disabled={busy !== null || Boolean(today?.check_in)}>
                
                {busy === 'in' ? <Spinner /> : <LogInIcon className="h-4 w-4" />}
                Check in
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => punch('out')}
                disabled={busy !== null || !today?.check_in || Boolean(today?.check_out)}>
                
                {busy === 'out' ? <Spinner /> : <LogOutIcon className="h-4 w-4" />}
                Check out
              </button>
            </div>
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-ink">Hours logged · last 14 days</h3>
              <Link to="/app/attendance" className="text-xs font-semibold text-brand hover:underline">
                Full attendance
              </Link>
            </div>
            <div className="mt-3 h-40 w-full">
              {loading && !data ?
              <SkeletonCard className="h-40" /> :

              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" vertical={false} />
                    <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'rgb(var(--faint))' }}
                    axisLine={false}
                    tickLine={false} />
                  
                    <YAxis
                    tick={{ fontSize: 11, fill: 'rgb(var(--faint))' }}
                    axisLine={false}
                    tickLine={false}
                    width={40} />
                  
                    <Tooltip
                    cursor={{ fill: 'rgb(var(--brand) / 0.08)' }}
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid rgb(var(--line))',
                      background: 'rgb(var(--surface))',
                      fontSize: 12,
                      color: 'rgb(var(--ink))'
                    }}
                    formatter={(value: number) => [`${value} h`, 'Worked']}
                    labelFormatter={(_, payload) => prettyDate(payload?.[0]?.payload?.date)} />
                  
                    <Bar dataKey="hours" fill="rgb(var(--brand))" radius={[4, 4, 0, 0]} maxBarSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              }
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:col-span-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Present"
              value={data?.summary.present ?? 0}
              hint="This month"
              icon={CalendarDaysIcon}
              tone="positive" />
            
            <StatCard
              label="Attendance"
              value={`${data?.summary.attendance_rate ?? 0}%`}
              hint={`${hours(data?.summary.hours_this_month)} logged`}
              icon={ClockIcon} />
            
          </div>

          <section className="card p-4">
            <h3 className="text-sm font-semibold text-ink">Leave balance</h3>
            <div className="mt-3 space-y-3">
              {(['PAID', 'SICK'] as const).map((type) => {
                const total = type === 'PAID' ? 18 : 10;
                const left = data?.leave_balance[type] ?? 0;
                return (
                  <div key={type}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-muted">{titleCase(type)} leave</span>
                      <span className="tnum font-semibold text-ink">
                        {left} <span className="text-xs font-normal text-faint">/ {total} days</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-brand transition-[width] duration-300 ease-soft"
                        style={{ width: `${left / total * 100}%` }} />
                      
                    </div>
                  </div>);

              })}
            </div>
            {data?.pending_leaves ?
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                {data.pending_leaves} request(s) awaiting HR approval.
              </p> :
            null}
          </section>

          <section className="card p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Latest payslip</h3>
              <WalletIcon className="h-4 w-4 text-muted" aria-hidden="true" />
            </div>
            {data?.latest_payroll ?
            <>
                <p className="tnum mt-2 text-2xl font-semibold text-ink">
                  {money(data.latest_payroll.net_salary)}
                </p>
                <p className="text-xs text-muted">Net pay · {data.latest_payroll.month}</p>
                <Link
                to="/app/payroll"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
                
                  Open payslip <ArrowRightIcon className="h-3 w-3" />
                </Link>
              </> :

            <p className="mt-2 text-sm text-muted">No payroll published yet.</p>
            }
          </section>
        </div>

        <section className="card lg:col-span-8">
          <header className="border-b border-line px-5 py-3">
            <h3 className="text-sm font-semibold text-ink">Recent activity</h3>
          </header>
          {data?.recent_activity?.length ?
          <ul className="divide-y divide-line">
              {data.recent_activity.map((log) =>
            <li key={log.log_id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{titleCase(log.action)}</p>
                    <p className="truncate text-xs text-muted">
                      {log.entity} · {log.entity_id}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-faint">{prettyDateTime(log.timestamp)}</span>
                </li>
            )}
            </ul> :

          <EmptyState title="No activity yet" description="Your recent actions will appear here." />
          }
        </section>

        <section className="card lg:col-span-4">
          <header className="border-b border-line px-5 py-3">
            <h3 className="text-sm font-semibold text-ink">My recent leave</h3>
          </header>
          {data?.recent_leaves?.length ?
          <ul className="divide-y divide-line">
              {data.recent_leaves.map((leave) =>
            <li key={leave.leave_id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-ink">{titleCase(leave.leave_type)} leave</p>
                    <StatusBadge status={leave.status} dot={false} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {prettyDate(leave.start_date)} → {prettyDate(leave.end_date)}
                  </p>
                </li>
            )}
            </ul> :

          <EmptyState title="No leave requests" description="Apply from the Leave page." />
          }
        </section>
      </div>
    </>);

}