from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.domain import Notification
from app.schemas.notifications import NotificationMarkRead, NotificationRead

router = APIRouter(prefix="/notifications", tags=["notifications"])


def scoped_query(db: Session, user_id: int | None, role: str | None, admin: bool):
    query = db.query(Notification)
    if admin:
        return query
    if user_id is not None:
        return query.filter(Notification.recipient_user_id == user_id)
    if role:
        return query.filter(Notification.recipient_role == role)
    return query.filter(Notification.recipient_role == "public")


@router.get("", response_model=list[NotificationRead])
def list_notifications(
    user_id: int | None = Query(default=None, gt=0),
    role: str | None = Query(default=None, max_length=40),
    admin: bool = False,
    db: Session = Depends(get_db),
) -> list[Notification]:
    return scoped_query(db, user_id, role, admin).order_by(Notification.created_at.desc()).limit(100).all()


@router.get("/unread-count")
def unread_count(
    user_id: int | None = Query(default=None, gt=0),
    role: str | None = Query(default=None, max_length=40),
    admin: bool = False,
    db: Session = Depends(get_db),
) -> dict[str, int]:
    count = scoped_query(db, user_id, role, admin).filter(Notification.is_read.is_(False)).count()
    return {"unread_count": count}


@router.get("/{notification_id}", response_model=NotificationRead)
def get_notification(
    notification_id: int,
    user_id: int | None = Query(default=None, gt=0),
    role: str | None = Query(default=None, max_length=40),
    admin: bool = False,
    db: Session = Depends(get_db),
) -> Notification:
    notification = scoped_query(db, user_id, role, admin).filter(Notification.id == notification_id).first()
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification


@router.patch("/{notification_id}/read", response_model=NotificationRead)
def mark_read(
    notification_id: int,
    payload: NotificationMarkRead,
    role: str | None = Query(default=None, max_length=40),
    admin: bool = False,
    db: Session = Depends(get_db),
) -> Notification:
    notification = scoped_query(db, payload.user_id, role, admin).filter(Notification.id == notification_id).first()
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    notification.read_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(notification)
    return notification


@router.post("/mark-all-read")
def mark_all_read(
    payload: NotificationMarkRead,
    role: str | None = Query(default=None, max_length=40),
    admin: bool = False,
    db: Session = Depends(get_db),
) -> dict[str, int]:
    notifications = scoped_query(db, payload.user_id, role, admin).filter(Notification.is_read.is_(False)).all()
    read_at = datetime.now(timezone.utc)
    for notification in notifications:
        notification.is_read = True
        notification.read_at = read_at
    db.commit()
    return {"marked_read": len(notifications)}
