from datetime import date, datetime
from enum import Enum

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class AttendanceStatus(str, Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    HALF_DAY = "HALF_DAY"
    LEAVE = "LEAVE"


class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (
        # One row per employee per day — the database, not the API, is the guard.
        UniqueConstraint("employee_id", "date", name="uq_attendance_employee_date"),
        CheckConstraint("working_hours >= 0 AND working_hours <= 24", name="ck_attendance_hours"),
        CheckConstraint("check_out IS NULL OR check_in IS NULL OR check_out >= check_in",
                        name="ck_attendance_order"),
        Index("ix_attendance_date", "date"),
    )

    attendance_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    employee_id: Mapped[str] = mapped_column(
        ForeignKey("employees.employee_id", ondelete="CASCADE"), nullable=False, index=True
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    check_in: Mapped[datetime | None] = mapped_column(DateTime)
    check_out: Mapped[datetime | None] = mapped_column(DateTime)
    working_hours: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    status: Mapped[AttendanceStatus] = mapped_column(
        SAEnum(AttendanceStatus), nullable=False, default=AttendanceStatus.ABSENT
    )
    source: Mapped[str] = mapped_column(String(16), nullable=False, default="ONLINE")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    employee = relationship("Employee", back_populates="attendance")
