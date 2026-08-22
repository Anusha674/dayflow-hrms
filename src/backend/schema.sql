-- Dayflow HRMS — authoritative MySQL schema.
-- Mirrors the SQLAlchemy models; kept in the repo so the database can be
-- provisioned or audited without running the application.

CREATE DATABASE IF NOT EXISTS dayflow_hrms
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dayflow_hrms;

CREATE TABLE IF NOT EXISTS users (
  user_id            INT AUTO_INCREMENT PRIMARY KEY,
  employee_id        VARCHAR(16)  NOT NULL,
  email              VARCHAR(190) NOT NULL,
  password_hash      VARCHAR(255) NOT NULL,
  role               ENUM('EMPLOYEE','HR') NOT NULL DEFAULT 'EMPLOYEE',
  is_verified        TINYINT(1)   NOT NULL DEFAULT 0,
  verification_code  VARCHAR(8)   NULL,
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_employee_id (employee_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employees (
  employee_id     VARCHAR(16)  PRIMARY KEY,
  user_id         INT          NOT NULL,
  name            VARCHAR(120) NOT NULL,
  phone           VARCHAR(24)  NOT NULL DEFAULT '',
  address         VARCHAR(255) NOT NULL DEFAULT '',
  department      VARCHAR(64)  NOT NULL,
  designation     VARCHAR(64)  NOT NULL,
  joining_date    DATE         NOT NULL,
  profile_picture VARCHAR(255) NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_employees_user (user_id),
  KEY ix_employees_department (department),
  CONSTRAINT fk_employees_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS attendance (
  attendance_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id   VARCHAR(16) NOT NULL,
  date          DATE        NOT NULL,
  check_in      DATETIME    NULL,
  check_out     DATETIME    NULL,
  working_hours FLOAT       NOT NULL DEFAULT 0,
  status        ENUM('PRESENT','ABSENT','HALF_DAY','LEAVE') NOT NULL DEFAULT 'ABSENT',
  source        VARCHAR(16) NOT NULL DEFAULT 'ONLINE',
  created_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_attendance_employee_date (employee_id, date),
  KEY ix_attendance_date (date),
  CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id)
    REFERENCES employees(employee_id) ON DELETE CASCADE,
  CONSTRAINT ck_attendance_hours CHECK (working_hours >= 0 AND working_hours <= 24),
  CONSTRAINT ck_attendance_order CHECK (check_out IS NULL OR check_in IS NULL OR check_out >= check_in)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS leave_requests (
  leave_id    INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(16)  NOT NULL,
  leave_type  ENUM('PAID','SICK','UNPAID') NOT NULL,
  start_date  DATE         NOT NULL,
  end_date    DATE         NOT NULL,
  remarks     VARCHAR(500) NOT NULL,
  status      ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  hr_comment  VARCHAR(500) NULL,
  approved_by VARCHAR(16)  NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_leave_status (status),
  KEY ix_leave_employee_range (employee_id, start_date, end_date),
  CONSTRAINT fk_leave_employee FOREIGN KEY (employee_id)
    REFERENCES employees(employee_id) ON DELETE CASCADE,
  CONSTRAINT ck_leave_date_order CHECK (end_date >= start_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payroll (
  payroll_id   INT AUTO_INCREMENT PRIMARY KEY,
  employee_id  VARCHAR(16)   NOT NULL,
  month        VARCHAR(7)    NOT NULL,
  basic_salary DECIMAL(12,2) NOT NULL,
  allowances   DECIMAL(12,2) NOT NULL DEFAULT 0,
  deductions   DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_salary   DECIMAL(12,2) NOT NULL,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payroll_employee_month (employee_id, month),
  KEY ix_payroll_month (month),
  CONSTRAINT fk_payroll_employee FOREIGN KEY (employee_id)
    REFERENCES employees(employee_id) ON DELETE CASCADE,
  CONSTRAINT ck_payroll_basic_positive CHECK (basic_salary > 0),
  CONSTRAINT ck_payroll_non_negative CHECK (allowances >= 0 AND deductions >= 0),
  CONSTRAINT ck_payroll_deductions CHECK (deductions <= basic_salary + allowances)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS documents (
  document_id   INT AUTO_INCREMENT PRIMARY KEY,
  employee_id   VARCHAR(16)  NOT NULL,
  document_name VARCHAR(160) NOT NULL,
  document_path VARCHAR(255) NOT NULL,
  uploaded_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_documents_employee (employee_id),
  CONSTRAINT fk_documents_employee FOREIGN KEY (employee_id)
    REFERENCES employees(employee_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT          NOT NULL,
  title           VARCHAR(120) NOT NULL,
  message         VARCHAR(500) NOT NULL,
  is_read         TINYINT(1)   NOT NULL DEFAULT 0,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_notifications_user (user_id, is_read),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  log_id     INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NOT NULL,
  actor      VARCHAR(190) NOT NULL,
  action     VARCHAR(64)  NOT NULL,
  entity     VARCHAR(32)  NOT NULL,
  entity_id  VARCHAR(64)  NOT NULL,
  ip_address VARCHAR(45)  NULL,
  timestamp  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_audit_user (user_id),
  KEY ix_audit_entity (entity, entity_id),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;
