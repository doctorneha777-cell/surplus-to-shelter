from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.domain import Donation
from app.schemas.donation import DonationCreate, DonationRead
from app.services.donation_service import build_donation

router = APIRouter(prefix="/donations", tags=["donations"])


@router.post("", response_model=DonationRead, status_code=status.HTTP_201_CREATED)
def create_donation(payload: DonationCreate, db: Session = Depends(get_db)) -> Donation:
    donation = build_donation(payload)
    db.add(donation)
    db.commit()
    db.refresh(donation)
    return donation


@router.get("", response_model=list[DonationRead])
def list_donations(db: Session = Depends(get_db)) -> list[Donation]:
    return db.query(Donation).order_by(Donation.created_at.desc()).all()