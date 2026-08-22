import csv
import io
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user, require_hr
from app.database.session import get_db
from app.models.attendance import Attendance, AttendanceStatus
from app.models.employee import Employee
from app.models.leave import LeaveRequest, LeaveStatus, LeaveType
from app.models.payroll import Payroll
from app.models.user import Notification, User

router = APIRouter(prefix="/api", tags=["reports"])


# ------------------------------------------------------------------ dashboards


@router.get("/dashboard/employee")
def employee_dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    month = today.strftime("%Y-%m")
    rows = (
        db.query(Attendance)
        .filter(Attendance.employee_id == user.employee_id, Attendance.date.like(f"{month}%"))
        .all()
    )
    present = sum(1 for row in rows if row.status == AttendanceStatus.PRESENT)
    tracked = sum(1 for row in rows if row.status != AttendanceStatus.LEAVE)
    leaves = db.query(LeaveRequest).filter(LeaveRequest.employee_id == user.employee_id).all()

    def taken(kind: LeaveType) -> int:
        return sum(
            (leave.end_date - leave.start_date).days + 1
            for leave in leaves
            if leave.status == LeaveStatus.APPROVED and leave.leave_type == kind
        )

    return {
        "today": next((row for row in rows if row.date == today), None),
        "summary": {
            "present": present,
            "half_day": sum(1 for row in rows if row.status == AttendanceStatus.HALF_DAY),
            "absent": sum(1 for row in rows if row.status == AttendanceStatus.ABSENT),
            "leave": sum(1 for row in rows if row.status == AttendanceStatus.LEAVE),
            "attendance_rate": round(present / tracked * 100) if tracked else 0,
            "hours_this_month": round(sum(row.working_hours for row in rows), 1),
        },
        "leave_balance": {"PAID": max(0, 18 - taken(LeaveType.PAID)),
                          "SICK": max(0, 10 - taken(LeaveType.SICK))},
        "pending_leaves": sum(1 for leave in leaves if leave.status == LeaveStatus.PENDING),
        "recent_leaves": sorted(leaves, key=lambda leave: leave.created_at, reverse=True)[:4],
        "latest_payroll": (
            db.query(Payroll)
            .filter(Payroll.employee_id == user.employee_id)
            .order_by(Payroll.month.desc())
            .first()
        ),
        "unread_notifications": db.query(func.count(Notification.notification_id))
        .filter(Notification.user_id == user.user_id, Notification.is_read.is_(False))
        .scalar(),
    }


@router.get("/dashboard/admin")
def admin_dashboard(_: User = Depends(require_hr), db: Session = Depends(get_db)):
    today = date.today()
    month = today.strftime("%Y-%m")
    headcount = db.query(func.count(Employee.employee_id)).scalar() or 0
    today_rows = db.query(Attendance).filter(Attendance.date == today).all()
    present = sum(1 for row in today_rows if row.status == AttendanceStatus.PRESENT)
    half = sum(1 for row in today_rows if row.status == AttendanceStatus.HALF_DAY)
    on_leave = sum(1 for row in today_rows if row.status == AttendanceStatus.LEAVE)
    payroll_rows = db.query(Payroll).filter(Payroll.month == month).all()

    trend = []
    for offset in range(13, -1, -1):
        day = today - timedelta(days=offset)
        rows = db.query(Attendance).filter(Attendance.date == day).all()
        trend.append(
            {
                "date": day,
                "present": sum(1 for row in rows if row.status == AttendanceStatus.PRESENT),
                "absent": sum(1 for row in rows if row.status == AttendanceStatus.ABSENT),
                "leave": sum(1 for row in rows if row.status == AttendanceStatus.LEAVE),
            }
        )

    return {
        "totals": {
            "employees": headcount,
            "present": present,
            "half_day": half,
            "on_leave": on_leave,
            "absent": max(0, headcount - present - half - on_leave),
            "pending_leaves": db.query(func.count(LeaveRequest.leave_id))
            .filter(LeaveRequest.status == LeaveStatus.PENDING)
            .scalar(),
            "attendance_rate": round((present + half * 0.5) / headcount * 100) if headcount else 0,
            "payroll_month": month,
            "payroll_total": float(sum(row.net_salary for row in payroll_rows)),
            "payroll_published": len(payroll_rows),
        },
        "departments": [
            {"name": name, "value": count}
            for name, count in db.query(Employee.department, func.count()).group_by(Employee.department)
        ],
        "attendance_trend": trend,
    }


# -------------------------------------------------------------------- reports


@router.get("/reports/attendance")
def attendance_report(
    from_date: date | None = None,
    to_date: date | None = None,
    _: User = Depends(require_hr),
    db: Session = Depends(get_db),
):
    to_date = to_date or date.today()
    from_date = from_date or to_date - timedelta(days=30)
    result = []
    for employee in db.query(Employee).order_by(Employee.name).all():
        rows = (
            db.query(Attendance)
            .filter(
                Attendance.employee_id == employee.employee_id,
                Attendance.date >= from_date,
                Attendance.date <= to_date,
            )
            .all()
        )
        present = sum(1 for row in rows if row.status == AttendanceStatus.PRESENT)
        result.append(
            {
                "employee_id": employee.employee_id,
                "name": employee.name,
                "department": employee.department,
                "present": present,
                "half_day": sum(1 for row in rows if row.status == AttendanceStatus.HALF_DAY),
                "leave": sum(1 for row in rows if row.status == AttendanceStatus.LEAVE),
                "absent": sum(1 for row in rows if row.status == AttendanceStatus.ABSENT),
                "total_hours": round(sum(row.working_hours for row in rows), 1),
                "attendance_rate": round(present / len(rows) * 100) if rows else 0,
            }
        )
    return {"range": {"from": from_date, "to": to_date}, "rows": result}


@router.get("/reports/leave")
def leave_report(
    from_date: date | None = None,
    to_date: date | None = None,
    _: User = Depends(require_hr),
    db: Session = Depends(get_db),
):
    query = db.query(LeaveRequest, Employee).join(
        Employee, LeaveRequest.employee_id == Employee.employee_id
    )
    if from_date:
        query = query.filter(LeaveRequest.start_date >= from_date)
    if to_date:
        query = query.filter(LeaveRequest.end_date <= to_date)
    return {
        "rows": [
            {
                "leave_id": leave.leave_id,
                "employee_id": leave.employee_id,
                "name": employee.name,
                "department": employee.department,
                "leave_type": leave.leave_type.value,
                "start_date": leave.start_date,
                "end_date": leave.end_date,
                "days": (leave.end_date - leave.start_date).days + 1,
                "status": leave.status.value,
                "hr_comment": leave.hr_comment or "",
                "approved_by": leave.approved_by or "",
            }
            for leave, employee in query.order_by(LeaveRequest.start_date.desc()).all()
        ]
    }


@router.get("/reports/payroll")
def payroll_report(month: str | None = None, _: User = Depends(require_hr), db: Session = Depends(get_db)):
    month = month or date.today().strftime("%Y-%m")
    rows = (
        db.query(Payroll, Employee)
        .join(Employee, Payroll.employee_id == Employee.employee_id)
        .filter(Payroll.month == month)
        .all()
    )
    return {
        "month": month,
        "rows": [
            {
                "employee_id": payroll.employee_id,
                "name": employee.name,
                "department": employee.department,
                "designation": employee.designation,
                "basic_salary": float(payroll.basic_salary),
                "allowances": float(payroll.allowances),
                "deductions": float(payroll.deductions),
                "net_salary": float(payroll.net_salary),
            }
            for payroll, employee in rows
        ],
        "totals": {
            "headcount": len(rows),
            "basic": float(sum(payroll.basic_salary for payroll, _e in rows)),
            "allowances": float(sum(payroll.allowances for payroll, _e in rows)),
            "deductions": float(sum(payroll.deductions for payroll, _e in rows)),
            "net": float(sum(payroll.net_salary for payroll, _e in rows)),
        },
    }


@router.get("/reports/attendance/export")
def export_attendance(
    from_date: date | None = None,
    to_date: date | None = None,
    user: User = Depends(require_hr),
    db: Session = Depends(get_db),
):
    report = attendance_report(from_date, to_date, user, db)
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=list(report["rows"][0].keys()) if report["rows"] else ["employee_id"])
    writer.writeheader()
    writer.writerows(report["rows"])
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance-report.csv"},
    )
