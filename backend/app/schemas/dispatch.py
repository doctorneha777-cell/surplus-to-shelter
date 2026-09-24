from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.domain import DriverStatus, PickupStatus, StatusEventType


class DispatchRequest(BaseModel):
    recipient_id: int = Field(gt=0)


class DispatchResponse(BaseModel):
    pickup_id: int
    donation_id: int
    recipient_id: int
    driver_id: int
    driver_name: str
    eta_minutes: int
    distance_km: float
    score: float
    reasoning: str
    rejected_reasons: list[str]
    status: PickupStatus


class StatusUpdate(BaseModel):
    status: PickupStatus
    actor: str = Field(min_length=1, max_length=160)
    note: str | None = Field(default=None, max_length=500)


class CancellationRequest(BaseModel):
    actor: str = Field(min_length=1, max_length=160)
    reason: str | None = Field(default=None, max_length=500)


class StatusEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    pickup_id: int | None
    donation_id: int | None
    old_status: str | None
    new_status: str | None
    status: StatusEventType
    actor: str
    note: str | None
    created_at: datetime


class DriverRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str | None
    vehicle_type: str
    capacity: int
    latitude: float
    longitude: float
    availability: bool
    status: DriverStatus
    verified: bool
    created_at: datetime
    updated_at: datetime


class DriverUpdate(BaseModel):
    phone: str | None = Field(default=None, max_length=40)
    vehicle_type: str | None = Field(default=None, max_length=80)
    capacity: int | None = Field(default=None, ge=0)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    availability: bool | None = None
    status: DriverStatus | None = None
    verified: bool | None = None


class PickupRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    donation_id: int
    driver_id: int
    recipient_id: int
    assigned_at: datetime
    pickup_started_at: datetime | None
    picked_up_at: datetime | None
    delivery_started_at: datetime | None
    delivered_at: datetime | None
    status: PickupStatus
    estimated_arrival: datetime | None
    notes: str | None


class DispatchDashboardRead(PickupRead):
    donor_name: str
    donor_latitude: float
    donor_longitude: float
    recipient_name: str
    recipient_latitude: float
    recipient_longitude: float
    urgency: str
    food_type: str
    dietary_type: str | None
    servings: int
    distance_km: float
    travel_minutes: int
    remaining_usable_minutes: int
    route_feasible: bool
    pickup_instructions: str
    route_estimate_label: str
