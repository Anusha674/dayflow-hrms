"""Authentication and authorization dependencies.

Authorization is enforced here, on the server, for every protected route —
never by hiding buttons in the frontend.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth.security import decode_access_token
from app.database.session import get_db
from app.models.user import Role, User

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Your session has expired. Please sign in again.")
    user = db.get(User, int(payload["sub"]))
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account no longer exists.")
    if not user.is_verified:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Please verify your email address to continue.")
    return user


def require_hr(user: User = Depends(get_current_user)) -> User:
    if user.role != Role.HR:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Forbidden — this action is restricted to HR officers."
        )
    return user


def assert_self_or_hr(user: User, employee_id: str) -> None:
    if user.role == Role.HR:
        return
    if user.employee_id != employee_id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Forbidden — you can only access your own records."
        )
