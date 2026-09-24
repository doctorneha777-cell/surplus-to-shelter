from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.domain import (
    Donation,
    DonationStatus,
    Driver,
    DriverStatus,
    Pickup,
    PickupStatus,
    RecipientOrganization,
    StatusEvent,
    StatusEventType,
    NotificationType,
)
from app.routing.service import RouteResult, build_route
from app.analytics.service import record_completed_impact
from app.services.notification_service import notify, notify_driver_assigned


STATUS_ORDER = {
    PickupStatus.POSTED: 0,
    PickupStatus.MATCHED: 1,
    PickupStatus.DRIVER_ASSIGNED: 2,
    PickupStatus.DRIVER_EN_ROUTE: 3,
    PickupStatus.PICKUP_READY: 4,
    PickupStatus.PICKED_UP: 5,
    PickupStatus.DELIVERING: 6,
    PickupStatus.DELIVERED: 7,
    PickupStatus.COMPLETED: 8,
}

EVENT_FOR_STATUS = {
    PickupStatus.POSTED: StatusEventType.POSTED,
    PickupStatus.MATCHED: StatusEventType.MATCHED,
    PickupStatus.DRIVER_ASSIGNED: StatusEventType.DRIVER_ASSIGNED,
    PickupStatus.DRIVER_EN_ROUTE: StatusEventType.DRIVER_EN_ROUTE,
    PickupStatus.PICKUP_READY: StatusEventType.PICKUP_READY,
    PickupStatus.PICKED_UP: StatusEventType.PICKED_UP,
    PickupStatus.DELIVERING: StatusEventType.DELIVERING,
    PickupStatus.DELIVERED: StatusEventType.DELIVERED,
    PickupStatus.COMPLETED: StatusEventType.COMPLETED,
}

DRIVER_STATUS_FOR_PICKUP = {
    PickupStatus.DRIVER_ASSIGNED: DriverStatus.ASSIGNED,
    PickupStatus.DRIVER_EN_ROUTE: DriverStatus.EN_ROUTE_TO_DONOR,
    PickupStatus.PICKUP_READY: DriverStatus.AT_DONOR,
    PickupStatus.PICKED_UP: DriverStatus.PICKED_UP,
    PickupStatus.DELIVERING: DriverStatus.EN_ROUTE_TO_RECIPIENT,
    PickupStatus.DELIVERED: DriverStatus.DELIVERED,
}


@dataclass(frozen=True)
class DriverCandidate:
    driver: Driver
    route: RouteResult
    score: float
    reason: str


def _utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def _driver_score(route: RouteResult, driver: Driver, donation: Donation) -> float:
    eta_score = max(0.0, min(1.0, 1 - route.travel_minutes / 120))
    distance_score = max(0.0, min(1.0, 1 - route.distance_km / 20))
    capacity_score = min(1.0, donation.servings / max(driver.capacity, donation.servings))
    return round(0.35 * eta_score + 0.25 * distance_score + 0.15 * capacity_score + 0.25, 4)


def _candidate_drivers(donation: Donation, recipient: RecipientOrganization, drivers: list[Driver]):
    donation.recipient = recipient
    eligible: list[DriverCandidate] = []
    rejected: list[str] = []
    usable_until = _utc(donation.usable_until)
    if usable_until <= datetime.now(timezone.utc):
        return [], ["Donation usable window has expired."]
    for driver in drivers:
        if not driver.availability or driver.status != DriverStatus.AVAILABLE:
            rejected.append(f"{driver.name}: unavailable")
            continue
        if driver.capacity < donation.servings:
            rejected.append(f"{driver.name}: capacity {driver.capacity} is below {donation.servings} servings")
            continue
        route = build_route(donation, driver=driver)
        if not route.is_feasible:
            rejected.append(f"{driver.name}: route needs {route.travel_minutes} minutes but only {route.remaining_usable_minutes} remain")
            continue
        eligible.append(DriverCandidate(driver, route, _driver_score(route, driver, donation), f"ETA {route.travel_minutes} min; {route.distance_km:.1f} km; capacity sufficient"))
    return sorted(eligible, key=lambda candidate: candidate.score, reverse=True), rejected


def assign_driver(db: Session, donation: Donation, recipient_id: int):
    if donation.pickup and donation.pickup.status not in {PickupStatus.CANCELLED, PickupStatus.DELIVERED, PickupStatus.COMPLETED}:
        raise HTTPException(status_code=409, detail="Donation already has an active pickup")
    recipient = db.get(RecipientOrganization, recipient_id)
    if recipient is None or not recipient.available:
        raise HTTPException(status_code=404, detail="Recipient is not available")
    if donation.servings > recipient.capacity:
        raise HTTPException(status_code=422, detail="Recipient cannot accept this donation")
    candidates, rejected = _candidate_drivers(donation, recipient, db.query(Driver).all())
    if not candidates:
        raise HTTPException(status_code=409, detail={"message": "No feasible driver currently available.", "reasons": rejected})
    selected = candidates[0]
    now = datetime.now(timezone.utc)
    pickup = Pickup(
        donation=donation,
        driver=selected.driver,
        recipient=recipient,
        assigned_at=now,
        estimated_arrival=now + timedelta(minutes=selected.route.travel_minutes),
        status=PickupStatus.DRIVER_ASSIGNED,
    )
    donation.recipient_id = recipient.id
    donation.driver_id = selected.driver.id
    donation.status = DonationStatus.DRIVER_ASSIGNED
    selected.driver.status = DriverStatus.ASSIGNED
    selected.driver.availability = False
    db.add(pickup)
    db.flush()
    db.add(StatusEvent(
        pickup_id=pickup.id,
        donation_id=donation.id,
        old_status=PickupStatus.MATCHED.value,
        new_status=PickupStatus.DRIVER_ASSIGNED.value,
        status=StatusEventType.DRIVER_ASSIGNED,
        actor="system",
        note=selected.reason,
    ))
    notify_driver_assigned(db, pickup)
    db.commit()
    db.refresh(pickup)
    return pickup, selected, rejected


def update_status(db: Session, pickup: Pickup, requested_status: PickupStatus, actor: str, note: str | None):
    current_status = pickup.status
    if requested_status not in STATUS_ORDER or STATUS_ORDER[requested_status] != STATUS_ORDER[current_status] + 1:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Invalid status transition from {current_status.value} to {requested_status.value}")
    now = datetime.now(timezone.utc)
    timestamp_field = {
        PickupStatus.DRIVER_EN_ROUTE: "pickup_started_at",
        PickupStatus.PICKED_UP: "picked_up_at",
        PickupStatus.DELIVERING: "delivery_started_at",
        PickupStatus.DELIVERED: "delivered_at",
    }.get(requested_status)
    if timestamp_field:
        setattr(pickup, timestamp_field, now)
    pickup.status = requested_status
    if requested_status in DRIVER_STATUS_FOR_PICKUP:
        pickup.driver.status = DRIVER_STATUS_FOR_PICKUP[requested_status]
        pickup.driver.availability = False
    if requested_status == PickupStatus.COMPLETED:
        pickup.donation.status = DonationStatus.COMPLETED
        record_completed_impact(db, pickup.donation)
        pickup.driver.status = DriverStatus.AVAILABLE
        pickup.driver.availability = True
    elif requested_status in {PickupStatus.PICKED_UP, PickupStatus.DELIVERED}:
        pickup.donation.status = DonationStatus[requested_status.value]
    event = StatusEvent(
        pickup_id=pickup.id,
        donation_id=pickup.donation_id,
        old_status=current_status.value,
        new_status=requested_status.value,
        status=EVENT_FOR_STATUS[requested_status],
        actor=actor.strip(),
        note=note,
    )
    db.add(event)
    notification_by_status = {
        PickupStatus.DRIVER_EN_ROUTE: (NotificationType.DRIVER_ACCEPTED, "Driver started the trip to the donor."),
        PickupStatus.PICKUP_READY: (NotificationType.DRIVER_APPROACHING, "Driver arrived at the donor."),
        PickupStatus.PICKED_UP: (NotificationType.PICKUP_COMPLETED, "Donation pickup completed."),
        PickupStatus.DELIVERING: (NotificationType.DELIVERY_STARTED, "Delivery started for the recipient."),
        PickupStatus.DELIVERED: (NotificationType.DELIVERY_COMPLETED, "Donation delivered to the recipient."),
    }
    notification = notification_by_status.get(requested_status)
    if notification:
        notify(db, pickup, notification[0], notification[1], "donor" if requested_status in {PickupStatus.DRIVER_EN_ROUTE, PickupStatus.PICKUP_READY} else "recipient")
    if requested_status == PickupStatus.COMPLETED:
        notify(db, pickup, NotificationType.DELIVERY_COMPLETED, "Rescue completed successfully.", "donor")
    db.commit()
    db.refresh(event)
    return event


def cancel_and_reassign(db: Session, pickup: Pickup, actor: str, reason: str | None):
    old_driver = pickup.driver
    old_driver.status = DriverStatus.OFFLINE
    old_driver.availability = False
    old_status = pickup.status
    pickup.status = PickupStatus.CANCELLED
    pickup.notes = reason
    db.add(StatusEvent(
        pickup_id=pickup.id,
        donation_id=pickup.donation_id,
        old_status=old_status.value,
        new_status=PickupStatus.CANCELLED.value,
        status=StatusEventType.CANCELLED,
        actor=actor,
        note=reason,
    ))
    notify(db, pickup, NotificationType.DRIVER_CANCELLED, reason or "Assigned driver cancelled.", "operations")
    db.flush()
    candidates, rejected = _candidate_drivers(pickup.donation, pickup.recipient, db.query(Driver).all())
    if not candidates:
        db.commit()
        raise HTTPException(status_code=409, detail={"message": "No feasible driver currently available.", "reasons": rejected})
    selected = candidates[0]
    now = datetime.now(timezone.utc)
    pickup.driver = selected.driver
    pickup.assigned_at = now
    pickup.estimated_arrival = now + timedelta(minutes=selected.route.travel_minutes)
    pickup.status = PickupStatus.DRIVER_ASSIGNED
    pickup.donation.driver_id = selected.driver.id
    selected.driver.status = DriverStatus.ASSIGNED
    selected.driver.availability = False
    db.add(StatusEvent(
        pickup_id=pickup.id,
        donation_id=pickup.donation_id,
        old_status=PickupStatus.CANCELLED.value,
        new_status=PickupStatus.DRIVER_ASSIGNED.value,
        status=StatusEventType.DRIVER_ASSIGNED,
        actor="system",
        note=f"Reassigned to {selected.driver.name}",
    ))
    notify(db, pickup, NotificationType.REASSIGNMENT, f"Rescue reassigned to driver {selected.driver.name}.", "driver")
    db.commit()
    db.refresh(pickup)
    return pickup, selected, rejected
