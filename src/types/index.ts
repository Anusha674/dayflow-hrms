export type Role = 'EMPLOYEE' | 'HR';

export interface User {
  user_id: number;
  employee_id: string;
  email: string;
  password_hash: string;
  role: Role;
  is_verified: boolean;
  verification_code: string;
  created_at: string;
  updated_at: string;
}

/** Safe projection of a user — never exposes password_hash or verification_code. */
export interface PublicUser {
  user_id: number;
  employee_id: string;
  email: string;
  role: Role;
  is_verified: boolean;
  created_at: string;
}

export interface Employee {
  employee_id: string;
  user_id: number;
  name: string;
  phone: string;
  address: string;
  department: string;
  designation: string;
  joining_date: string;
  profile_picture: string | null;
  created_at: string;
  updated_at: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';

export interface Attendance {
  attendance_id: number;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  working_hours: number;
  status: AttendanceStatus;
  created_at: string;
  updated_at: string;
}

export type LeaveType = 'PAID' | 'SICK' | 'UNPAID';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequest {
  leave_id: number;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  remarks: string;
  status: LeaveStatus;
  hr_comment: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payroll {
  payroll_id: number;
  employee_id: string;
  month: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentRecord {
  document_id: number;
  employee_id: string;
  document_name: string;
  document_path: string;
  uploaded_at: string;
}

export interface AppNotification {
  notification_id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  log_id: number;
  user_id: number;
  actor: string;
  action: string;
  entity: string;
  entity_id: string;
  timestamp: string;
}

export type OutboxStatus = 'PENDING' | 'SYNCING' | 'FAILED';

export interface OutboxItem {
  id: number;
  method: string;
  path: string;
  body: unknown;
  label: string;
  token: string | null;
  status: OutboxStatus;
  attempts: number;
  error: string | null;
  created_at: string;
}

export type SyncState = 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface EmployeeWithUser extends Employee {
  email: string;
  role: Role;
  is_verified: boolean;
}