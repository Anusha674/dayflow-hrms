import { STORES, addTo, getAllFrom, getByIndex, getOne, putIn, tx } from '../db';
import type { Attendance, AttendanceStatus, Employee, User } from '../../types';
import { addDays, todayISO } from '../../utils/format';
import {
  ApiError,
  assertSelfOrHR,
  enumField,
  now,
  notify,
  requireHR,
  route,
  str,
  writeAudit } from
'./core';
import type { RequestContext } from './core';

const STATUSES = ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'] as const;

export function deriveStatus(workedHours: number): AttendanceStatus {
  if (workedHours >= 6) return 'PRESENT';
  if (workedHours > 0) return 'HALF_DAY';
  return 'ABSENT';
}

function hoursBetween(checkIn: string, checkOut: string): number {
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.round(diff / 3_600_000 * 100) / 100;
}

async function checkIn(ctx: RequestContext, _p: string[], body: Record<string, unknown>) {
  if (ctx.role !== 'EMPLOYEE' && ctx.role !== 'HR')
  throw new ApiError(403, 'Forbidden.');
  const employeeId = ctx.user.employee_id;
  // Offline replays carry the original client timestamp so the record is truthful.
  const stamp = str(body, 'client_timestamp') || now();
  const date = str(body, 'client_date') || todayISO(new Date(stamp));
  if (date > todayISO()) throw new ApiError(422, 'Cannot check in for a future date.');

  return tx(
    [STORES.attendance, STORES.notifications, STORES.audit_logs, STORES.employees],
    'readwrite',
    async (t) => {
      const existing = await getByIndex<Attendance>(t, STORES.attendance, 'employee_date', [
      employeeId,
      date]
      );
      if (existing && existing.check_in)
      throw new ApiError(409, 'You have already checked in today.');

      const record: Omit<Attendance, 'attendance_id'> = {
        employee_id: employeeId,
        date,
        check_in: stamp,
        check_out: null,
        working_hours: 0,
        status: 'PRESENT',
        created_at: now(),
        updated_at: now()
      };
      let saved: Attendance;
      if (existing) {
        saved = { ...existing, ...record, attendance_id: existing.attendance_id };
        await putIn(t, STORES.attendance, saved);
      } else {
        const id = await addTo(t, STORES.attendance, record);
        saved = { ...record, attendance_id: id as number };
      }
      await notify(t, {
        user_id: ctx.user.user_id,
        title: 'Checked in',
        message: `Attendance recorded for ${date}.`
      });
      await writeAudit(t, {
        user_id: ctx.user.user_id,
        actor: ctx.user.email,
        action: 'ATTENDANCE_CHECK_IN',
        entity: 'ATTENDANCE',
        entity_id: `${employeeId}:${date}`
      });
      return saved;
    }
  );
}

async function checkOut(ctx: RequestContext, _p: string[], body: Record<string, unknown>) {
  const employeeId = ctx.user.employee_id;
  const stamp = str(body, 'client_timestamp') || now();
  const date = str(body, 'client_date') || todayISO(new Date(stamp));

  return tx([STORES.attendance, STORES.audit_logs], 'readwrite', async (t) => {
    const existing = await getByIndex<Attendance>(t, STORES.attendance, 'employee_date', [
    employeeId,
    date]
    );
    if (!existing || !existing.check_in)
    throw new ApiError(409, 'You need to check in before checking out.');
    if (existing.check_out) throw new ApiError(409, 'You have already checked out today.');
    if (new Date(stamp).getTime() < new Date(existing.check_in).getTime())
    throw new ApiError(422, 'Check-out time cannot be earlier than check-in time.');

    const working_hours = hoursBetween(existing.check_in, stamp);
    const updated: Attendance = {
      ...existing,
      check_out: stamp,
      working_hours,
      status: deriveStatus(working_hours),
      updated_at: now()
    };
    await putIn(t, STORES.attendance, updated);
    await writeAudit(t, {
      user_id: ctx.user.user_id,
      actor: ctx.user.email,
      action: 'ATTENDANCE_CHECK_OUT',
      entity: 'ATTENDANCE',
      entity_id: `${employeeId}:${date}`
    });
    return updated;
  });
}

async function myAttendance(ctx: RequestContext, _p: string[], body: Record<string, unknown>) {
  const from = str(body, 'from');
  const to = str(body, 'to');
  const rows = await tx([STORES.attendance], 'readonly', (t) =>
  getAllFrom<Attendance>(t, STORES.attendance, 'employee_id', ctx.user.employee_id)
  );
  return rows.
  filter((r) => (!from || r.date >= from) && (!to || r.date <= to)).
  sort((a, b) => b.date.localeCompare(a.date));
}

async function myDaily(ctx: RequestContext, _p: string[], body: Record<string, unknown>) {
  const date = str(body, 'date') || todayISO();
  const record = await tx([STORES.attendance], 'readonly', (t) =>
  getByIndex<Attendance>(t, STORES.attendance, 'employee_date', [ctx.user.employee_id, date])
  );
  return { date, record: record ?? null };
}

async function myWeekly(ctx: RequestContext, _p: string[], body: Record<string, unknown>) {
  const anchor = str(body, 'week_of') || todayISO();
  const weekday = new Date(`${anchor}T00:00:00`).getDay();
  const monday = addDays(anchor, weekday === 0 ? -6 : 1 - weekday);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const rows = await tx([STORES.attendance], 'readonly', (t) =>
  getAllFrom<Attendance>(t, STORES.attendance, 'employee_id', ctx.user.employee_id)
  );
  const byDate = new Map(rows.map((r) => [r.date, r]));
  return {
    week_start: monday,
    week_end: days[6],
    days: days.map((date) => ({ date, record: byDate.get(date) ?? null })),
    total_hours:
    Math.round(days.reduce((sum, d) => sum + (byDate.get(d)?.working_hours ?? 0), 0) * 100) / 100
  };
}

async function allAttendance(ctx: RequestContext, _p: string[], body: Record<string, unknown>) {
  requireHR(ctx);
  const date = str(body, 'date');
  const employeeId = str(body, 'employee_id');
  return tx([STORES.attendance, STORES.employees], 'readonly', async (t) => {
    const rows = await getAllFrom<Attendance>(t, STORES.attendance);
    const employees = await getAllFrom<Employee>(t, STORES.employees);
    const names = new Map(employees.map((e) => [e.employee_id, e]));
    return rows.
    filter((r) => (!date || r.date === date) && (!employeeId || r.employee_id === employeeId)).
    sort((a, b) => b.date.localeCompare(a.date) || a.employee_id.localeCompare(b.employee_id)).
    slice(0, 500).
    map((r) => ({
      ...r,
      name: names.get(r.employee_id)?.name ?? r.employee_id,
      department: names.get(r.employee_id)?.department ?? '—'
    }));
  });
}

async function updateAttendance(ctx: RequestContext, params: string[], body: Record<string, unknown>) {
  requireHR(ctx);
  const status = enumField(body, 'status', STATUSES, 'Status');
  return tx(
    [STORES.attendance, STORES.employees, STORES.notifications, STORES.audit_logs, STORES.users],
    'readwrite',
    async (t) => {
      const record = await getOne<Attendance>(t, STORES.attendance, Number(params[0]));
      if (!record) throw new ApiError(404, 'Attendance record not found.');
      const checkIn = str(body, 'check_in') || record.check_in;
      const checkOut = str(body, 'check_out') || null;
      if (checkIn && checkOut && new Date(checkOut) < new Date(checkIn))
      throw new ApiError(422, 'Check-out cannot be before check-in.');
      const working_hours = checkIn && checkOut ? hoursBetween(checkIn, checkOut) : record.working_hours;
      const updated: Attendance = {
        ...record,
        check_in: checkIn,
        check_out: checkOut,
        working_hours: status === 'ABSENT' || status === 'LEAVE' ? 0 : working_hours,
        status,
        updated_at: now()
      };
      await putIn(t, STORES.attendance, updated);
      const employee = await getOne<Employee>(t, STORES.employees, record.employee_id);
      if (employee) {
        await notify(t, {
          user_id: employee.user_id,
          title: 'Attendance amended',
          message: `HR updated your ${record.date} attendance to ${status.replace('_', ' ')}.`
        });
      }
      await writeAudit(t, {
        user_id: ctx.user.user_id,
        actor: ctx.user.email,
        action: 'ATTENDANCE_MODIFIED',
        entity: 'ATTENDANCE',
        entity_id: `${record.employee_id}:${record.date}`
      });
      return updated;
    }
  );
}

async function employeeAttendance(ctx: RequestContext, params: string[]) {
  assertSelfOrHR(ctx, params[0]);
  const rows = await tx([STORES.attendance], 'readonly', (t) =>
  getAllFrom<Attendance>(t, STORES.attendance, 'employee_id', params[0])
  );
  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

export const attendanceRoutes = [
route('POST', '/api/attendance/check-in', checkIn as never),
route('POST', '/api/attendance/check-out', checkOut as never),
route('GET', '/api/attendance/me/daily', myDaily as never),
route('GET', '/api/attendance/me/weekly', myWeekly as never),
route('GET', '/api/attendance/me', myAttendance as never),
route('GET', '/api/attendance/all', allAttendance as never),
route('GET', '/api/attendance/employee/{id}', employeeAttendance as never),
route('PUT', '/api/attendance/{id}', updateAttendance as never)];


export type { User };