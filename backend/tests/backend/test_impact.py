from datetime import datetime, timedelta, timezone

import app.models
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.analytics.service import calculate_impact, record_completed_impact
from app.models.domain import Donation, DonationStatus, Driver, ImpactRecord, RecipientOrganization, SafetyWindowStatus


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def recipient(db):
    value = RecipientOrganization(name="Shelter", capacity=50, current_need=20, latitude=12.9, longitude=77.6, available=True)
    db.add(value)
    db.commit()
    return value


@pytest.fixture
def driver(db):
    value = Driver(name="Alex", vehicle_type="van", capacity=50, latitude=12.9, longitude=77.6, availability=True)
    db.add(value)
    db.commit()
    return value


def make_donation(status, created_at):
    return Donation(
        donor_name="Cafe", food_type="prepared_meal", quantity=10, unit="servings", servings=10,
        available_from=created_at, usable_until=created_at + timedelta(hours=2),
        storage_condition="refrigerated", latitude=12.9, longitude=77.6,
        status=status, safety_window_status=SafetyWindowStatus.SAFE_WINDOW_VALID,
        created_at=created_at,
    )


def test_incomplete_donation_is_not_rescued(db):
    donation = make_donation(DonationStatus.MATCHED, datetime.now(timezone.utc))
    db.add(donation)
    db.commit()
    assert record_completed_impact(db, donation) is None
    assert db.query(ImpactRecord).count() == 0


def test_completed_impact_is_idempotent(db, recipient, driver):
    now = datetime.now(timezone.utc)
    donation = make_donation(DonationStatus.COMPLETED, now)
    from app.models.domain import Pickup, PickupStatus
    pickup = Pickup(donation=donation, driver=driver, recipient=recipient, status=PickupStatus.COMPLETED, delivered_at=now)
    db.add(pickup)
    db.commit()
    first = record_completed_impact(db, donation)
    db.flush()
    second = record_completed_impact(db, donation)
    assert first.id == second.id
    assert db.query(ImpactRecord).count() == 1


def test_expired_and_unmatched_are_reported(db):
    now = datetime.now(timezone.utc)
    expired = make_donation(DonationStatus.POSTED, now - timedelta(hours=3))
    expired.safety_window_status = SafetyWindowStatus.EXPIRED
    unmatched = make_donation(DonationStatus.POSTED, now)
    db.add_all([expired, unmatched])
    db.commit()
    metrics = calculate_impact(db)
    assert metrics["expired_donations"]["value"] == 1
    assert metrics["unmatched_donations"]["value"] == 1


def test_date_filter_excludes_old_records(db, recipient, driver):
    now = datetime.now(timezone.utc)
    old = make_donation(DonationStatus.COMPLETED, now - timedelta(days=10))
    from app.models.domain import Pickup, PickupStatus
    old_pickup = Pickup(donation=old, driver=driver, recipient=recipient, status=PickupStatus.COMPLETED, delivered_at=old.created_at)
    db.add(old_pickup)
    db.commit()
    assert calculate_impact(db, start_date=(now - timedelta(days=1)).date())["donations_completed"]["value"] == 0