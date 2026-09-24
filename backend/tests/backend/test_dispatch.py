from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models
from app.database import Base
from app.models.domain import (
    Donation,
    DonationStatus,
    Driver,
    DriverStatus,
    PickupStatus,
    RecipientOrganization,
    RecipientUrgency,
    SafetyWindowStatus,
)
from app.services.dispatch_service import assign_driver, cancel_and_reassign, update_status


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()


def make_rescue(db, usable_until, driver_capacity=50):
    now = datetime.now(timezone.utc)
    recipient = RecipientOrganization(
        name="Shelter A", capacity=50, current_need=40, latitude=12.901, longitude=77.601,
        urgency=RecipientUrgency.HIGH, available=True,
    )
    driver = Driver(
        name="Alex", phone="555", vehicle_type="van", capacity=driver_capacity,
        latitude=12.9, longitude=77.6, status=DriverStatus.AVAILABLE, availability=True,
    )
    donation = Donation(
        donor_name="Restaurant A", food_type="prepared_meal", quantity=40, unit="servings", servings=40,
        dietary_type="vegetarian", available_from=now, usable_until=usable_until,
        storage_condition="refrigerated", latitude=12.9005, longitude=77.6005,
        safety_window_status=SafetyWindowStatus.SAFE_WINDOW_VALID,
    )
    db.add_all([recipient, driver, donation])
    db.commit()
    db.refresh(recipient)
    db.refresh(donation)
    return donation, recipient, driver


def test_successful_assignment_and_completion(db):
    donation, recipient, driver = make_rescue(db, datetime.now(timezone.utc) + timedelta(hours=2))
    pickup, candidate, _ = assign_driver(db, donation, recipient.id)
    assert candidate.driver.id == driver.id
    assert pickup.status == PickupStatus.DRIVER_ASSIGNED
    for next_status in [PickupStatus.DRIVER_EN_ROUTE, PickupStatus.PICKUP_READY, PickupStatus.PICKED_UP, PickupStatus.DELIVERING, PickupStatus.DELIVERED, PickupStatus.COMPLETED]:
        update_status(db, pickup, next_status, "Alex", None)
    assert donation.status == DonationStatus.COMPLETED
    assert driver.status == DriverStatus.AVAILABLE
    assert db.query(app.models.Notification).filter_by(pickup_id=pickup.id).count() >= 6
    assert db.query(app.models.ImpactRecord).filter_by(donation_id=donation.id).count() == 1


def test_insufficient_capacity_is_rejected(db):
    donation, recipient, _ = make_rescue(db, datetime.now(timezone.utc) + timedelta(hours=2), driver_capacity=10)
    with pytest.raises(HTTPException, match="No feasible driver"):
        assign_driver(db, donation, recipient.id)


def test_expired_donation_is_never_assigned(db):
    donation, recipient, _ = make_rescue(db, datetime.now(timezone.utc) - timedelta(minutes=1))
    with pytest.raises(HTTPException):
        assign_driver(db, donation, recipient.id)


def test_invalid_transition_is_rejected(db):
    donation, recipient, _ = make_rescue(db, datetime.now(timezone.utc) + timedelta(hours=2))
    pickup, _, _ = assign_driver(db, donation, recipient.id)
    with pytest.raises(HTTPException, match="Invalid status transition"):
        update_status(db, pickup, PickupStatus.DELIVERED, "Alex", None)


def test_driver_cancellation_reassigns_same_pickup(db):
    donation, recipient, old_driver = make_rescue(db, datetime.now(timezone.utc) + timedelta(hours=2))
    replacement = Driver(
        name="Jordan", phone="556", vehicle_type="van", capacity=50, latitude=12.9, longitude=77.6,
        status=DriverStatus.AVAILABLE, availability=True,
    )
    db.add(replacement)
    db.commit()
    pickup, _, _ = assign_driver(db, donation, recipient.id)
    old_driver.availability = False
    old_driver.status = DriverStatus.OFFLINE
    db.commit()
    reassigned, candidate, _ = cancel_and_reassign(db, pickup, "ops", "Driver cancelled")
    assert reassigned.id == pickup.id
    assert candidate.driver.name == "Jordan"
    assert reassigned.status == PickupStatus.DRIVER_ASSIGNED