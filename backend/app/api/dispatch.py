from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.domain import Donation, Pickup
from app.routing.service import build_route
from app.schemas.dispatch import CancellationRequest, DispatchDashboardRead, DispatchRequest, DispatchResponse, PickupRead, StatusEventRead, StatusUpdate
from app.services.dispatch_service import assign_driver, cancel_and_reassign, update_status

router = APIRouter(tags=["dispatch"])


@router.post("/dispatch/{donation_id}", response_model=DispatchResponse)
def dispatch_donation(donation_id: int, payload: DispatchRequest, db: Session = Depends(get_db)) -> DispatchResponse:
    donation = db.get(Donation, donation_id)
    if donation is None:
        raise HTTPException(status_code=404, detail="Donation not found")
    pickup, candidate, rejected = assign_driver(db, donation, payload.recipient_id)
    return DispatchResponse(
        pickup_id=pickup.id,
        donation_id=donation.id,
        recipient_id=payload.recipient_id,
        driver_id=candidate.driver.id,
        driver_name=candidate.driver.name,
        eta_minutes=candidate.route.travel_minutes,
        distance_km=candidate.route.distance_km,
        score=candidate.score,
        reasoning=candidate.reason,
        rejected_reasons=rejected,
        status=pickup.status,
    )


@router.patch("/pickups/{pickup_id}/status", response_model=StatusEventRead)
def change_status(pickup_id: int, payload: StatusUpdate, db: Session = Depends(get_db)) -> StatusEventRead:
    pickup = db.get(Pickup, pickup_id)
    if pickup is None:
        raise HTTPException(status_code=404, detail="Pickup not found")
    return update_status(db, pickup, payload.status, payload.actor, payload.note)


@router.get("/pickups/{pickup_id}/timeline", response_model=list[StatusEventRead])
def pickup_timeline(pickup_id: int, db: Session = Depends(get_db)) -> list[StatusEventRead]:
    pickup = db.get(Pickup, pickup_id)
    if pickup is None:
        raise HTTPException(status_code=404, detail="Pickup not found")
    return pickup.status_events


@router.get("/dispatch/{donation_id}", response_model=DispatchDashboardRead)
def get_dispatch(donation_id: int, db: Session = Depends(get_db)) -> DispatchDashboardRead:
    pickup = db.query(Pickup).filter(Pickup.donation_id == donation_id).order_by(Pickup.assigned_at.desc()).first()
    if pickup is None:
        raise HTTPException(status_code=404, detail="Pickup not found")
    route = build_route(pickup.donation)
    donation = pickup.donation
    recipient = pickup.recipient
    return DispatchDashboardRead(
        **PickupRead.model_validate(pickup).model_dump(),
        donor_name=donation.donor_name,
        donor_latitude=donation.latitude,
        donor_longitude=donation.longitude,
        recipient_name=recipient.name,
        recipient_latitude=recipient.latitude,
        recipient_longitude=recipient.longitude,
        urgency=recipient.urgency.value,
        food_type=donation.food_type,
        dietary_type=donation.dietary_type,
        servings=donation.servings,
        distance_km=route.distance_km,
        travel_minutes=route.travel_minutes,
        remaining_usable_minutes=route.remaining_usable_minutes,
        route_feasible=route.is_feasible,
        pickup_instructions=pickup.notes or "Confirm the meal count and storage condition with the donor.",
        route_estimate_label=route.estimate_label,
    )


@router.post("/pickups/{pickup_id}/cancel", response_model=PickupRead)
def cancel_pickup(pickup_id: int, payload: CancellationRequest, db: Session = Depends(get_db)) -> Pickup:
    pickup = db.get(Pickup, pickup_id)
    if pickup is None:
        raise HTTPException(status_code=404, detail="Pickup not found")
    reassigned, _, _ = cancel_and_reassign(db, pickup, payload.actor, payload.reason)
    return reassigned


