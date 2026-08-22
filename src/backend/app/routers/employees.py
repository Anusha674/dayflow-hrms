from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.deps import assert_self_or_hr, get_current_user, require_hr
from app.database.session import get_db
from app.models.employee import Document, Employee
from app.models.user import User
from app.schemas import DocumentOut, EmployeeHRUpdate, EmployeeOut, EmployeeSelfUpdate
from app.services.records import notify, write_audit

router = APIRouter(prefix="/api/employees", tags=["employees"])


def _get_or_404(db: Session, employee_id: str) -> Employee:
    employee = db.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Employee not found.")
    return employee


@router.get("/me", response_model=EmployeeOut)
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _get_or_404(db, user.employee_id)


@router.put("/me", response_model=EmployeeOut)
def update_me(
    payload: EmployeeSelfUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Employees may only change phone, address and profile picture."""
    employee = _get_or_404(db, user.employee_id)
    employee.phone = payload.phone
    employee.address = payload.address
    if payload.profile_picture is not None:
        employee.profile_picture = payload.profile_picture
    write_audit(db, user=user, action="PROFILE_UPDATED", entity="EMPLOYEES", entity_id=employee.employee_id)
    db.commit()
    db.refresh(employee)
    return employee


@router.get("", response_model=list[EmployeeOut])
def list_employees(_: User = Depends(require_hr), db: Session = Depends(get_db)):
    return db.query(Employee).order_by(Employee.name).all()


@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(
    employee_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    assert_self_or_hr(user, employee_id)
    return _get_or_404(db, employee_id)


@router.put("/{employee_id}", response_model=EmployeeOut)
def update_employee(
    employee_id: str,
    payload: EmployeeHRUpdate,
    user: User = Depends(require_hr),
    db: Session = Depends(get_db),
):
    employee = _get_or_404(db, employee_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(employee, field, value)
    notify(db, user_id=employee.user_id, title="Profile updated by HR",
           message=f"{user.email} updated your employment details.")
    write_audit(db, user=user, action="EMPLOYEE_UPDATED", entity="EMPLOYEES", entity_id=employee_id)
    db.commit()
    db.refresh(employee)
    return employee


@router.get("/{employee_id}/documents", response_model=list[DocumentOut])
def list_documents(
    employee_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    assert_self_or_hr(user, employee_id)
    return db.query(Document).filter(Document.employee_id == employee_id).all()


@router.post("/{employee_id}/documents", response_model=DocumentOut, status_code=201)
def add_document(
    employee_id: str,
    document_name: str,
    document_path: str | None = None,
    user: User = Depends(require_hr),
    db: Session = Depends(get_db),
):
    employee = _get_or_404(db, employee_id)
    document = Document(
        employee_id=employee_id,
        document_name=document_name,
        document_path=document_path or f"/secure/docs/{employee_id}/{document_name}",
    )
    db.add(document)
    notify(db, user_id=employee.user_id, title="New document available",
           message=f"{document_name} was added to your employee file.")
    write_audit(db, user=user, action="DOCUMENT_UPLOADED", entity="DOCUMENTS", entity_id=document_name)
    db.commit()
    db.refresh(document)
    return document
