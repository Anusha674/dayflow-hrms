from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.deps import assert_self_or_hr, get_current_user, require_hr
from app.database.session import get_db
from app.models.attendance import Attendance, AttendanceStatus
from app.models.employee import Employee
from app.models.payroll import Payroll
from app.models.user import User
from app.schemas import PayrollOut, PayrollUpsert
from app.services.records import notify, write_audit

router = APIRouter(prefix="/api/payroll", tags=["payroll"])


def _slip(db: Session, employee_id: str, month: str) -> dict:
    employee = db.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Employee not found.")
    record = (
        db.query(Payroll)
        .filter(Payroll.employee_id == employee_id, Payroll.month == month)
        .first()
    )
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"No payroll has been published for {month}.")
    rows = (
        db.query(Attendance)
        .filter(Attendance.employee_id == employee_id, Attendance.date.like(f"{month}%"))
        .all()
    )
    return {
        "employee": employee,
        "payroll": record,
        "attendance_summary": {
            key.value.lower(): sum(1 for row in rows if row.status == key)
            for key in AttendanceStatus
        },
    }


@router.get("/me", response_model=list[PayrollOut])
def my_payroll(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Payroll)
        .filter(Payroll.employee_id == user.employee_id)
        .order_by(Payroll.month.desc())
        .all()
    )


@router.get("/me/slip")
def my_slip(
    month: str | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return _slip(db, user.employee_id, month or date.today().strftime("%Y-%m"))


@router.get("/all")
def all_payroll(month: str | None = None, _: User = Depends(require_hr), db: Session = Depends(get_db)):
    query = db.query(Payroll, Employee).join(Employee, Payroll.employee_id == Employee.employee_id)
    if month:
        query = query.filter(Payroll.month == month)
    return [
        {
            **{column.name: getattr(payroll, column.name) for column in Payroll.__table__.columns},
            "name": employee.name,
            "department": employee.department,
            "designation": employee.designation,
        }
        for payroll, employee in query.order_by(Payroll.month.desc(), Payroll.employee_id).all()
    ]


@router.get("/{employee_id}", response_model=list[PayrollOut])
def employee_payroll(
    employee_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    assert_self_or_hr(user, employee_id)
    return (
        db.query(Payroll)
        .filter(Payroll.employee_id == employee_id)
        .order_by(Payroll.month.desc())
        .all()
    )


@router.get("/{employee_id}/slip")
def employee_slip(
    employee_id: str,
    month: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_self_or_hr(user, employee_id)
    return _slip(db, employee_id, month or date.today().strftime("%Y-%m"))


@router.put("/{employee_id}", response_model=PayrollOut)
def upsert_payroll(
    employee_id: str,
    payload: PayrollUpsert,
    user: User = Depends(require_hr),
    db: Session = Depends(get_db),
):
    """HR only. net_salary is derived server-side and never accepted from the client."""
    employee = db.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Employee not found.")

    record = (
        db.query(Payroll)
        .filter(Payroll.employee_id == employee_id, Payroll.month == payload.month)
        .with_for_update()
        .first()
    )
    if record is None:
        record = Payroll(employee_id=employee_id, month=payload.month)
        db.add(record)

    record.basic_salary = payload.basic_salary
    record.allowances = payload.allowances
    record.deductions = payload.deductions
    record.net_salary = payload.basic_salary + payload.allowances - payload.deductions

    notify(db, user_id=employee.user_id, title="Payroll updated",
           message=f"Your salary structure for {payload.month} was updated by HR.")
    write_audit(db, user=user, action="PAYROLL_UPDATED", entity="PAYROLL",
                entity_id=f"{employee_id}:{payload.month}")
    db.commit()
    db.refresh(record)
    return record
