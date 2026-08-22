import React, { useState } from 'react';
import { DownloadIcon, PrinterIcon } from 'lucide-react';
import { PageHeader } from '../../components/AppShell';
import { DataTable } from '../../components/DataTable';
import { ErrorState } from '../../components/Loading';
import { useAsync } from '../../hooks/useAsync';
import { reportService } from '../../services/resources';
import { downloadCSV, printElement } from '../../utils/exporters';
import { addDays, money, monthISO, prettyDate, prettyMonth, todayISO } from '../../utils/format';

type ReportKey = 'attendance' | 'leave' | 'payroll' | 'employees';

const TABS: {key: ReportKey;label: string;description: string;}[] = [
{ key: 'attendance', label: 'Attendance', description: 'Presence, hours and rate per employee.' },
{ key: 'leave', label: 'Leave', description: 'Every request with its decision and HR comment.' },
{ key: 'payroll', label: 'Payroll', description: 'Monthly salary register with totals.' },
{ key: 'employees', label: 'Employees', description: 'Master roster with current net pay.' }];


export function AdminReports() {
  const [tab, setTab] = useState<ReportKey>('attendance');
  const [from, setFrom] = useState(addDays(todayISO(), -30));
  const [to, setTo] = useState(todayISO());
  const [month, setMonth] = useState(monthISO());

  const attendance = useAsync(() => reportService.attendance(from, to), [from, to]);
  const leave = useAsync(() => reportService.leave(from, to), [from, to]);
  const payroll = useAsync(() => reportService.payroll(month), [month]);
  const employees = useAsync(() => reportService.employees(), []);

  const active = { attendance, leave, payroll, employees }[tab];
  const rows: Record<string, unknown>[] =
  tab === 'attendance' ?
  attendance.data?.rows ?? [] :
  tab === 'leave' ?
  leave.data?.rows ?? [] :
  tab === 'payroll' ?
  (payroll.data?.rows ?? []) as unknown as Record<string, unknown>[] :
  employees.data?.rows ?? [];

  return (
    <>
      <PageHeader
        title="Reports"
        description="Generated from live database records — export to CSV or print to PDF."
        actions={
        <>
            <button
            type="button"
            className="btn-outline btn-sm"
            onClick={() => downloadCSV(`${tab}-report-${todayISO()}`, rows)}
            disabled={!rows.length}>
            
              <DownloadIcon className="h-4 w-4" /> CSV
            </button>
            <button
            type="button"
            className="btn-primary btn-sm"
            onClick={() => printElement('report-surface', `Dayflow ${tab} report`)}
            disabled={!rows.length}>
            
              <PrinterIcon className="h-4 w-4" /> PDF
            </button>
          </>
        } />
      

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Report type" className="inline-flex flex-wrap gap-1 rounded-lg border border-line bg-surface p-1">
          {TABS.map((item) =>
          <button
            key={item.key}
            role="tab"
            aria-selected={tab === item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ease-soft ${
            tab === item.key ? 'bg-brandSoft text-brand' : 'text-muted hover:text-ink'}`
            }>
            
              {item.label}
            </button>
          )}
        </div>

        {tab === 'payroll' ?
        <input
          type="month"
          className="input lg:w-48"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          aria-label="Report month" /> :

        tab === 'employees' ? null :
        <div className="flex items-center gap-2">
            <input
            type="date"
            className="input w-40"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            aria-label="From date" />
          
            <span className="text-sm text-muted">→</span>
            <input
            type="date"
            className="input w-40"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            aria-label="To date" />
          
          </div>
        }
      </div>

      {active.error && !rows.length ?
      <ErrorState message={active.error} onRetry={active.reload} /> :

      <section className="card overflow-hidden" id="report-surface">
          <header className="border-b border-line px-5 py-3">
            <h2 className="text-sm font-semibold text-ink">
              Dayflow · {TABS.find((item) => item.key === tab)?.label} report
            </h2>
            <p className="text-xs text-muted">
              {tab === 'payroll' ?
            prettyMonth(month) :
            tab === 'employees' ?
            'All active employees' :
            `${prettyDate(from)} → ${prettyDate(to)}`}{' '}
              · {rows.length} row(s)
            </p>
          </header>

          {tab === 'payroll' && payroll.data ?
        <div className="grid grid-cols-2 gap-4 border-b border-line px-5 py-3 text-sm sm:grid-cols-4">
              <Total label="Headcount" value={String(payroll.data.totals.headcount)} />
              <Total label="Basic" value={money(payroll.data.totals.basic)} />
              <Total label="Deductions" value={money(payroll.data.totals.deductions)} />
              <Total label="Net" value={money(payroll.data.totals.net)} />
            </div> :
        null}

          <DataTable<Record<string, unknown>>
          rows={rows}
          loading={active.loading}
          rowKey={(row) => String(row.employee_id ?? row.leave_id ?? row.name ?? '')}
          emptyTitle="No data for this range"
          emptyDescription="Adjust the filters above to widen the report."
          cardTitle={(row) => String(row.name ?? row.employee_id ?? '')}
          columns={columnsFor(tab)} />
        
        </section>
      }
    </>);

}

function columnsFor(tab: ReportKey) {
  if (tab === 'attendance')
  return [
  { key: 'employee_id', header: 'ID' },
  { key: 'name', header: 'Employee' },
  { key: 'department', header: 'Department' },
  { key: 'present', header: 'Present', align: 'right' as const },
  { key: 'half_day', header: 'Half day', align: 'right' as const },
  { key: 'leave', header: 'Leave', align: 'right' as const },
  { key: 'absent', header: 'Absent', align: 'right' as const },
  { key: 'total_hours', header: 'Hours', align: 'right' as const },
  {
    key: 'attendance_rate',
    header: 'Rate',
    align: 'right' as const,
    render: (row: Record<string, unknown>) => `${row.attendance_rate}%`
  }];

  if (tab === 'leave')
  return [
  { key: 'employee_id', header: 'ID' },
  { key: 'name', header: 'Employee' },
  { key: 'leave_type', header: 'Type' },
  { key: 'start_date', header: 'From' },
  { key: 'end_date', header: 'To' },
  { key: 'days', header: 'Days', align: 'right' as const },
  { key: 'status', header: 'Status' },
  { key: 'hr_comment', header: 'HR comment' }];

  if (tab === 'payroll')
  return [
  { key: 'employee_id', header: 'ID' },
  { key: 'name', header: 'Employee' },
  { key: 'department', header: 'Department' },
  {
    key: 'basic_salary',
    header: 'Basic',
    align: 'right' as const,
    render: (row: Record<string, unknown>) => money(Number(row.basic_salary))
  },
  {
    key: 'allowances',
    header: 'Allowances',
    align: 'right' as const,
    render: (row: Record<string, unknown>) => money(Number(row.allowances))
  },
  {
    key: 'deductions',
    header: 'Deductions',
    align: 'right' as const,
    render: (row: Record<string, unknown>) => money(Number(row.deductions))
  },
  {
    key: 'net_salary',
    header: 'Net',
    align: 'right' as const,
    render: (row: Record<string, unknown>) => money(Number(row.net_salary))
  }];

  return [
  { key: 'employee_id', header: 'ID' },
  { key: 'name', header: 'Employee' },
  { key: 'department', header: 'Department' },
  { key: 'designation', header: 'Designation' },
  { key: 'joining_date', header: 'Joined' },
  { key: 'phone', header: 'Phone' },
  {
    key: 'net_salary',
    header: 'Net pay',
    align: 'right' as const,
    render: (row: Record<string, unknown>) => money(Number(row.net_salary))
  }];

}

function Total({ label, value }: {label: string;value: string;}) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="tnum font-semibold text-ink">{value}</p>
    </div>);

}