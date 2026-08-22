import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis } from
'recharts';
import { PageHeader } from '../../components/AppShell';
import { ErrorState, SkeletonCard } from '../../components/Loading';
import { useAsync } from '../../hooks/useAsync';
import { dashboardService } from '../../services/resources';
import { money, prettyMonth, titleCase } from '../../utils/format';

const STATUS_COLORS: Record<string, string> = {
  PRESENT: '#10b981',
  HALF_DAY: '#f59e0b',
  LEAVE: '#0ea5e9',
  ABSENT: '#f43f5e',
  PAID: '#0e7c7b',
  SICK: '#f59e0b',
  UNPAID: '#64748b'
};

const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid rgb(var(--line))',
  background: 'rgb(var(--surface))',
  fontSize: 12,
  color: 'rgb(var(--ink))'
};

export function AdminAnalytics() {
  const { data, loading, error, reload } = useAsync(() => dashboardService.admin(), []);

  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  if (loading && !data)
  return (
    <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) =>
      <SkeletonCard key={index} className="h-72" />
      )}
      </div>);


  return (
    <>
      <PageHeader
        title="Analytics"
        description={`Workforce trends across ${data?.totals.employees ?? 0} employees, computed from live attendance, leave and payroll data.`} />
      

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Attendance status distribution"
          subtitle="All recorded attendance days">
          
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data?.status_distribution ?? []}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}>
                
                {(data?.status_distribution ?? []).map((entry) =>
                <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#94a3b8'} />
                )}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [value, titleCase(name)]} />
              <Legend
                formatter={(value: string) =>
                <span style={{ fontSize: 12, color: 'rgb(var(--muted))' }}>{titleCase(value)}</span>
                } />
              
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Employees per department" subtitle="Current headcount split">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data?.departments ?? []}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'rgb(var(--faint))' }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }}
                axisLine={false}
                tickLine={false} />
              
              <Tooltip cursor={{ fill: 'rgb(var(--brand) / 0.08)' }} contentStyle={tooltipStyle} />
              <Bar dataKey="value" name="Employees" fill="rgb(var(--brand))" radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Leave trend" subtitle="Requests raised over the last 6 months">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.leave_trend ?? []} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={(value: string) => prettyMonth(value).slice(0, 3)}
                tick={{ fontSize: 11, fill: 'rgb(var(--faint))' }}
                axisLine={false}
                tickLine={false} />
              
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'rgb(var(--faint))' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(value: string) => prettyMonth(value)} />
              <Legend formatter={(value: string) => <span style={{ fontSize: 12, color: 'rgb(var(--muted))' }}>{titleCase(value)}</span>} />
              <Line type="monotone" dataKey="PAID" stroke={STATUS_COLORS.PAID} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="SICK" stroke={STATUS_COLORS.SICK} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="UNPAID" stroke={STATUS_COLORS.UNPAID} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Leave type distribution" subtitle="Share of all requests ever raised">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data?.leave_distribution ?? []}
                dataKey="value"
                nameKey="name"
                outerRadius={95}
                paddingAngle={2}>
                
                {(data?.leave_distribution ?? []).map((entry) =>
                <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#94a3b8'} />
                )}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [value, titleCase(name)]} />
              <Legend formatter={(value: string) => <span style={{ fontSize: 12, color: 'rgb(var(--muted))' }}>{titleCase(value)}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <section className="card mt-4 p-5">
        <h2 className="text-sm font-semibold text-ink">Payroll overview</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted">Month</dt>
            <dd className="mt-0.5 text-lg font-semibold text-ink">
              {prettyMonth(data?.totals.payroll_month)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Payslips published</dt>
            <dd className="tnum mt-0.5 text-lg font-semibold text-ink">
              {data?.totals.payroll_published ?? 0} / {data?.totals.employees ?? 0}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Total net payout</dt>
            <dd className="tnum mt-0.5 text-lg font-semibold text-ink">
              {money(data?.totals.payroll_total ?? 0)}
            </dd>
          </div>
        </dl>
      </section>
    </>);

}

function Panel({
  title,
  subtitle,
  children




}: {title: string;subtitle: string;children: React.ReactNode;}) {
  return (
    <section className="card p-5">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <p className="text-xs text-muted">{subtitle}</p>
      <div className="mt-4 h-64">{children}</div>
    </section>);

}