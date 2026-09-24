from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.domain import NotificationPriority, NotificationType


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    recipient_user_id: int | None
    pickup_id: int | None
    notification_type: NotificationType
    title: str
    message: str
    recipient_role: str
    related_donation_id: int | None
    related_match_id: int | None
    related_pickup_id: int | None
    priority: NotificationPriority
    is_read: bool
    read_at: datetime | None
    created_at: datetime


class NotificationMarkRead(BaseModel):
    user_id: int | None = None