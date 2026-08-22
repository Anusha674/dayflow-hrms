from datetime import date, datetime
from enum import Enum

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class LeaveType(str, Enum):
    PAID = "PAID"
    SICK = "SICK"
    UNPAID = "UNPAID"


class LeaveStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="ck_leave_date_order"),
        Index("ix_leave_status", "status"),
        Index("ix_leave_employee_range", "employee_id", "start_date", "end_date"),
    )

    leave_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    employee_id: Mapped[str] = mapped_column(
        ForeignKey("employees.employee_id", ondelete="CASCADE"), nullable=False, index=True
    )
    leave_type: Mapped[LeaveType] = mapped_column(SAEnum(LeaveType), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    remarks: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[LeaveStatus] = mapped_column(
        SAEnum(LeaveStatus), nullable=False, default=LeaveStatus.PENDING
    )
    hr_comment: Mapped[str | None] = mapped_column(String(500))
    approved_by: Mapped[str | None] = mapped_column(String(16))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    employee = relationship("Employee", back_populates="leaves")
