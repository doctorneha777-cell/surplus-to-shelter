from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.domain import Donation
from app.routing.service import build_route
from app.schemas.routing import RouteRead

router = APIRouter(prefix="/routes", tags=["routing"])


@router.get("/{donation_id}", response_model=RouteRead)
def get_route(donation_id: int, db: Session = Depends(get_db)) -> RouteRead:
    donation = db.get(Donation, donation_id)
    if donation is None:
        raise HTTPException(status_code=404, detail="Donation not found")
    return build_route(donation)