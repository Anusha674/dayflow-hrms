from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user, require_hr
from app.database.session import get_db
from app.models.attendance import Attendance, AttendanceStatus
from app.models.employee import Employee
from app.models.leave import LeaveRequest, LeaveStatus
from app.models.user import Role, User
from app.schemas import LeaveCreate, LeaveDecision, LeaveOut
from app.services.records import notify, notify_hr, write_audit

router = APIRouter(prefix="/api/leaves", tags=["leaves"])


@router.post("", response_model=LeaveOut, status_code=201)
def create_leave(
    payload: LeaveCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    overlap = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.employee_id == user.employee_id,
            LeaveRequest.status != LeaveStatus.REJECTED,
            LeaveRequest.start_date <= payload.end_date,
            LeaveRequest.end_date >= payload.start_date,
        )
        .first()
    )
    if overlap:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"This overlaps an existing {overlap.status.value.lower()} request "
            f"({overlap.start_date} → {overlap.end_date}).",
        )

    leave = LeaveRequest(employee_id=user.employee_id, **payload.model_dump())
    db.add(leave)
    db.flush()

    days = (payload.end_date - payload.start_date).days + 1
    notify(db, user_id=user.user_id, title="Leave request submitted",
           message=f"Your {payload.leave_type.value.lower()} leave for "
                   f"{payload.start_date} → {payload.end_date} is pending approval.")
    notify_hr(db, title="New leave request",
              message=f"{user.employee_id} requested {days} day(s) of "
                      f"{payload.leave_type.value.lower()} leave.")
    write_audit(db, user=user, action="LEAVE_SUBMITTED", entity="LEAVE_REQUESTS",
                entity_id=str(leave.leave_id))
    db.commit()
    db.refresh(leave)
    return leave


@router.get("/me", response_model=list[LeaveOut])
def my_leaves(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(LeaveRequest)
        .filter(LeaveRequest.employee_id == user.employee_id)
        .order_by(LeaveRequest.created_at.desc())
        .all()
    )


@router.get("/all")
def all_leaves(
    status_filter: str | None = None, _: User = Depends(require_hr), db: Session = Depends(get_db)
):
    query = db.query(LeaveRequest, Employee).join(
        Employee, LeaveRequest.employee_id == Employee.employee_id
    )
    if status_filter:
        query = query.filter(LeaveRequest.status == status_filter)
    rows = query.order_by(LeaveRequest.created_at.desc()).all()
    return [
        {
            **{column.name: getattr(leave, column.name) for column in LeaveRequest.__table__.columns},
            "name": employee.name,
            "department": employee.department,
            "days": (leave.end_date - leave.start_date).days + 1,
        }
        for leave, employee in rows
    ]


@router.get("/{leave_id}", response_model=LeaveOut)
def get_leave(leave_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    leave = db.get(LeaveRequest, leave_id)
    if not leave:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Leave request not found.")
    if user.role != Role.HR and leave.employee_id != user.employee_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Forbidden — you can only view your own leave requests.")
    return leave


def _decide(
    db: Session, user: User, leave_id: int, decision: LeaveStatus, comment: str
) -> LeaveRequest:
    """Single transaction: leave row + attendance + notification + audit log."""
    leave = db.query(LeaveRequest).filter(LeaveRequest.leave_id == leave_id).with_for_update().first()
    if not leave:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Leave request not found.")
    if leave.status != LeaveStatus.PENDING:
        raise HTTPException(status.HTTP_409_CONFLICT, f"This request was already {leave.status.value.lower()}.")
    if decision == LeaveStatus.REJECTED and len(comment.strip()) < 3:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "A short reason is required when rejecting a request.",
        )

    leave.status = decision
    leave.hr_comment = comment or leave.hr_comment
    leave.approved_by = user.employee_id

    if decision == LeaveStatus.APPROVED:
        day = leave.start_date
        while day <= leave.end_date:
            row = (
                db.query(Attendance)
                .filter(Attendance.employee_id == leave.employee_id, Attendance.date == day)
                .first()
            )
            if row is None:
                row = Attendance(employee_id=leave.employee_id, date=day)
                db.add(row)
            row.status = AttendanceStatus.LEAVE
            row.check_in = None
            row.check_out = None
            row.working_hours = 0
            day += timedelta(days=1)

    employee = db.get(Employee, leave.employee_id)
    if employee:
        notify(
            db,
            user_id=employee.user_id,
            title=f"Leave {decision.value.lower()}",
            message=f"Your {leave.leave_type.value.lower()} leave ({leave.start_date} → "
                    f"{leave.end_date}) was {decision.value.lower()} by HR."
                    + (f" Note: {comment}" if comment else ""),
        )
    write_audit(
        db, user=user,
        action="LEAVE_APPROVED" if decision == LeaveStatus.APPROVED else "LEAVE_REJECTED",
        entity="LEAVE_REQUESTS", entity_id=str(leave.leave_id),
    )
    db.commit()
    db.refresh(leave)
    return leave


@router.put("/{leave_id}/approve", response_model=LeaveOut)
def approve(
    leave_id: int, payload: LeaveDecision, user: User = Depends(require_hr), db: Session = Depends(get_db)
):
    return _decide(db, user, leave_id, LeaveStatus.APPROVED, payload.hr_comment)


@router.put("/{leave_id}/reject", response_model=LeaveOut)
def reject(
    leave_id: int, payload: LeaveDecision, user: User = Depends(require_hr), db: Session = Depends(get_db)
):
    return _decide(db, user, leave_id, LeaveStatus.REJECTED, payload.hr_comment)


@router.post("/{leave_id}/comment", response_model=LeaveOut)
def comment(
    leave_id: int, payload: LeaveDecision, user: User = Depends(require_hr), db: Session = Depends(get_db)
):
    leave = db.get(LeaveRequest, leave_id)
    if not leave:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Leave request not found.")
    if not payload.hr_comment.strip():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Comment cannot be empty.")
    leave.hr_comment = payload.hr_comment
    employee = db.get(Employee, leave.employee_id)
    if employee:
        notify(db, user_id=employee.user_id, title="HR commented on your leave request",
               message=payload.hr_comment)
    write_audit(db, user=user, action="LEAVE_COMMENTED", entity="LEAVE_REQUESTS", entity_id=str(leave_id))
    db.commit()
    db.refresh(leave)
    return leave
