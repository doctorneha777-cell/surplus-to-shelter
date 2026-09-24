from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.domain import DonationStatus, SafetyWindowStatus


class DonationCreate(BaseModel):
    donor_name: str = Field(min_length=1, max_length=160)
    food_type: str = Field(min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=2000)
    quantity: int = Field(gt=0)
    unit: str = Field(min_length=1, max_length=40)
    servings: int = Field(gt=0)
    dietary_type: str | None = Field(default=None, max_length=80)
    allergens: str | None = Field(default=None, max_length=500)
    prepared_at: datetime | None = None
    available_from: datetime
    usable_until: datetime
    storage_condition: str = Field(min_length=1, max_length=120)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class DonationRead(DonationCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: DonationStatus
    safety_window_status: SafetyWindowStatus
    recipient_id: int | None
    driver_id: int | None
    created_at: datetime