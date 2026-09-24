from pydantic import BaseModel


class RouteStopRead(BaseModel):
    name: str
    role: str
    latitude: float
    longitude: float


class RouteRead(BaseModel):
    donation_id: int
    stops: list[RouteStopRead]
    distance_km: float
    travel_minutes: int
    remaining_usable_minutes: int
    is_feasible: bool
    estimate_label: str