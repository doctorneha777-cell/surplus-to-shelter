from dataclasses import dataclass
from datetime import datetime, timezone

from fastapi import HTTPException

from app.matching.service import haversine_km
from app.models.domain import Donation


ESTIMATED_SPEED_KMH = 25.0


@dataclass(frozen=True)
class RouteStop:
    name: str
    role: str
    latitude: float
    longitude: float


@dataclass(frozen=True)
class RouteResult:
    donation_id: int
    stops: list[RouteStop]
    distance_km: float
    travel_minutes: int
    remaining_usable_minutes: int
    is_feasible: bool
    estimate_label: str


def build_route(donation: Donation, driver=None) -> RouteResult:
    route_driver = driver or donation.driver
    if route_driver is None or donation.recipient is None:
        raise HTTPException(status_code=409, detail="Donation must have a driver and recipient before routing")

    recipient = donation.recipient
    driver_to_donor = haversine_km(route_driver.latitude, route_driver.longitude, donation.latitude, donation.longitude)
    donor_to_recipient = haversine_km(donation.latitude, donation.longitude, recipient.latitude, recipient.longitude)
    total_distance = driver_to_donor + donor_to_recipient
    travel_minutes = max(1, round(total_distance / ESTIMATED_SPEED_KMH * 60))
    usable_until = donation.usable_until
    if usable_until.tzinfo is None:
        usable_until = usable_until.replace(tzinfo=timezone.utc)
    remaining_minutes = max(0, round((usable_until - datetime.now(timezone.utc)).total_seconds() / 60))

    return RouteResult(
        donation_id=donation.id,
        stops=[
            RouteStop(route_driver.name, "DRIVER", route_driver.latitude, route_driver.longitude),
            RouteStop(donation.donor_name, "DONOR", donation.latitude, donation.longitude),
            RouteStop(recipient.name, "RECIPIENT", recipient.latitude, recipient.longitude),
        ],
        distance_km=round(total_distance, 2),
        travel_minutes=travel_minutes,
        remaining_usable_minutes=remaining_minutes,
        is_feasible=remaining_minutes >= travel_minutes,
        estimate_label="Estimated using straight-line distance and 25 km/h; no live traffic.",
    )