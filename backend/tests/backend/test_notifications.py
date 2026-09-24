from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models
from app.database import Base
from app.models.domain import NotificationPriority, NotificationType
from app.services.notification_service import create_notification, notify_expiry_warning


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()


def test_creation_deduplicates_and_scopes_by_recipient(db):
    first = create_notification(
        db,
        notification_type=NotificationType.DRIVER_ASSIGNED,
        title="Assigned",
        message="Driver assigned.",
        recipient_role="donor",
        recipient_user_id=10,
        dedupe_key="assignment:1:donor",
    )
    duplicate = create_notification(
        db,
        notification_type=NotificationType.DRIVER_ASSIGNED,
        message="Driver assigned.",
        recipient_role="donor",
        recipient_user_id=10,
        dedupe_key="assignment:1:donor",
    )
    db.commit()
    assert first is not None
    assert duplicate is None
    assert db.query(app.models.Notification).count() == 1
    assert db.query(app.models.Notification).filter_by(recipient_user_id=11).count() == 0


def test_expiry_warning_never_targets_expired_donation(db):
    class DonationStub:
        id = 44
        usable_until = datetime.now(timezone.utc) - timedelta(minutes=1)

    assert notify_expiry_warning(db, DonationStub()) is None
    assert db.query(app.models.Notification).count() == 0


def test_expiry_priority_is_warning_then_urgent(db):
    class DonationStub:
        id = 45
        usable_until = datetime.now(timezone.utc) + timedelta(minutes=20)

    notification = notify_expiry_warning(db, DonationStub())
    db.commit()
    assert notification is not None
    assert notification.priority == NotificationPriority.URGENT
    assert "donor-reported" in notification.message