from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.domain import DriverStatus, RecipientUrgency


class RecipientCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    capacity: int = Field(ge=0)
    current_need: int = Field(ge=0)
    food_preferences: str | None = Field(default=None, max_length=500)
    dietary_restrictions: str | None = Field(default=None, max_length=500)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    operating_hours: str | None = Field(default=None, max_length=120)
    urgency: RecipientUrgency = RecipientUrgency.MEDIUM
    available: bool = True
    verified: bool = False


class RecipientRead(RecipientCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int


class DriverCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    phone: str | None = Field(default=None, max_length=40)
    vehicle_type: str = Field(min_length=1, max_length=80)
    capacity: int = Field(ge=0)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    availability: bool = True
    status: DriverStatus = DriverStatus.AVAILABLE
    verified: bool = False


class DriverRead(DriverCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
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