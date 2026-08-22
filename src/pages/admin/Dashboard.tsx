import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  UserMinusIcon,
  UsersIcon,
  WalletIcon } from
'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis } from
'recharts';
import { PageHeader } from '../../components/AppShell';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState, ErrorState, SkeletonCard } from '../../components/Loading';
import { useAsync } from '../../hooks/useAsync';
import { dashboardService } from '../../services/resources';
import { money, prettyDate, prettyMonth, titleCase } from '../../utils/format';

const CACHE_KEY = 'dayflow_cached_admin_dashboard';

export function AdminDashboard() {
  const { data, loading, error, reload } = useAsync(() => dashboardService.admin(), [], CACHE_KEY);

  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  const totals = data?.totals;

  return (
    <>
      <PageHeader
        title="HR overview"
        description={`Live position for ${prettyDate(new Date().toISOString().slice(0, 10))}`}
        actions={
        <>
            <Link to="/admin/leave" className="btn-primary btn-sm">
              Review approvals{totals?.pending_leaves ? ` (${totals.pending_leaves})` : ''}
            </Link>
            <Link to="/admin/reports" className="btn-outline btn-sm">
              Reports
            </Link>
          </>
        } />
      

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Primary metric: today's coverage */}
        <section className="card p-5 lg:col-span-5 lg:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Attendance today
          </p>
          <p className="tnum mt-2 text-5xl font-semibold tracking-tight text-ink">
            {totals?.attendance_rate ?? 0}%
          </p>
          <p className="mt-1 text-sm text-muted">
            {totals?.present ?? 0} of {totals?.employees ?? 0} employees present
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-sm">
            <Segment label="Present" value={totals?.present ?? 0} tone="text-emerald-600" />
            <Segment label="On leave" value={totals?.on_leave ?? 0} tone="text-sky-600" />
            <Segment label="Absent" value={totals?.absent ?? 0} tone="text-rose-600" />
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
          <StatCard label="Total employees" value={totals?.employees ?? 0} icon={UsersIcon} hint="Active headcount" />
          <StatCard
            label="Pending approvals"
            value={totals?.pending_leaves ?? 0}
            icon={CalendarClockIcon}
            tone="warning"
            hint="Leave requests awaiting a decision" />
          
          <StatCard
            label="Half day"
            value={totals?.half_day ?? 0}
            icon={UserMinusIcon}
            hint="Partial attendance today" />
          
          <StatCard
            label={`Payroll · ${prettyMonth(totals?.payroll_month)}`}
            value={money(totals?.payroll_total ?? 0)}
            icon={WalletIcon}
            tone="positive"
            hint={`${totals?.payroll_published ?? 0} payslips published`} />
          
        </div>

        <section className="card p-5 lg:col-span-7">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-ink">Attendance trend · last 14 days</h2>
            <Link to="/admin/analytics" className="text-xs font-semibold text-brand hover:underline">
              Full analytics
            </Link>
          </div>
          <div className="mt-4 h-56">
            {loading && !data ?
            <SkeletonCard className="h-56" /> :

            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.attendance_trend ?? []} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="presentFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(var(--brand))" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="rgb(var(--brand))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" vertical={false} />
                  <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) => value.slice(8)}
                  tick={{ fontSize: 11, fill: 'rgb(var(--faint))' }}
                  axisLine={false}
                  tickLine={false} />
                
                  <YAxis
                  tick={{ fontSize: 11, fill: 'rgb(var(--faint))' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  allowDecimals={false} />
                
                  <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid rgb(var(--line))',
                    background: 'rgb(var(--surface))',
                    fontSize: 12,
                    color: 'rgb(var(--ink))'
                  }}
                  labelFormatter={(value: string) => prettyDate(value)} />
                
                  <Area
                  type="monotone"
                  dataKey="present"
                  name="Present"
                  stroke="rgb(var(--brand))"
                  strokeWidth={2}
                  fill="url(#presentFill)" />
                
                  <Area
                  type="monotone"
                  dataKey="leave"
                  name="On leave"
                  stroke="#0ea5e9"
                  strokeWidth={1.5}
                  fill="transparent" />
                
                </AreaChart>
              </ResponsiveContainer>
            }
          </div>
        </section>

        <section className="card lg:col-span-5">
          <header className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 className="text-sm font-semibold text-ink">Approval queue</h2>
            <Link to="/admin/leave" className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
              Open <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </header>
          {data?.pending_queue?.length ?
          <ul className="divide-y divide-line">
              {data.pending_queue.map((item) =>
            <li key={item.leave_id} className="flex items-start justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                    <p className="truncate text-xs text-muted">
                      {titleCase(item.leave_type)} · {item.days} day(s) · {prettyDate(item.start_date)}
                    </p>
                  </div>
                  <StatusBadge status={item.status} dot={false} />
                </li>
            )}
            </ul> :

          <EmptyState
            icon={CheckCircle2Icon}
            title="Queue is clear"
            description="No leave requests are waiting on HR." />

          }
        </section>
      </div>
    </>);

}

function Segment({ label, value, tone }: {label: string;value: number;tone: string;}) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className={`tnum text-xl font-semibold ${tone}`}>{value}</p>
    </div>);

}