import React, { useState } from 'react';
import { PlusIcon, SendIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/AppShell';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';
import { Spinner } from '../../components/Loading';
import { useAsync } from '../../hooks/useAsync';
import { leaveService } from '../../services/resources';
import { fieldErrors, friendlyError, OfflineQueuedError } from '../../services/apiClient';
import { dayCount, prettyDate, prettyDateTime, titleCase, todayISO } from '../../utils/format';
import { validateDateRange } from '../../utils/validation';
import type { LeaveRequest, LeaveType } from '../../types';

const TYPES: {value: LeaveType;label: string;hint: string;}[] = [
{ value: 'PAID', label: 'Paid', hint: 'Deducted from your 18-day annual balance' },
{ value: 'SICK', label: 'Sick', hint: 'Medical leave, 10 days per year' },
{ value: 'UNPAID', label: 'Unpaid', hint: 'No salary for the days taken' }];


export function EmployeeLeave() {
  const { data, loading, error, reload } = useAsync(() => leaveService.mine(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    leave_type: 'PAID' as LeaveType,
    start_date: todayISO(),
    end_date: todayISO(),
    remarks: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    const rangeError = validateDateRange(form.start_date, form.end_date);
    if (rangeError) next.start_date = rangeError;
    if (form.remarks.trim().length < 5) next.remarks = 'Add a short reason (at least 5 characters).';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await leaveService.create(form);
      toast.success('Leave request submitted — HR has been notified.');
      setOpen(false);
      setForm({ ...form, remarks: '' });
      await reload();
    } catch (err) {
      if (err instanceof OfflineQueuedError) {
        toast.warning(err.message);
        setOpen(false);
      } else {
        setErrors(fieldErrors(err));
        toast.error(friendlyError(err));
      }
    } finally {
      setBusy(false);
    }
  };

  const pending = (data ?? []).filter((leave) => leave.status === 'PENDING').length;

  return (
    <>
      <PageHeader
        title="Leave"
        description={
        pending ?
        `${pending} request(s) currently awaiting an HR decision.` :
        'Apply for leave and track every decision here.'
        }
        actions={
        <button type="button" className="btn-primary btn-sm" onClick={() => setOpen(true)}>
            <PlusIcon className="h-4 w-4" /> New request
          </button>
        } />
      

      <section className="card overflow-hidden">
        <DataTable<LeaveRequest>
          rows={data ?? []}
          loading={loading}
          error={error}
          onRetry={reload}
          rowKey={(row) => row.leave_id}
          emptyTitle="No leave requests yet"
          emptyDescription="When you apply for leave, its status and HR's comments will show up here."
          cardTitle={(row) => `${titleCase(row.leave_type)} leave`}
          cardMeta={(row) => `${prettyDate(row.start_date)} → ${prettyDate(row.end_date)}`}
          columns={[
          { key: 'leave_type', header: 'Type', render: (row) => titleCase(row.leave_type) },
          {
            key: 'range',
            header: 'Dates',
            render: (row) => `${prettyDate(row.start_date)} → ${prettyDate(row.end_date)}`
          },
          {
            key: 'days',
            header: 'Days',
            align: 'right',
            render: (row) => dayCount(row.start_date, row.end_date)
          },
          { key: 'remarks', header: 'Reason' },
          { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          {
            key: 'hr_comment',
            header: 'HR comment',
            render: (row) => row.hr_comment ?? '—'
          },
          {
            key: 'updated_at',
            header: 'Last update',
            render: (row) => prettyDateTime(row.updated_at),
            onCard: false
          }]
          } />
        
      </section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Apply for leave"
        description="Requests start as pending and notify HR immediately."
        footer={
        <>
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="leave-form" className="btn-primary" disabled={busy}>
              {busy ? <Spinner /> : <SendIcon className="h-4 w-4" />} Submit request
            </button>
          </>
        }>
        
        <form id="leave-form" onSubmit={submit} className="space-y-4" noValidate>
          <fieldset>
            <legend className="label">Leave type</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {TYPES.map((type) =>
              <label
                key={type.value}
                className={`cursor-pointer rounded-xl border p-3 transition-colors duration-150 ease-soft ${
                form.leave_type === type.value ?
                'border-brand bg-brandSoft' :
                'border-line hover:border-brand/50'}`
                }>
                
                  <input
                  type="radio"
                  name="leave_type"
                  className="sr-only"
                  value={type.value}
                  checked={form.leave_type === type.value}
                  onChange={() => setForm((prev) => ({ ...prev, leave_type: type.value }))} />
                
                  <span className="block text-sm font-semibold text-ink">{type.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">{type.hint}</span>
                </label>
              )}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="start_date">
                Start date
              </label>
              <input
                id="start_date"
                type="date"
                className="input"
                value={form.start_date}
                onChange={(event) => setForm((prev) => ({ ...prev, start_date: event.target.value }))}
                required />
              
            </div>
            <div>
              <label className="label" htmlFor="end_date">
                End date
              </label>
              <input
                id="end_date"
                type="date"
                className="input"
                value={form.end_date}
                min={form.start_date}
                onChange={(event) => setForm((prev) => ({ ...prev, end_date: event.target.value }))}
                required />
              
            </div>
          </div>
          {errors.start_date ? <p className="text-xs text-rose-600">{errors.start_date}</p> : null}

          <p className="rounded-lg bg-brandSoft px-3 py-2 text-xs text-brand">
            Duration: {dayCount(form.start_date, form.end_date)} day(s)
          </p>

          <div>
            <label className="label" htmlFor="remarks">
              Reason
            </label>
            <textarea
              id="remarks"
              rows={3}
              className="input"
              value={form.remarks}
              onChange={(event) => setForm((prev) => ({ ...prev, remarks: event.target.value }))}
              placeholder="Give HR the context they need to decide."
              required />
            
            {errors.remarks ? <p className="mt-1 text-xs text-rose-600">{errors.remarks}</p> : null}
          </div>
        </form>
      </Modal>
    </>);

}