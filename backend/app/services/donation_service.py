from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.models.domain import Donation, SafetyWindowStatus
from app.schemas.donation import DonationCreate


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def safety_window_status(usable_until: datetime, now: datetime | None = None) -> SafetyWindowStatus:
    current_time = as_utc(now or datetime.now(timezone.utc))
    remaining_seconds = (as_utc(usable_until) - current_time).total_seconds()

    if remaining_seconds <= 0:
        return SafetyWindowStatus.EXPIRED
    if remaining_seconds <= 30 * 60:
        return SafetyWindowStatus.EXPIRY_RISK
    if remaining_seconds <= 60 * 60:
        return SafetyWindowStatus.EXPIRY_WARNING
    return SafetyWindowStatus.SAFE_WINDOW_VALID


def build_donation(payload: DonationCreate) -> Donation:
    available_from = as_utc(payload.available_from)
    usable_until = as_utc(payload.usable_until)
    if usable_until <= available_from:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="usable_until must be later than available_from",
        )

    prepared_at = as_utc(payload.prepared_at) if payload.prepared_at else None
    if prepared_at and prepared_at > usable_until:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="prepared_at cannot be later than usable_until",
        )

    return Donation(
        donor_name=payload.donor_name.strip(),
        food_type=payload.food_type.strip().lower(),
        description=payload.description.strip() if payload.description else None,
        quantity=payload.quantity,
        unit=payload.unit.strip().lower(),
        servings=payload.servings,
        dietary_type=payload.dietary_type.strip().lower() if payload.dietary_type else None,
        allergens=payload.allergens.strip() if payload.allergens else None,
        prepared_at=prepared_at,
        available_from=available_from,
        usable_until=usable_until,
        storage_condition=payload.storage_condition.strip(),
        latitude=payload.latitude,
        longitude=payload.longitude,
        safety_window_status=safety_window_status(usable_until),
    )