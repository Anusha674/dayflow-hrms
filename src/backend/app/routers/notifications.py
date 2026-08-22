from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.database.session import get_db
from app.models.user import Notification, User

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
def list_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = (
        db.query(Notification)
        .filter(Notification.user_id == user.user_id)
        .order_by(Notification.created_at.desc())
        .limit(100)
        .all()
    )
    return {"items": items, "unread": sum(1 for item in items if not item.is_read)}


@router.put("/read-all")
def mark_all_read(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    updated = (
        db.query(Notification)
        .filter(Notification.user_id == user.user_id, Notification.is_read.is_(False))
        .update({"is_read": True})
    )
    db.commit()
    return {"updated": updated}


@router.put("/{notification_id}/read")
def mark_read(
    notification_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    record = db.get(Notification, notification_id)
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found.")
    if record.user_id != user.user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Forbidden.")
    record.is_read = True
    db.commit()
    return record
