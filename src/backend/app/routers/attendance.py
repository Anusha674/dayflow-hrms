from datetime import date as date_type, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.deps import assert_self_or_hr, get_current_user, require_hr
from app.database.session import get_db
from app.models.attendance import Attendance, AttendanceStatus
from app.models.employee import Employee
from app.models.user import User
from app.schemas import AttendanceAdminUpdate, AttendanceOut, PunchIn
from app.services.records import notify, write_audit

router = APIRouter(prefix="/api/attendance", tags=["attendance"])


def _derive(hours: float) -> AttendanceStatus:
    if hours >= 6:
        return AttendanceStatus.PRESENT
    if hours > 0:
        return AttendanceStatus.HALF_DAY
    return AttendanceStatus.ABSENT


def _row(db: Session, employee_id: str, day: date_type) -> Attendance | None:
    return (
        db.query(Attendance)
        .filter(Attendance.employee_id == employee_id, Attendance.date == day)
        .with_for_update()
        .first()
    )


@router.post("/check-in", response_model=AttendanceOut, status_code=201)
def check_in(payload: PunchIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stamp = payload.client_timestamp or datetime.now()
    day = payload.client_date or stamp.date()
    if day > date_type.today():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Cannot check in for a future date.")

    record = _row(db, user.employee_id, day)
    if record and record.check_in:
        raise HTTPException(status.HTTP_409_CONFLICT, "You have already checked in today.")
    if record is None:
        record = Attendance(employee_id=user.employee_id, date=day)
        db.add(record)
    record.check_in = stamp
    record.status = AttendanceStatus.PRESENT
    record.source = "OFFLINE_SYNC" if payload.client_timestamp else "ONLINE"

    notify(db, user_id=user.user_id, title="Checked in", message=f"Attendance recorded for {day}.")
    write_audit(db, user=user, action="ATTENDANCE_CHECK_IN", entity="ATTENDANCE",
                entity_id=f"{user.employee_id}:{day}")
    db.commit()
    db.refresh(record)
    return record


@router.post("/check-out", response_model=AttendanceOut)
def check_out(payload: PunchIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stamp = payload.client_timestamp or datetime.now()
    day = payload.client_date or stamp.date()

    record = _row(db, user.employee_id, day)
    if not record or not record.check_in:
        raise HTTPException(status.HTTP_409_CONFLICT, "You need to check in before checking out.")
    if record.check_out:
        raise HTTPException(status.HTTP_409_CONFLICT, "You have already checked out today.")
    if stamp < record.check_in:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "Check-out time cannot be earlier than check-in time."
        )

    record.check_out = stamp
    record.working_hours = round((stamp - record.check_in).total_seconds() / 3600, 2)
    record.status = _derive(record.working_hours)
    write_audit(db, user=user, action="ATTENDANCE_CHECK_OUT", entity="ATTENDANCE",
                entity_id=f"{user.employee_id}:{day}")
    db.commit()
    db.refresh(record)
    return record


@router.get("/me", response_model=list[AttendanceOut])
def my_attendance(
    from_date: date_type | None = None,
    to_date: date_type | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Attendance).filter(Attendance.employee_id == user.employee_id)
    if from_date:
        query = query.filter(Attendance.date >= from_date)
    if to_date:
        query = query.filter(Attendance.date <= to_date)
    return query.order_by(Attendance.date.desc()).all()


@router.get("/me/daily")
def my_daily(
    day: date_type | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    day = day or date_type.today()
    record = (
        db.query(Attendance)
        .filter(Attendance.employee_id == user.employee_id, Attendance.date == day)
        .first()
    )
    return {"date": day, "record": record}


@router.get("/me/weekly")
def my_weekly(
    week_of: date_type | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    anchor = week_of or date_type.today()
    monday = anchor - timedelta(days=anchor.weekday())
    days = [monday + timedelta(days=index) for index in range(7)]
    rows = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == user.employee_id,
            Attendance.date >= days[0],
            Attendance.date <= days[-1],
        )
        .all()
    )
    by_date = {row.date: row for row in rows}
    return {
        "week_start": days[0],
        "week_end": days[-1],
        "days": [{"date": day, "record": by_date.get(day)} for day in days],
        "total_hours": round(sum(row.working_hours for row in rows), 2),
    }


@router.get("/all")
def all_attendance(
    day: date_type | None = None,
    employee_id: str | None = None,
    _: User = Depends(require_hr),
    db: Session = Depends(get_db),
):
    query = db.query(Attendance, Employee).join(Employee, Attendance.employee_id == Employee.employee_id)
    if day:
        query = query.filter(Attendance.date == day)
    if employee_id:
        query = query.filter(Attendance.employee_id == employee_id)
    rows = query.order_by(Attendance.date.desc(), Attendance.employee_id).limit(500).all()
    return [
        {
            "attendance_id": attendance.attendance_id,
            "employee_id": attendance.employee_id,
            "name": employee.name,
            "department": employee.department,
            "date": attendance.date,
            "check_in": attendance.check_in,
            "check_out": attendance.check_out,
            "working_hours": attendance.working_hours,
            "status": attendance.status,
        }
        for attendance, employee in rows
    ]


@router.get("/employee/{employee_id}", response_model=list[AttendanceOut])
def employee_attendance(
    employee_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    assert_self_or_hr(user, employee_id)
    return (
        db.query(Attendance)
        .filter(Attendance.employee_id == employee_id)
        .order_by(Attendance.date.desc())
        .all()
    )


@router.put("/{attendance_id}", response_model=AttendanceOut)
def amend(
    attendance_id: int,
    payload: AttendanceAdminUpdate,
    user: User = Depends(require_hr),
    db: Session = Depends(get_db),
):
    record = db.get(Attendance, attendance_id)
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Attendance record not found.")

    record.check_in = payload.check_in
    record.check_out = payload.check_out
    if payload.check_in and payload.check_out:
        record.working_hours = round((payload.check_out - payload.check_in).total_seconds() / 3600, 2)
    if payload.status in (AttendanceStatus.ABSENT, AttendanceStatus.LEAVE):
        record.working_hours = 0
    record.status = payload.status

    employee = db.get(Employee, record.employee_id)
    if employee:
        notify(db, user_id=employee.user_id, title="Attendance amended",
               message=f"HR updated your {record.date} attendance to {payload.status.value}.")
    write_audit(db, user=user, action="ATTENDANCE_MODIFIED", entity="ATTENDANCE",
                entity_id=f"{record.employee_id}:{record.date}")
    db.commit()
    db.refresh(record)
    return record
