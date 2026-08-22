import { STORES, addTo, getAllFrom, getByIndex, getOne, putIn, tx } from '../db';
import type { Attendance, Employee, Payroll } from '../../types';
import { monthISO } from '../../utils/format';
import { validateAmount } from '../../utils/validation';
import {
  ApiError,
  assertSelfOrHR,
  now,
  notify,
  num,
  requireHR,
  route,
  str,
  writeAudit } from
'./core';
import type { RequestContext } from './core';

async function myPayroll(ctx: RequestContext) {
  const rows = await tx([STORES.payroll], 'readonly', (t) =>
  getAllFrom<Payroll>(t, STORES.payroll, 'employee_id', ctx.user.employee_id)
  );
  return rows.sort((a, b) => b.month.localeCompare(a.month));
}

async function slip(ctx: RequestContext, params: string[], body: Record<string, unknown>) {
  const employeeId = params[0] ?? ctx.user.employee_id;
  assertSelfOrHR(ctx, employeeId);
  const month = str(body, 'month') || monthISO();
  return tx([STORES.payroll, STORES.employees, STORES.attendance], 'readonly', async (t) => {
    const employee = await getOne<Employee>(t, STORES.employees, employeeId);
    if (!employee) throw new ApiError(404, 'Employee not found.');
    const record = await getByIndex<Payroll>(t, STORES.payroll, 'employee_month', [
    employeeId,
    month]
    );
    if (!record) throw new ApiError(404, `No payroll has been published for ${month}.`);
    const attendance = (
    await getAllFrom<Attendance>(t, STORES.attendance, 'employee_id', employeeId)).
    filter((a) => a.date.startsWith(month));
    return {
      employee,
      payroll: record,
      attendance_summary: {
        present: attendance.filter((a) => a.status === 'PRESENT').length,
        half_day: attendance.filter((a) => a.status === 'HALF_DAY').length,
        leave: attendance.filter((a) => a.status === 'LEAVE').length,
        absent: attendance.filter((a) => a.status === 'ABSENT').length
      },
      generated_at: now()
    };
  });
}

async function allPayroll(ctx: RequestContext, _p: string[], body: Record<string, unknown>) {
  requireHR(ctx);
  const month = str(body, 'month');
  return tx([STORES.payroll, STORES.employees], 'readonly', async (t) => {
    const rows = await getAllFrom<Payroll>(t, STORES.payroll);
    const employees = await getAllFrom<Employee>(t, STORES.employees);
    const byId = new Map(employees.map((e) => [e.employee_id, e]));
    return rows.
    filter((r) => !month || r.month === month).
    sort((a, b) => b.month.localeCompare(a.month) || a.employee_id.localeCompare(b.employee_id)).
    map((r) => ({
      ...r,
      name: byId.get(r.employee_id)?.name ?? r.employee_id,
      department: byId.get(r.employee_id)?.department ?? '—',
      designation: byId.get(r.employee_id)?.designation ?? '—'
    }));
  });
}

async function employeePayroll(ctx: RequestContext, params: string[]) {
  assertSelfOrHR(ctx, params[0]);
  const rows = await tx([STORES.payroll], 'readonly', (t) =>
  getAllFrom<Payroll>(t, STORES.payroll, 'employee_id', params[0])
  );
  return rows.sort((a, b) => b.month.localeCompare(a.month));
}

/** HR-only. net_salary is always recomputed server-side, never taken from the client. */
async function upsertPayroll(ctx: RequestContext, params: string[], body: Record<string, unknown>) {
  requireHR(ctx);
  const employeeId = params[0];
  const month = str(body, 'month');
  const basic_salary = num(body, 'basic_salary');
  const allowances = num(body, 'allowances') || 0;
  const deductions = num(body, 'deductions') || 0;

  const fields: Record<string, string> = {};
  if (!/^\d{4}-\d{2}$/.test(month)) fields.month = 'Select a valid payroll month.';
  const basicError = validateAmount(basic_salary, 'Basic salary');
  if (basicError) fields.basic_salary = basicError;
  if (basic_salary <= 0) fields.basic_salary = 'Basic salary must be greater than zero.';
  const allowanceError = validateAmount(allowances, 'Allowances');
  if (allowanceError) fields.allowances = allowanceError;
  const deductionError = validateAmount(deductions, 'Deductions');
  if (deductionError) fields.deductions = deductionError;
  if (deductions > basic_salary + allowances)
  fields.deductions = 'Deductions cannot exceed gross pay.';
  if (Object.keys(fields).length)
  throw new ApiError(422, 'Please correct the highlighted fields.', fields);

  return tx(
    [STORES.payroll, STORES.employees, STORES.notifications, STORES.audit_logs],
    'readwrite',
    async (t) => {
      const employee = await getOne<Employee>(t, STORES.employees, employeeId);
      if (!employee) throw new ApiError(404, 'Employee not found.');
      const existing = await getByIndex<Payroll>(t, STORES.payroll, 'employee_month', [
      employeeId,
      month]
      );
      const net_salary = Math.round((basic_salary + allowances - deductions) * 100) / 100;
      const record: Payroll = {
        payroll_id: existing?.payroll_id ?? 0,
        employee_id: employeeId,
        month,
        basic_salary,
        allowances,
        deductions,
        net_salary,
        created_at: existing?.created_at ?? now(),
        updated_at: now()
      };
      let saved = record;
      if (existing) {
        await putIn(t, STORES.payroll, record);
      } else {
        const { payroll_id: _ignored, ...insert } = record;
        const id = await addTo(t, STORES.payroll, insert);
        saved = { ...record, payroll_id: id as number };
      }
      await notify(t, {
        user_id: employee.user_id,
        title: 'Payroll updated',
        message: `Your salary structure for ${month} was updated by HR.`
      });
      await writeAudit(t, {
        user_id: ctx.user.user_id,
        actor: ctx.user.email,
        action: 'PAYROLL_UPDATED',
        entity: 'PAYROLL',
        entity_id: `${employeeId}:${month}`
      });
      return saved;
    }
  );
}

export const payrollRoutes = [
route('GET', '/api/payroll/me/slip', slip as never),
route('GET', '/api/payroll/me', myPayroll as never),
route('GET', '/api/payroll/all', allPayroll as never),
route('GET', '/api/payroll/{id}/slip', slip as never),
route('GET', '/api/payroll/{id}', employeePayroll as never),
route('PUT', '/api/payroll/{id}', upsertPayroll as never)];