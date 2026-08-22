import { STORES, getAllFrom, getByIndex, getOne, putIn, tx } from '../db';
import type {
  AppNotification,
  Attendance,
  AuditLog,
  Employee,
  LeaveRequest,
  Payroll } from
'../../types';
import { addDays, dayCount, monthISO, todayISO } from '../../utils/format';
import { ApiError, now, requireHR, route, str } from './core';
import type { RequestContext } from './core';

/* ---------------------------------- notifications --------------------------------- */

async function listNotifications(ctx: RequestContext) {
  const rows = await tx([STORES.notifications], 'readonly', (t) =>
  getAllFrom<AppNotification>(t, STORES.notifications, 'user_id', ctx.user.user_id)
  );
  const items = rows.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 100);
  return { items, unread: items.filter((n) => !n.is_read).length };
}

async function markRead(ctx: RequestContext, params: string[]) {
  return tx([STORES.notifications], 'readwrite', async (t) => {
    const record = await getOne<AppNotification>(t, STORES.notifications, Number(params[0]));
    if (!record) throw new ApiError(404, 'Notification not found.');
    if (record.user_id !== ctx.user.user_id) throw new ApiError(403, 'Forbidden.');
    await putIn(t, STORES.notifications, { ...record, is_read: true });
    return { ...record, is_read: true };
  });
}

async function markAllRead(ctx: RequestContext) {
  return tx([STORES.notifications], 'readwrite', async (t) => {
    const rows = await getAllFrom<AppNotification>(t, STORES.notifications, 'user_id', ctx.user.user_id);
    for (const row of rows.filter((r) => !r.is_read)) {
      await putIn(t, STORES.notifications, { ...row, is_read: true });
    }
    return { updated: rows.filter((r) => !r.is_read).length };
  });
}

/* ------------------------------------ dashboards ----------------------------------- */

async function employeeDashboard(ctx: RequestContext) {
  const today = todayISO();
  return tx(
    [STORES.attendance, STORES.leave_requests, STORES.payroll, STORES.notifications, STORES.audit_logs],
    'readonly',
    async (t) => {
      const employeeId = ctx.user.employee_id;
      const attendance = await getAllFrom<Attendance>(t, STORES.attendance, 'employee_id', employeeId);
      const leaves = await getAllFrom<LeaveRequest>(t, STORES.leave_requests, 'employee_id', employeeId);
      const payroll = await getAllFrom<Payroll>(t, STORES.payroll, 'employee_id', employeeId);
      const notifications = await getAllFrom<AppNotification>(
        t,
        STORES.notifications,
        'user_id',
        ctx.user.user_id
      );
      const audits = (await getAllFrom<AuditLog>(t, STORES.audit_logs, 'user_id', ctx.user.user_id)).
      sort((a, b) => b.timestamp.localeCompare(a.timestamp)).
      slice(0, 6);

      const month = monthISO();
      const monthRows = attendance.filter((a) => a.date.startsWith(month));
      const presentDays = monthRows.filter((a) => a.status === 'PRESENT').length;
      const trackedDays = monthRows.filter((a) => a.status !== 'LEAVE').length;

      return {
        today: attendance.find((a) => a.date === today) ?? null,
        summary: {
          present: presentDays,
          half_day: monthRows.filter((a) => a.status === 'HALF_DAY').length,
          absent: monthRows.filter((a) => a.status === 'ABSENT').length,
          leave: monthRows.filter((a) => a.status === 'LEAVE').length,
          attendance_rate: trackedDays ? Math.round(presentDays / trackedDays * 100) : 0,
          hours_this_month:
          Math.round(monthRows.reduce((sum, a) => sum + a.working_hours, 0) * 10) / 10
        },
        leave_balance: {
          PAID: Math.max(
            0,
            18 -
            leaves.
            filter((l) => l.status === 'APPROVED' && l.leave_type === 'PAID').
            reduce((sum, l) => sum + dayCount(l.start_date, l.end_date), 0)
          ),
          SICK: Math.max(
            0,
            10 -
            leaves.
            filter((l) => l.status === 'APPROVED' && l.leave_type === 'SICK').
            reduce((sum, l) => sum + dayCount(l.start_date, l.end_date), 0)
          )
        },
        pending_leaves: leaves.filter((l) => l.status === 'PENDING').length,
        recent_leaves: leaves.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 4),
        latest_payroll: payroll.sort((a, b) => b.month.localeCompare(a.month))[0] ?? null,
        unread_notifications: notifications.filter((n) => !n.is_read).length,
        recent_activity: audits,
        last_14_days: Array.from({ length: 14 }, (_, i) => {
          const date = addDays(today, i - 13);
          const row = attendance.find((a) => a.date === date);
          return { date, hours: row?.working_hours ?? 0, status: row?.status ?? 'ABSENT' };
        }),
        generated_at: now()
      };
    }
  );
}

async function adminDashboard(ctx: RequestContext) {
  requireHR(ctx);
  const today = todayISO();
  return tx(
    [STORES.employees, STORES.attendance, STORES.leave_requests, STORES.payroll],
    'readonly',
    async (t) => {
      const employees = await getAllFrom<Employee>(t, STORES.employees);
      const attendance = await getAllFrom<Attendance>(t, STORES.attendance);
      const leaves = await getAllFrom<LeaveRequest>(t, STORES.leave_requests);
      const payroll = await getAllFrom<Payroll>(t, STORES.payroll);

      const todayRows = attendance.filter((a) => a.date === today);
      const present = todayRows.filter((a) => a.status === 'PRESENT').length;
      const halfDay = todayRows.filter((a) => a.status === 'HALF_DAY').length;
      const onLeave = todayRows.filter((a) => a.status === 'LEAVE').length;
      const month = monthISO();
      const monthPayroll = payroll.filter((p) => p.month === month);

      const departments = new Map<string, number>();
      employees.forEach((e) => departments.set(e.department, (departments.get(e.department) ?? 0) + 1));

      const trend = Array.from({ length: 14 }, (_, i) => {
        const date = addDays(today, i - 13);
        const rows = attendance.filter((a) => a.date === date);
        return {
          date,
          present: rows.filter((r) => r.status === 'PRESENT').length,
          absent: rows.filter((r) => r.status === 'ABSENT').length,
          leave: rows.filter((r) => r.status === 'LEAVE').length
        };
      });

      const leaveMonths = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        const key = monthISO(d);
        const rows = leaves.filter((l) => l.start_date.startsWith(key));
        return {
          month: key,
          PAID: rows.filter((l) => l.leave_type === 'PAID').length,
          SICK: rows.filter((l) => l.leave_type === 'SICK').length,
          UNPAID: rows.filter((l) => l.leave_type === 'UNPAID').length
        };
      });

      return {
        totals: {
          employees: employees.length,
          present,
          half_day: halfDay,
          on_leave: onLeave,
          absent: Math.max(0, employees.length - present - halfDay - onLeave),
          pending_leaves: leaves.filter((l) => l.status === 'PENDING').length,
          attendance_rate: employees.length ?
          Math.round((present + halfDay * 0.5) / employees.length * 100) :
          0,
          payroll_month: month,
          payroll_total: monthPayroll.reduce((sum, p) => sum + p.net_salary, 0),
          payroll_published: monthPayroll.length
        },
        departments: Array.from(departments, ([name, value]) => ({ name, value })).sort(
          (a, b) => b.value - a.value
        ),
        attendance_trend: trend,
        leave_trend: leaveMonths,
        leave_distribution: (['PAID', 'SICK', 'UNPAID'] as const).map((type) => ({
          name: type,
          value: leaves.filter((l) => l.leave_type === type).length
        })),
        status_distribution: (['PRESENT', 'HALF_DAY', 'LEAVE', 'ABSENT'] as const).map((status) => ({
          name: status,
          value: attendance.filter((a) => a.status === status).length
        })),
        pending_queue: leaves.
        filter((l) => l.status === 'PENDING').
        sort((a, b) => a.created_at.localeCompare(b.created_at)).
        slice(0, 6).
        map((l) => ({
          ...l,
          name: employees.find((e) => e.employee_id === l.employee_id)?.name ?? l.employee_id,
          days: dayCount(l.start_date, l.end_date)
        })),
        generated_at: now()
      };
    }
  );
}

/* ------------------------------------- reports ------------------------------------- */

async function attendanceReport(ctx: RequestContext, _p: string[], body: Record<string, unknown>) {
  requireHR(ctx);
  const from = str(body, 'from') || addDays(todayISO(), -30);
  const to = str(body, 'to') || todayISO();
  return tx([STORES.attendance, STORES.employees], 'readonly', async (t) => {
    const employees = await getAllFrom<Employee>(t, STORES.employees);
    const attendance = (await getAllFrom<Attendance>(t, STORES.attendance)).filter(
      (a) => a.date >= from && a.date <= to
    );
    return {
      range: { from, to },
      rows: employees.map((e) => {
        const rows = attendance.filter((a) => a.employee_id === e.employee_id);
        const present = rows.filter((r) => r.status === 'PRESENT').length;
        return {
          employee_id: e.employee_id,
          name: e.name,
          department: e.department,
          present,
          half_day: rows.filter((r) => r.status === 'HALF_DAY').length,
          leave: rows.filter((r) => r.status === 'LEAVE').length,
          absent: rows.filter((r) => r.status === 'ABSENT').length,
          total_hours: Math.round(rows.reduce((s, r) => s + r.working_hours, 0) * 10) / 10,
          attendance_rate: rows.length ? Math.round(present / rows.length * 100) : 0
        };
      })
    };
  });
}

async function leaveReport(ctx: RequestContext, _p: string[], body: Record<string, unknown>) {
  requireHR(ctx);
  const from = str(body, 'from');
  const to = str(body, 'to');
  return tx([STORES.leave_requests, STORES.employees], 'readonly', async (t) => {
    const employees = await getAllFrom<Employee>(t, STORES.employees);
    const byId = new Map(employees.map((e) => [e.employee_id, e]));
    const rows = (await getAllFrom<LeaveRequest>(t, STORES.leave_requests)).filter(
      (l) => (!from || l.start_date >= from) && (!to || l.end_date <= to)
    );
    return {
      rows: rows.
      sort((a, b) => b.start_date.localeCompare(a.start_date)).
      map((l) => ({
        leave_id: l.leave_id,
        employee_id: l.employee_id,
        name: byId.get(l.employee_id)?.name ?? l.employee_id,
        department: byId.get(l.employee_id)?.department ?? '—',
        leave_type: l.leave_type,
        start_date: l.start_date,
        end_date: l.end_date,
        days: dayCount(l.start_date, l.end_date),
        status: l.status,
        hr_comment: l.hr_comment ?? '',
        approved_by: l.approved_by ?? ''
      }))
    };
  });
}

async function payrollReport(ctx: RequestContext, _p: string[], body: Record<string, unknown>) {
  requireHR(ctx);
  const month = str(body, 'month') || monthISO();
  return tx([STORES.payroll, STORES.employees], 'readonly', async (t) => {
    const employees = await getAllFrom<Employee>(t, STORES.employees);
    const byId = new Map(employees.map((e) => [e.employee_id, e]));
    const rows = (await getAllFrom<Payroll>(t, STORES.payroll)).filter((p) => p.month === month);
    return {
      month,
      rows: rows.map((p) => ({
        ...p,
        name: byId.get(p.employee_id)?.name ?? p.employee_id,
        department: byId.get(p.employee_id)?.department ?? '—',
        designation: byId.get(p.employee_id)?.designation ?? '—'
      })),
      totals: {
        headcount: rows.length,
        basic: rows.reduce((s, p) => s + p.basic_salary, 0),
        allowances: rows.reduce((s, p) => s + p.allowances, 0),
        deductions: rows.reduce((s, p) => s + p.deductions, 0),
        net: rows.reduce((s, p) => s + p.net_salary, 0)
      }
    };
  });
}

async function employeeReport(ctx: RequestContext) {
  requireHR(ctx);
  return tx([STORES.employees, STORES.payroll], 'readonly', async (t) => {
    const employees = await getAllFrom<Employee>(t, STORES.employees);
    const month = monthISO();
    const rows = await Promise.all(
      employees.map(async (e) => {
        const payroll = await getByIndex<Payroll>(t, STORES.payroll, 'employee_month', [
        e.employee_id,
        month]
        );
        return {
          employee_id: e.employee_id,
          name: e.name,
          department: e.department,
          designation: e.designation,
          joining_date: e.joining_date,
          phone: e.phone,
          net_salary: payroll?.net_salary ?? 0
        };
      })
    );
    return { rows };
  });
}

export const insightRoutes = [
route('GET', '/api/notifications', listNotifications as never),
route('PUT', '/api/notifications/read-all', markAllRead as never),
route('PUT', '/api/notifications/{id}/read', markRead as never),
route('GET', '/api/dashboard/employee', employeeDashboard as never),
route('GET', '/api/dashboard/admin', adminDashboard as never),
route('GET', '/api/reports/attendance', attendanceReport as never),
route('GET', '/api/reports/leave', leaveReport as never),
route('GET', '/api/reports/payroll', payrollReport as never),
route('GET', '/api/reports/employees', employeeReport as never)];