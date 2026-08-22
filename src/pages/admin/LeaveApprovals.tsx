import React, { useState } from 'react';
import { CheckIcon, MessageSquareIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/AppShell';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';
import { Spinner } from '../../components/Loading';
import { useAsync } from '../../hooks/useAsync';
import { leaveService } from '../../services/resources';
import type { LeaveWithEmployee } from '../../services/resources';
import { friendlyError } from '../../services/apiClient';
import { prettyDate, prettyDateTime, titleCase } from '../../utils/format';

type Decision = 'APPROVED' | 'REJECTED' | 'COMMENT';

const FILTERS = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const;

export function AdminLeaveApprovals() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('PENDING');
  const { data, loading, error, reload } = useAsync(
    () => leaveService.all(filter === 'ALL' ? undefined : filter),
    [filter]
  );
  const [target, setTarget] = useState<{leave: LeaveWithEmployee;decision: Decision;} | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const act = async () => {
    if (!target) return;
    setBusy(true);
    try {
      if (target.decision === 'APPROVED') await leaveService.approve(target.leave.leave_id, comment);else
      if (target.decision === 'REJECTED') await leaveService.reject(target.leave.leave_id, comment);else
      await leaveService.comment(target.leave.leave_id, comment);

      toast.success(
        target.decision === 'COMMENT' ?
        'Comment added and the employee has been notified.' :
        `Request ${target.decision.toLowerCase()} — attendance, notification and audit log updated together.`
      );
      setTarget(null);
      setComment('');
      await reload();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Leave approvals"
        description="Approving a request updates the leave record, the employee's attendance, their notifications and the audit log in one transaction." />
      

      <div role="tablist" aria-label="Leave filters" className="mb-4 inline-flex flex-wrap gap-1 rounded-lg border border-line bg-surface p-1">
        {FILTERS.map((option) =>
        <button
          key={option}
          role="tab"
          aria-selected={filter === option}
          type="button"
          onClick={() => setFilter(option)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ease-soft ${
          filter === option ? 'bg-brandSoft text-brand' : 'text-muted hover:text-ink'}`
          }>
          
            {titleCase(option)}
          </button>
        )}
      </div>

      <section className="card overflow-hidden">
        <DataTable<LeaveWithEmployee>
          rows={data ?? []}
          loading={loading}
          error={error}
          onRetry={reload}
          rowKey={(row) => row.leave_id}
          emptyTitle={filter === 'PENDING' ? 'No requests awaiting approval' : 'Nothing to show'}
          emptyDescription="Requests submitted by employees land here instantly."
          cardTitle={(row) => row.name}
          cardMeta={(row) => `${row.employee_id} · ${titleCase(row.leave_type)} · ${row.days} day(s)`}
          columns={[
          { key: 'name', header: 'Employee' },
          { key: 'employee_id', header: 'ID' },
          { key: 'leave_type', header: 'Type', render: (row) => titleCase(row.leave_type) },
          {
            key: 'range',
            header: 'Dates',
            render: (row) => `${prettyDate(row.start_date)} → ${prettyDate(row.end_date)}`
          },
          { key: 'days', header: 'Days', align: 'right' },
          { key: 'remarks', header: 'Reason' },
          { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          {
            key: 'created_at',
            header: 'Submitted',
            render: (row) => prettyDateTime(row.created_at),
            onCard: false
          }]
          }
          actions={(row) =>
          row.status === 'PENDING' ?
          <div className="flex flex-wrap justify-end gap-2">
                <button
              type="button"
              className="btn-primary btn-sm"
              onClick={() => {
                setComment('');
                setTarget({ leave: row, decision: 'APPROVED' });
              }}>
              
                  <CheckIcon className="h-3.5 w-3.5" /> Approve
                </button>
                <button
              type="button"
              className="btn-outline btn-sm"
              onClick={() => {
                setComment('');
                setTarget({ leave: row, decision: 'REJECTED' });
              }}>
              
                  <XIcon className="h-3.5 w-3.5" /> Reject
                </button>
              </div> :

          <button
            type="button"
            className="btn-outline btn-sm"
            onClick={() => {
              setComment(row.hr_comment ?? '');
              setTarget({ leave: row, decision: 'COMMENT' });
            }}>
            
                <MessageSquareIcon className="h-3.5 w-3.5" /> Comment
              </button>

          } />
        
      </section>

      <Modal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title={
        target?.decision === 'APPROVED' ?
        'Approve leave request' :
        target?.decision === 'REJECTED' ?
        'Reject leave request' :
        'Add HR comment'
        }
        description={
        target ?
        `${target.leave.name} · ${titleCase(target.leave.leave_type)} · ${prettyDate(
          target.leave.start_date
        )} → ${prettyDate(target.leave.end_date)}` :
        undefined
        }
        size="sm"
        footer={
        <>
            <button type="button" className="btn-outline" onClick={() => setTarget(null)}>
              Cancel
            </button>
            <button
            type="button"
            className={target?.decision === 'REJECTED' ? 'btn-danger' : 'btn-primary'}
            onClick={act}
            disabled={busy}>
            
              {busy ? <Spinner /> : null}
              {target?.decision === 'APPROVED' ?
            'Approve request' :
            target?.decision === 'REJECTED' ?
            'Reject request' :
            'Save comment'}
            </button>
          </>
        }>
        
        <p className="mb-3 rounded-lg bg-black/[0.03] px-3 py-2 text-sm text-muted dark:bg-white/[0.05]">
          “{target?.leave.remarks}”
        </p>
        <label className="label" htmlFor="hr-comment">
          HR comment {target?.decision === 'REJECTED' ? '(required)' : '(optional)'}
        </label>
        <textarea
          id="hr-comment"
          rows={3}
          className="input"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={
          target?.decision === 'REJECTED' ?
          'Explain why this cannot be approved.' :
          'Anything the employee should know.'
          } />
        
        {target?.decision === 'APPROVED' ?
        <p className="mt-3 text-xs text-muted">
            {target.leave.days} attendance day(s) will be marked as LEAVE for {target.leave.employee_id}.
          </p> :
        null}
      </Modal>
    </>);

}