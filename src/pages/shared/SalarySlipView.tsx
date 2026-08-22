import React from 'react';
import { money, prettyDate, prettyDateTime, prettyMonth } from '../../utils/format';
import type { SalarySlip } from '../../services/resources';

export function SalarySlipView({ slip }: {slip: SalarySlip;}) {
  const { employee, payroll, attendance_summary } = slip;
  const gross = payroll.basic_salary + payroll.allowances;

  return (
    <article className="p-5 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Salary slip</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">
            {prettyMonth(payroll.month)}
          </h2>
          <p className="mt-0.5 text-sm text-muted">Dayflow · Human Resource Management System</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold text-ink">{employee.name}</p>
          <p className="text-muted">{employee.designation}</p>
          <p className="text-muted">
            {employee.employee_id} · {employee.department}
          </p>
          <p className="text-xs text-faint">Joined {prettyDate(employee.joining_date)}</p>
        </div>
      </header>

      <div className="grid gap-6 py-5 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Earnings</h3>
          <dl className="mt-2 space-y-2 text-sm">
            <LineItem label="Basic salary" value={money(payroll.basic_salary)} />
            <LineItem label="Allowances" value={money(payroll.allowances)} />
            <LineItem label="Gross pay" value={money(gross)} strong />
          </dl>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Deductions</h3>
          <dl className="mt-2 space-y-2 text-sm">
            <LineItem label="Statutory & other" value={money(payroll.deductions)} />
            <LineItem label="Total deductions" value={money(payroll.deductions)} strong />
          </dl>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-brandSoft px-4 py-3">
        <p className="text-sm font-semibold text-brand">Net payable</p>
        <p className="tnum text-2xl font-semibold text-brand">{money(payroll.net_salary)}</p>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Attendance for this month
        </h3>
        <dl className="mt-2 grid grid-cols-4 gap-3 text-sm">
          <Cell label="Present" value={attendance_summary.present} />
          <Cell label="Half day" value={attendance_summary.half_day} />
          <Cell label="Leave" value={attendance_summary.leave} />
          <Cell label="Absent" value={attendance_summary.absent} />
        </dl>
      </div>

      <p className="mt-5 text-[11px] text-faint">
        Computer-generated document · issued {prettyDateTime(slip.generated_at)} · net pay is derived
        server-side as basic + allowances − deductions.
      </p>
    </article>);

}

function LineItem({ label, value, strong }: {label: string;value: string;strong?: boolean;}) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${strong ? 'border-t border-line pt-2' : ''}`}>
      <dt className="text-muted">{label}</dt>
      <dd className={`tnum ${strong ? 'font-semibold text-ink' : 'text-ink'}`}>{value}</dd>
    </div>);

}

function Cell({ label, value }: {label: string;value: number;}) {
  return (
    <div className="rounded-lg border border-line px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="tnum text-lg font-semibold text-ink">{value}</dd>
    </div>);

}