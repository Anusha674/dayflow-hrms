/**
 * Typed resource clients — one function per documented endpoint.
 * Pages never build paths by hand.
 */
import { api } from './apiClient';
import type {
  AppNotification,
  Attendance,
  AuditLog,
  DocumentRecord,
  Employee,
  EmployeeWithUser,
  LeaveRequest,
  Payroll,
  PublicUser } from
'../types';

/* --------------------------------- auth --------------------------------- */

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: PublicUser;
  employee: Employee | null;
}

export const authService = {
  register: (body: Record<string, unknown>) =>
  api.post<{message: string;email: string;verification_code: string;}>(
    '/api/auth/register',
    body
  ),
  login: (email: string, password: string) =>
  api.post<LoginResponse>('/api/auth/login', { email, password }),
  verifyEmail: (email: string, code: string) =>
  api.post<{message: string;}>('/api/auth/verify-email', { email, code }),
  resend: (email: string) =>
  api.post<{message: string;verification_code: string;}>('/api/auth/resend-verification', {
    email
  }),
  me: () => api.get<{user: PublicUser;employee: Employee | null;}>('/api/auth/me'),
  auditLogs: (limit = 200) => api.get<AuditLog[]>('/api/audit-logs', { limit })
};

/* ------------------------------- employees ------------------------------- */

export const employeeService = {
  me: () => api.get<Employee>('/api/employees/me'),
  updateMe: (body: Record<string, unknown>) => api.put<Employee>('/api/employees/me', body),
  list: () => api.get<EmployeeWithUser[]>('/api/employees'),
  get: (id: string) => api.get<EmployeeWithUser>(`/api/employees/${id}`),
  update: (id: string, body: Record<string, unknown>) =>
  api.put<Employee>(`/api/employees/${id}`, body),
  documents: (id: string) => api.get<DocumentRecord[]>(`/api/employees/${id}/documents`),
  addDocument: (id: string, body: Record<string, unknown>) =>
  api.post<DocumentRecord>(`/api/employees/${id}/documents`, body)
};

/* ------------------------------- attendance ------------------------------ */

export const attendanceService = {
  checkIn: () =>
  api.post<Attendance>('/api/attendance/check-in', {}, { offline: true, label: 'Check-in' }),
  checkOut: () =>
  api.post<Attendance>('/api/attendance/check-out', {}, { offline: true, label: 'Check-out' }),
  mine: (params?: {from?: string;to?: string;}) => api.get<Attendance[]>('/api/attendance/me', params),
  daily: (date?: string) =>
  api.get<{date: string;record: Attendance | null;}>('/api/attendance/me/daily', { date }),
  weekly: (weekOf?: string) =>
  api.get<{
    week_start: string;
    week_end: string;
    total_hours: number;
    days: {date: string;record: Attendance | null;}[];
  }>('/api/attendance/me/weekly', { week_of: weekOf }),
  all: (params?: {date?: string;employee_id?: string;}) =>
  api.get<(Attendance & {name: string;department: string;})[]>('/api/attendance/all', params),
  forEmployee: (id: string) => api.get<Attendance[]>(`/api/attendance/employee/${id}`),
  update: (id: number, body: Record<string, unknown>) =>
  api.put<Attendance>(`/api/attendance/${id}`, body)
};

/* --------------------------------- leaves -------------------------------- */

export type LeaveWithEmployee = LeaveRequest & {name: string;department: string;days: number;};

export const leaveService = {
  create: (body: Record<string, unknown>) =>
  api.post<LeaveRequest>('/api/leaves', body, { offline: true, label: 'Leave request' }),
  mine: () => api.get<LeaveRequest[]>('/api/leaves/me'),
  all: (status?: string) => api.get<LeaveWithEmployee[]>('/api/leaves/all', { status }),
  get: (id: number) => api.get<LeaveRequest>(`/api/leaves/${id}`),
  approve: (id: number, hr_comment: string) =>
  api.put<LeaveRequest>(`/api/leaves/${id}/approve`, { hr_comment }),
  reject: (id: number, hr_comment: string) =>
  api.put<LeaveRequest>(`/api/leaves/${id}/reject`, { hr_comment }),
  comment: (id: number, hr_comment: string) =>
  api.post<LeaveRequest>(`/api/leaves/${id}/comment`, { hr_comment })
};

/* -------------------------------- payroll -------------------------------- */

export type PayrollRow = Payroll & {name: string;department: string;designation: string;};

export interface SalarySlip {
  employee: Employee;
  payroll: Payroll;
  attendance_summary: {present: number;half_day: number;leave: number;absent: number;};
  generated_at: string;
}

export const payrollService = {
  mine: () => api.get<Payroll[]>('/api/payroll/me'),
  mySlip: (month: string) => api.get<SalarySlip>('/api/payroll/me/slip', { month }),
  all: (month?: string) => api.get<PayrollRow[]>('/api/payroll/all', { month }),
  forEmployee: (id: string) => api.get<Payroll[]>(`/api/payroll/${id}`),
  slip: (id: string, month: string) => api.get<SalarySlip>(`/api/payroll/${id}/slip`, { month }),
  update: (id: string, body: Record<string, unknown>) =>
  api.put<Payroll>(`/api/payroll/${id}`, body)
};

/* ----------------------------- notifications ----------------------------- */

export const notificationService = {
  list: () => api.get<{items: AppNotification[];unread: number;}>('/api/notifications'),
  markRead: (id: number) => api.put<AppNotification>(`/api/notifications/${id}/read`),
  markAllRead: () => api.put<{updated: number;}>('/api/notifications/read-all')
};

/* ------------------------- dashboards and reports ------------------------ */

export interface EmployeeDashboard {
  today: Attendance | null;
  summary: {
    present: number;
    half_day: number;
    absent: number;
    leave: number;
    attendance_rate: number;
    hours_this_month: number;
  };
  leave_balance: {PAID: number;SICK: number;};
  pending_leaves: number;
  recent_leaves: LeaveRequest[];
  latest_payroll: Payroll | null;
  unread_notifications: number;
  recent_activity: AuditLog[];
  last_14_days: {date: string;hours: number;status: string;}[];
  generated_at: string;
}

export interface AdminDashboard {
  totals: {
    employees: number;
    present: number;
    half_day: number;
    on_leave: number;
    absent: number;
    pending_leaves: number;
    attendance_rate: number;
    payroll_month: string;
    payroll_total: number;
    payroll_published: number;
  };
  departments: {name: string;value: number;}[];
  attendance_trend: {date: string;present: number;absent: number;leave: number;}[];
  leave_trend: {month: string;PAID: number;SICK: number;UNPAID: number;}[];
  leave_distribution: {name: string;value: number;}[];
  status_distribution: {name: string;value: number;}[];
  pending_queue: (LeaveRequest & {name: string;days: number;})[];
  generated_at: string;
}

export const dashboardService = {
  employee: () => api.get<EmployeeDashboard>('/api/dashboard/employee'),
  admin: () => api.get<AdminDashboard>('/api/dashboard/admin')
};

export const reportService = {
  attendance: (from?: string, to?: string) =>
  api.get<{
    range: {from: string;to: string;};
    rows: {
      employee_id: string;
      name: string;
      department: string;
      present: number;
      half_day: number;
      leave: number;
      absent: number;
      total_hours: number;
      attendance_rate: number;
    }[];
  }>('/api/reports/attendance', { from, to }),
  leave: (from?: string, to?: string) =>
  api.get<{rows: Record<string, string | number>[];}>('/api/reports/leave', { from, to }),
  payroll: (month?: string) =>
  api.get<{
    month: string;
    rows: PayrollRow[];
    totals: {headcount: number;basic: number;allowances: number;deductions: number;net: number;};
  }>('/api/reports/payroll', { month }),
  employees: () => api.get<{rows: Record<string, string | number>[];}>('/api/reports/employees')
};