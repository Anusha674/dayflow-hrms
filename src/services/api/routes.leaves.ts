import { STORES, addTo, getAllFrom, getByIndex, getOne, putIn, tx } from '../db';
import type { Attendance, Employee, LeaveRequest, LeaveStatus, LeaveType } from '../../types';
import { addDays, dayCount, todayISO } from '../../utils/format';
import { validateDateRange } from '../../utils/validation';
import {
  ApiError,
  hrRecipients,
  now,
  notify,
  requireHR,
  route,
  str,
  writeAudit,
  enumField } from
'./core';
import type { RequestContext } from './core';

const TYPES = ['PAID', 'SICK', 'UNPAID'] as const;

async function createLeave(ctx: RequestContext, _p: string[], body: Record<string, unknown>) {
  const leave_type = enumField<LeaveType>(body, 'leave_type', TYPES, 'Leave type');
  const start_date = str(body, 'start_date');
  const end_date = str(body, 'end_date');
  const remarks = str(body, 'remarks');

  const fields: Record<string, string> = {};
  const rangeError = validateDateRange(start_date, end_date);
  if (rangeError) fields.start_date = rangeError;
  if (remarks.length < 5) fields.remarks = 'Add a short reason (at least 5 characters).';
  if (start_date && start_date < addDays(todayISO(), -30))
  fields.start_date = 'Back-dated requests beyond 30 days must be raised with HR directly.';
  if (Object.keys(fields).length)
  throw new ApiError(422, 'Please correct the highlighted fields.', fields);

  return tx(
    [STORES.leave_requests, STORES.users, STORES.notifications, STORES.audit_logs],
    'readwrite',
    async (t) => {
      const existing = await getAllFrom<LeaveRequest>(
        t,
        STORES.leave_requests,
        'employee_id',
        ctx.user.employee_id
      );
      const overlap = existing.find(
        (l) => l.status !== 'REJECTED' && l.start_date <= end_date && l.end_date >= start_date
      );
      if (overlap)
      throw new ApiError(
        409,
        `This overlaps an existing ${overlap.status.toLowerCase()} request (${overlap.start_date} → ${overlap.end_date}).`
      );

      const record: Omit<LeaveRequest, 'leave_id'> = {
        employee_id: ctx.user.employee_id,
        leave_type,
        start_date,
        end_date,
        remarks,
        status: 'PENDING',
        hr_comment: null,
        approved_by: null,
        created_at: now(),
        updated_at: now()
      };
      const id = (await addTo(t, STORES.leave_requests, record)) as number;

      await notify(t, {
        user_id: ctx.user.user_id,
        title: 'Leave request submitted',
        message: `Your ${leave_type.toLowerCase()} leave for ${start_date} → ${end_date} is pending approval.`
      });
      for (const hr of await hrRecipients(t)) {
        await notify(t, {
          user_id: hr.user_id,
          title: 'New leave request',
          message: `${ctx.employee?.name ?? ctx.user.employee_id} requested ${dayCount(
            start_date,
            end_date
          )} day(s) of ${leave_type.toLowerCase()} leave.`
        });
      }
      await writeAudit(t, {
        user_id: ctx.user.user_id,
        actor: ctx.user.email,
        action: 'LEAVE_SUBMITTED',
        entity: 'LEAVE_REQUESTS',
        entity_id: String(id)
      });
      return { ...record, leave_id: id };
    }
  );
}

async function myLeaves(ctx: RequestContext) {
  const rows = await tx([STORES.leave_requests], 'readonly', (t) =>
  getAllFrom<LeaveRequest>(t, STORES.leave_requests, 'employee_id', ctx.user.employee_id)
  );
  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

async function allLeaves(ctx: RequestContext, _p: string[], body: Record<string, unknown>) {
  requireHR(ctx);
  const status = str(body, 'status');
  return tx([STORES.leave_requests, STORES.employees], 'readonly', async (t) => {
    const rows = await getAllFrom<LeaveRequest>(t, STORES.leave_requests);
    const employees = await getAllFrom<Employee>(t, STORES.employees);
    const byId = new Map(employees.map((e) => [e.employee_id, e]));
    return rows.
    filter((r) => !status || r.status === status).
    sort((a, b) => b.created_at.localeCompare(a.created_at)).
    map((r) => ({
      ...r,
      name: byId.get(r.employee_id)?.name ?? r.employee_id,
      department: byId.get(r.employee_id)?.department ?? '—',
      days: dayCount(r.start_date, r.end_date)
    }));
  });
}

async function getLeave(ctx: RequestContext, params: string[]) {
  const leave = await tx([STORES.leave_requests], 'readonly', (t) =>
  getOne<LeaveRequest>(t, STORES.leave_requests, Number(params[0]))
  );
  if (!leave) throw new ApiError(404, 'Leave request not found.');
  if (ctx.role !== 'HR' && leave.employee_id !== ctx.user.employee_id)
  throw new ApiError(403, 'Forbidden — you can only view your own leave requests.');
  return leave;
}

/**
 * Approve / reject run as ONE transaction: leave row + attendance rows for the
 * covered dates + employee notification + audit log. Any failure rolls back all
 * four, so the system can never end up with an approved leave and no audit
 * trail (or vice versa).
 */
async function decide(
ctx: RequestContext,
params: string[],
body: Record<string, unknown>,
decision: Extract<LeaveStatus, 'APPROVED' | 'REJECTED'>)
{
  requireHR(ctx);
  const comment = str(body, 'hr_comment');
  if (decision === 'REJECTED' && comment.length < 3)
  throw new ApiError(422, 'A short reason is required when rejecting a request.', {
    hr_comment: 'Please explain the rejection.'
  });

  return tx(
    [
    STORES.leave_requests,
    STORES.attendance,
    STORES.employees,
    STORES.notifications,
    STORES.audit_logs],

    'readwrite',
    async (t) => {
      const leave = await getOne<LeaveRequest>(t, STORES.leave_requests, Number(params[0]));
      if (!leave) throw new ApiError(404, 'Leave request not found.');
      if (leave.status !== 'PENDING')
      throw new ApiError(409, `This request was already ${leave.status.toLowerCase()}.`);

      const updated: LeaveRequest = {
        ...leave,
        status: decision,
        hr_comment: comment || leave.hr_comment,
        approved_by: ctx.user.employee_id,
        updated_at: now()
      };
      await putIn(t, STORES.leave_requests, updated);

      if (decision === 'APPROVED') {
        const total = dayCount(leave.start_date, leave.end_date);
        for (let i = 0; i < total; i += 1) {
          const date = addDays(leave.start_date, i);
          const existing = await getByIndex<Attendance>(t, STORES.attendance, 'employee_date', [
          leave.employee_id,
          date]
          );
          const row: Attendance = {
            attendance_id: existing?.attendance_id ?? 0,
            employee_id: leave.employee_id,
            date,
            check_in: null,
            check_out: null,
            working_hours: 0,
            status: 'LEAVE',
            created_at: existing?.created_at ?? now(),
            updated_at: now()
          };
          if (existing) await putIn(t, STORES.attendance, row);else
          {
            const { attendance_id: _ignored, ...insert } = row;
            await addTo(t, STORES.attendance, insert);
          }
        }
      }

      const employee = await getOne<Employee>(t, STORES.employees, leave.employee_id);
      if (employee) {
        await notify(t, {
          user_id: employee.user_id,
          title: `Leave ${decision.toLowerCase()}`,
          message: `Your ${leave.leave_type.toLowerCase()} leave (${leave.start_date} → ${
          leave.end_date}) was ${
          decision.toLowerCase()} by HR.${comment ? ` Note: ${comment}` : ''}`
        });
      }
      await writeAudit(t, {
        user_id: ctx.user.user_id,
        actor: ctx.user.email,
        action: decision === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
        entity: 'LEAVE_REQUESTS',
        entity_id: String(leave.leave_id)
      });
      return updated;
    }
  );
}

async function comment(ctx: RequestContext, params: string[], body: Record<string, unknown>) {
  requireHR(ctx);
  const text = str(body, 'hr_comment');
  if (!text) throw new ApiError(422, 'Comment cannot be empty.', { hr_comment: 'Required.' });
  return tx(
    [STORES.leave_requests, STORES.employees, STORES.notifications, STORES.audit_logs],
    'readwrite',
    async (t) => {
      const leave = await getOne<LeaveRequest>(t, STORES.leave_requests, Number(params[0]));
      if (!leave) throw new ApiError(404, 'Leave request not found.');
      const updated = { ...leave, hr_comment: text, updated_at: now() };
      await putIn(t, STORES.leave_requests, updated);
      const employee = await getOne<Employee>(t, STORES.employees, leave.employee_id);
      if (employee)
      await notify(t, {
        user_id: employee.user_id,
        title: 'HR commented on your leave request',
        message: text
      });
      await writeAudit(t, {
        user_id: ctx.user.user_id,
        actor: ctx.user.email,
        action: 'LEAVE_COMMENTED',
        entity: 'LEAVE_REQUESTS',
        entity_id: String(leave.leave_id)
      });
      return updated;
    }
  );
}

export const leaveRoutes = [
route('POST', '/api/leaves', createLeave as never),
route('GET', '/api/leaves/me', myLeaves as never),
route('GET', '/api/leaves/all', allLeaves as never),
route('PUT', '/api/leaves/{id}/approve', ((c: RequestContext, p: string[], b: Record<string, unknown>) =>
decide(c, p, b, 'APPROVED')) as never),
route('PUT', '/api/leaves/{id}/reject', ((c: RequestContext, p: string[], b: Record<string, unknown>) =>
decide(c, p, b, 'REJECTED')) as never),
route('POST', '/api/leaves/{id}/comment', comment as never),
route('GET', '/api/leaves/{id}', getLeave as never)];