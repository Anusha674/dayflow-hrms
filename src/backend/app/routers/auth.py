import secrets
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user, require_hr
from app.auth.security import create_access_token, hash_password, verify_password
from app.config import get_settings
from app.database.session import get_db
from app.models.audit import AuditLog
from app.models.employee import Employee
from app.models.user import User
from app.schemas import AuditOut, LoginIn, RegisterIn, ResendIn, TokenOut, VerifyIn
from app.services.records import notify, write_audit
from app.utils.mailer import send_verification_code

router = APIRouter(prefix="/api", tags=["auth"])
settings = get_settings()


@router.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email.lower()).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")
    if db.get(Employee, payload.employee_id):
        raise HTTPException(status.HTTP_409_CONFLICT, "This Employee ID is already in use.")

    code = f"{secrets.randbelow(900000) + 100000}"
    user = User(
        employee_id=payload.employee_id,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_verified=False,
        verification_code=code,
    )
    db.add(user)
    try:
        db.flush()  # allocate user_id inside the transaction
        db.add(
            Employee(
                employee_id=payload.employee_id,
                user_id=user.user_id,
                name=payload.name,
                phone=payload.phone,
                address=payload.address,
                department=payload.department,
                designation=payload.designation,
                joining_date=payload.joining_date or date.today(),
            )
        )
        notify(
            db,
            user_id=user.user_id,
            title="Welcome to Dayflow",
            message=f"Your account was created. Verify your email to activate {payload.employee_id}.",
        )
        write_audit(db, user=user, action="USER_REGISTERED", entity="USERS", entity_id=payload.employee_id)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "That employee ID or email is already registered.")

    send_verification_code(user.email, code)
    return {"message": "Account created. Check your inbox for the 6-digit verification code.",
            "email": user.email}


@router.post("/auth/login", response_model=TokenOut)
def login(payload: LoginIn, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    # Same message for both failure modes — no account enumeration.
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password.")
    if not user.is_verified:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Your email is not verified yet. Enter your verification code."
        )

    write_audit(
        db, user=user, action="LOGIN", entity="USERS", entity_id=user.employee_id,
        ip_address=request.client.host if request.client else None,
    )
    db.commit()

    token = create_access_token(
        user_id=user.user_id, email=user.email, role=user.role.value, employee_id=user.employee_id
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.access_token_expire_minutes * 60,
        "user": user,
        "employee": db.get(Employee, user.employee_id),
    }


@router.post("/auth/verify-email")
def verify_email(payload: VerifyIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No account found for that email.")
    if user.is_verified:
        return {"message": "This account is already verified."}
    if not secrets.compare_digest(user.verification_code or "", payload.code):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "That verification code is incorrect.")

    user.is_verified = True
    user.verification_code = None
    notify(db, user_id=user.user_id, title="Email verified",
           message="Your email address has been verified. Welcome aboard.")
    write_audit(db, user=user, action="EMAIL_VERIFIED", entity="USERS", entity_id=user.employee_id)
    db.commit()
    return {"message": "Email verified. You can sign in now."}


@router.post("/auth/resend-verification")
def resend_verification(payload: ResendIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No account found for that email.")
    if user.is_verified:
        return {"message": "This account is already verified."}
    user.verification_code = f"{secrets.randbelow(900000) + 100000}"
    db.commit()
    send_verification_code(user.email, user.verification_code)
    return {"message": "A new verification code has been sent."}


@router.get("/auth/me")
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"user": user, "employee": db.get(Employee, user.employee_id)}


@router.get("/audit-logs", response_model=list[AuditOut])
def audit_logs(limit: int = 200, _: User = Depends(require_hr), db: Session = Depends(get_db)):
    return (
        db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(min(limit, 1000)).all()
    )
