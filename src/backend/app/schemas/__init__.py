"""Pydantic contracts. Backend validation never trusts the client."""
from datetime import date, datetime
from decimal import Decimal
import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.models.attendance import AttendanceStatus
from app.models.leave import LeaveStatus, LeaveType
from app.models.user import Role

EMPLOYEE_ID_RE = re.compile(r"^[A-Z]{3}\d{3,5}$")
PHONE_RE = re.compile(r"^[+]?[\d][\d\s-]{7,17}$")


def validate_password(value: str) -> str:
    problems = []
    if len(value) < 8:
        problems.append("at least 8 characters")
    if not re.search(r"[A-Z]", value):
        problems.append("one uppercase letter")
    if not re.search(r"[a-z]", value):
        problems.append("one lowercase letter")
    if not re.search(r"\d", value):
        problems.append("one number")
    if not re.search(r"[^A-Za-z0-9]", value):
        problems.append("one symbol")
    if problems:
        raise ValueError("Password needs: " + ", ".join(problems) + ".")
    return value


class RegisterIn(BaseModel):
    employee_id: str
    email: EmailStr
    password: str
    role: Role = Role.EMPLOYEE
    name: str = Field(min_length=2, max_length=120)
    phone: str = ""
    address: str = ""
    department: str = "Unassigned"
    designation: str = "New Joiner"
    joining_date: date | None = None

    @field_validator("employee_id")
    @classmethod
    def _employee_id(cls, value: str) -> str:
        value = value.strip().upper()
        if not EMPLOYEE_ID_RE.match(value):
            raise ValueError("Use the format EMP001 — three letters followed by 3–5 digits.")
        return value

    @field_validator("password")
    @classmethod
    def _password(cls, value: str) -> str:
        return validate_password(value)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class VerifyIn(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)


class ResendIn(BaseModel):
    email: EmailStr


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: int
    employee_id: str
    email: EmailStr
    role: Role
    is_verified: bool
    created_at: datetime


class EmployeeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    employee_id: str
    user_id: int
    name: str
    phone: str
    address: str
    department: str
    designation: str
    joining_date: date
    profile_picture: str | None
    created_at: datetime
    updated_at: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut
    employee: EmployeeOut | None


class EmployeeSelfUpdate(BaseModel):
    """The only fields an employee may change on their own record."""
    phone: str
    address: str = Field(min_length=3, max_length=255)
    profile_picture: str | None = None

    @field_validator("phone")
    @classmethod
    def _phone(cls, value: str) -> str:
        if not PHONE_RE.match(value.strip()):
            raise ValueError("Enter a valid phone number (8–18 digits).")
        return value.strip()


class EmployeeHRUpdate(EmployeeSelfUpdate):
    name: str = Field(min_length=2, max_length=120)
    department: str = Field(min_length=2, max_length=64)
    designation: str = Field(min_length=2, max_length=64)
    joining_date: date


class AttendanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    attendance_id: int
    employee_id: str
    date: date
    check_in: datetime | None
    check_out: datetime | None
    working_hours: float
    status: AttendanceStatus
    created_at: datetime
    updated_at: datetime


class PunchIn(BaseModel):
    """Offline replays carry the original client timestamp."""
    client_timestamp: datetime | None = None
    client_date: date | None = None


class AttendanceAdminUpdate(BaseModel):
    status: AttendanceStatus
    check_in: datetime | None = None
    check_out: datetime | None = None

    @model_validator(mode="after")
    def _order(self):
        if self.check_in and self.check_out and self.check_out < self.check_in:
            raise ValueError("Check-out cannot be before check-in.")
        return self


class LeaveCreate(BaseModel):
    leave_type: LeaveType
    start_date: date
    end_date: date
    remarks: str = Field(min_length=5, max_length=500)

    @model_validator(mode="after")
    def _range(self):
        if self.end_date < self.start_date:
            raise ValueError("End date cannot be before the start date.")
        if (self.end_date - self.start_date).days + 1 > 30:
            raise ValueError("A single request cannot exceed 30 days.")
        return self


class LeaveDecision(BaseModel):
    hr_comment: str = ""


class LeaveOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    leave_id: int
    employee_id: str
    leave_type: LeaveType
    start_date: date
    end_date: date
    remarks: str
    status: LeaveStatus
    hr_comment: str | None
    approved_by: str | None
    created_at: datetime
    updated_at: datetime


class PayrollUpsert(BaseModel):
    month: str = Field(pattern=r"^\d{4}-\d{2}$")
    basic_salary: Decimal = Field(gt=0, le=10_000_000)
    allowances: Decimal = Field(default=Decimal(0), ge=0, le=10_000_000)
    deductions: Decimal = Field(default=Decimal(0), ge=0, le=10_000_000)

    @model_validator(mode="after")
    def _deductions(self):
        if self.deductions > self.basic_salary + self.allowances:
            raise ValueError("Deductions cannot exceed gross pay.")
        return self


class PayrollOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    payroll_id: int
    employee_id: str
    month: str
    basic_salary: Decimal
    allowances: Decimal
    deductions: Decimal
    net_salary: Decimal
    created_at: datetime
    updated_at: datetime


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    notification_id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime


class AuditOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    log_id: int
    user_id: int
    actor: str
    action: str
    entity: str
    entity_id: str
    timestamp: datetime


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    document_id: int
    employee_id: str
    document_name: str
    document_path: str
    uploaded_at: datetime
