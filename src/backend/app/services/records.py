"""Shared write helpers used inside route transactions."""
from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.user import Notification, Role, User


def write_audit(
    db: Session,
    *,
    user: User,
    action: str,
    entity: str,
    entity_id: str,
    ip_address: str | None = None,
) -> None:
    """Staged on the caller's session so it commits with the change it describes."""
    db.add(
        AuditLog(
            user_id=user.user_id,
            actor=user.email,
            action=action,
            entity=entity,
            entity_id=str(entity_id),
            ip_address=ip_address,
        )
    )


def notify(db: Session, *, user_id: int, title: str, message: str) -> None:
    db.add(Notification(user_id=user_id, title=title, message=message))


def notify_hr(db: Session, *, title: str, message: str) -> None:
    for hr in db.query(User).filter(User.role == Role.HR).all():
        notify(db, user_id=hr.user_id, title=title, message=message)
