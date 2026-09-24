import logging
from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.domain import Donation, Notification, NotificationPriority, NotificationType, Pickup

logger = logging.getLogger(__name__)


TYPE_DEFAULTS = {
    NotificationType.DELIVERY_COMPLETED: ("Delivery completed", NotificationPriority.SUCCESS),
    NotificationType.EXPIRY_WARNING: ("Expiry warning", NotificationPriority.WARNING),
    NotificationType.MATCH_FAILED: ("Match unavailable", NotificationPriority.WARNING),
    NotificationType.DRIVER_CANCELLED: ("Driver cancellation", NotificationPriority.WARNING),
}


def create_notification(
    db: Session,
    *,
    notification_type: NotificationType,
    message: str,
    recipient_role: str,
    title: str | None = None,
    recipient_user_id: int | None = None,
    donation_id: int | None = None,
    match_id: int | None = None,
    pickup_id: int | None = None,
    priority: NotificationPriority | None = None,
    dedupe_key: str | None = None,
) -> Notification | None:
    if dedupe_key and db.query(Notification).filter(Notification.dedupe_key == dedupe_key).first():
        return None
    default_title, default_priority = TYPE_DEFAULTS.get(notification_type, (notification_type.value.replace("_", " ").title(), NotificationPriority.INFO))
    notification = Notification(
        notification_type=notification_type,
        title=title or default_title,
        message=message,
        recipient_role=recipient_role,
        recipient_user_id=recipient_user_id,
        related_donation_id=donation_id,
        related_match_id=match_id,
        related_pickup_id=pickup_id,
        pickup_id=pickup_id,
        priority=priority or default_priority,
        dedupe_key=dedupe_key,
    )
    try:
        with db.begin_nested():
            db.add(notification)
            db.flush()
    except IntegrityError:
        logger.exception("Notification creation failed; business operation will continue")
        return None
    return notification


def notify(db: Session, pickup: Pickup, notification_type: NotificationType, message: str, recipient_role: str) -> None:
    try:
        create_notification(
            db,
            notification_type=notification_type,
            message=message,
            recipient_role=recipient_role,
            donation_id=pickup.donation_id,
            pickup_id=pickup.id,
            dedupe_key=f"{notification_type.value}:{pickup.id}:{recipient_role}:{message}",
        )
    except Exception:
        logger.exception("Notification creation failed; business operation will continue")


def notify_match_found(db: Session, donation_id: int, recipient_name: str | None = None) -> None:
    messages = {
        "donor": "Your surplus donation has been matched.",
        "recipient": f"A new food donation has been matched to {recipient_name or 'your organization'}.",
    }
    for role, message in messages.items():
        create_notification(
            db,
            notification_type=NotificationType.MATCH_FOUND,
            title="Donation matched",
            message=message,
            recipient_role=role,
            donation_id=donation_id,
            dedupe_key=f"MATCH_FOUND:{donation_id}:{role}",
        )


def notify_match_failed(db: Session, donation_id: int) -> None:
    create_notification(
        db,
        notification_type=NotificationType.MATCH_FAILED,
        title="No compatible recipient",
        message="No compatible recipient is currently available.",
        recipient_role="donor",
        donation_id=donation_id,
        dedupe_key=f"MATCH_FAILED:{donation_id}:donor",
    )


def notify_driver_assigned(db: Session, pickup: Pickup) -> None:
    messages = {
        "driver": "You have been assigned a food rescue pickup.",
        "donor": "A driver has been assigned to your donation.",
        "recipient": "A driver is being dispatched for your delivery.",
    }
    for role, message in messages.items():
        create_notification(
            db,
            notification_type=NotificationType.DRIVER_ASSIGNED,
            title="Driver assigned",
            message=message,
            recipient_role=role,
            donation_id=pickup.donation_id,
            pickup_id=pickup.id,
            dedupe_key=f"DRIVER_ASSIGNED:{pickup.id}:{role}",
        )


def notify_expiry_warning(db: Session, donation: Donation, recipient_role: str = "donor", now: datetime | None = None) -> Notification | None:
    current = now or datetime.now(timezone.utc)
    usable_until = donation.usable_until.replace(tzinfo=timezone.utc) if donation.usable_until.tzinfo is None else donation.usable_until
    remaining_minutes = (usable_until - current).total_seconds() / 60
    if remaining_minutes <= 0 or remaining_minutes > 60:
        return None
    priority = NotificationPriority.URGENT if remaining_minutes <= 30 else NotificationPriority.WARNING
    return create_notification(
        db,
        notification_type=NotificationType.EXPIRY_WARNING,
        title="Urgent donation timing" if priority == NotificationPriority.URGENT else "Donation expiry warning",
        message="This donation is approaching its donor-reported usable window.",
        recipient_role=recipient_role,
        donation_id=donation.id,
        priority=priority,
        dedupe_key=f"EXPIRY_WARNING:{donation.id}:{priority.value}",
    )