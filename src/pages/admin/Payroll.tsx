import React, { useMemo, useState } from 'react';
import { DownloadIcon, PencilIcon, PrinterIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/AppShell';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { Spinner, SkeletonCard, ErrorState } from '../../components/Loading';
import { SalarySlipView } from '../shared/SalarySlipView';
import { useAsync } from '../../hooks/useAsync';
import { payrollService } from '../../services/resources';
import type { PayrollRow } from '../../services/resources';
import { fieldErrors, friendlyError } from '../../services/apiClient';
import { downloadCSV, printElement } from '../../utils/exporters';
import { money, monthISO, prettyMonth } from '../../utils/format';

export function AdminPayroll() {
  const [month, setMonth] = useState(monthISO());
  const { data, loading, error, reload } = useAsync(() => payrollService.all(month), [month]);
  const [editing, setEditing] = useState<PayrollRow | null>(null);
  const [slipFor, setSlipFor] = useState<PayrollRow | null>(null);

  const totals = useMemo(() => {
    const rows = data ?? [];
    return {
      headcount: rows.length,
      gross: rows.reduce((sum, row) => sum + row.basic_salary + row.allowances, 0),
      deductions: rows.reduce((sum, row) => sum + row.deductions, 0),
      net: rows.reduce((sum, row) => sum + row.net_salary, 0)
    };
  }, [data]);

  return (
    <>
      <PageHeader
        title="Payroll"
        description="Publish and correct salary structures. Net pay is always recalculated on the server."
        actions={
        <>
            <input
            type="month"
            className="input h-8 w-40 text-[13px]"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            aria-label="Payroll month" />
          
            <button
            type="button"
            className="btn-outline btn-sm"
            onClick={() =>
            downloadCSV(`payroll-${month}`, (data ?? []) as unknown as Record<string, unknown>[], [
            'employee_id',
            'name',
            'department',
            'month',
            'basic_salary',
            'allowances',
            'deductions',
            'net_salary']
            )
            }
            disabled={!data?.length}>
            
              <DownloadIcon className="h-4 w-4" /> Export CSV
            </button>
          </>
        } />
      

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary label="Payslips" value={String(totals.headcount)} />
        <Summary label="Gross" value={money(totals.gross)} />
        <Summary label="Deductions" value={money(totals.deductions)} />
        <Summary label="Net payout" value={money(totals.net)} emphasis />
      </div>

      <section className="card overflow-hidden">
        <DataTable<PayrollRow>
          rows={data ?? []}
          loading={loading}
          error={error}
          onRetry={reload}
          rowKey={(row) => row.payroll_id}
          emptyTitle={`No payroll published for ${prettyMonth(month)}`}
          emptyDescription="Use edit on any employee to publish their structure for this month."
          cardTitle={(row) => row.name}
          cardMeta={(row) => `${row.employee_id} · ${row.department}`}
          columns={[
          { key: 'name', header: 'Employee' },
          { key: 'employee_id', header: 'ID' },
          { key: 'designation', header: 'Designation' },
          { key: 'basic_salary', header: 'Basic', align: 'right', render: (row) => money(row.basic_salary) },
          { key: 'allowances', header: 'Allowances', align: 'right', render: (row) => money(row.allowances) },
          { key: 'deductions', header: 'Deductions', align: 'right', render: (row) => money(row.deductions) },
          { key: 'net_salary', header: 'Net pay', align: 'right', render: (row) => money(row.net_salary) }]
          }
          actions={(row) =>
          <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className="btn-outline btn-sm" onClick={() => setSlipFor(row)}>
                Slip
              </button>
              <button type="button" className="btn-outline btn-sm" onClick={() => setEditing(row)}>
                <PencilIcon className="h-3.5 w-3.5" /> Edit
              </button>
            </div>
          } />
        
      </section>

      <EditPayrollModal
        row={editing}
        month={month}
        onClose={() => setEditing(null)}
        onSaved={async () => {
          setEditing(null);
          await reload();
        }} />
      

      <SlipModal row={slipFor} month={month} onClose={() => setSlipFor(null)} />
    </>);

}

function Summary({ label, value, emphasis }: {label: string;value: string;emphasis?: boolean;}) {
  return (
    <div className="card px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={`tnum mt-1 font-semibold text-ink ${emphasis ? 'text-2xl' : 'text-lg'}`}>{value}</p>
    </div>);

}

function EditPayrollModal({
  row,
  month,
  onClose,
  onSaved





}: {row: PayrollRow | null;month: string;onClose: () => void;onSaved: () => void | Promise<void>;}) {
  const [form, setForm] = useState({ basic_salary: 0, allowances: 0, deductions: 0 });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (row)
    setForm({
      basic_salary: row.basic_salary,
      allowances: row.allowances,
      deductions: row.deductions
    });
  }, [row]);

  if (!row) return null;
  const net = form.basic_salary + form.allowances - form.deductions;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await payrollService.update(row.employee_id, { ...form, month });
      toast.success(`${row.name}'s payroll updated for ${prettyMonth(month)}.`);
      await onSaved();
    } catch (error) {
      setErrors(fieldErrors(error));
      toast.error(friendlyError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Salary structure · ${row.name}`}
      description={`${row.employee_id} · ${prettyMonth(month)} · the employee is notified and the change is audited.`}
      size="sm"
      footer={
      <>
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="edit-payroll" className="btn-primary" disabled={busy}>
            {busy ? <Spinner /> : null} Publish
          </button>
        </>
      }>
      
      <form id="edit-payroll" onSubmit={save} className="space-y-4">
        {(
        [
        ['basic_salary', 'Basic salary'],
        ['allowances', 'Allowances'],
        ['deductions', 'Deductions']] as
        const).
        map(([key, label]) =>
        <div key={key}>
            <label className="label" htmlFor={key}>
              {label}
            </label>
            <input
            id={key}
            type="number"
            min={0}
            step={100}
            className="input tnum"
            value={form[key]}
            onChange={(event) =>
            setForm((prev) => ({ ...prev, [key]: Number(event.target.value) }))
            } />
          
            {errors[key] ? <p className="mt-1 text-xs text-rose-600">{errors[key]}</p> : null}
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg bg-brandSoft px-3 py-2.5">
          <span className="text-sm font-semibold text-brand">Net payable</span>
          <span className="tnum text-lg font-semibold text-brand">{money(net)}</span>
        </div>
      </form>
    </Modal>);

}

function SlipModal({
  row,
  month,
  onClose




}: {row: PayrollRow | null;month: string;onClose: () => void;}) {
  const slip = useAsync(
    () => row ? payrollService.slip(row.employee_id, month) : Promise.resolve(null),
    [row?.employee_id, month]
  );
  if (!row) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Salary slip · ${row.name}`}
      size="lg"
      footer={
      <>
          <button type="button" className="btn-outline" onClick={onClose}>
            Close
          </button>
          <button
          type="button"
          className="btn-primary"
          onClick={() => printElement('admin-slip', `Payslip ${row.employee_id} ${month}`)}>
          
            <PrinterIcon className="h-4 w-4" /> Save as PDF
          </button>
        </>
      }>
      
      <div id="admin-slip">
        {slip.loading && !slip.data ?
        <SkeletonCard className="h-80" /> :
        slip.data ?
        <SalarySlipView slip={slip.data} /> :

        <ErrorState message={slip.error ?? 'No payslip available for this month.'} />
        }
      </div>
    </Modal>);

}