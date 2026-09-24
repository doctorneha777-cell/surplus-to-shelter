from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.matching.service import run_matching
from app.models.domain import Donation, RecipientOrganization
from app.schemas.matching import MatchingResponse
from app.services.notification_service import notify_match_failed, notify_match_found

router = APIRouter(prefix="/matching", tags=["matching"])


@router.post("/run/{donation_id}", response_model=MatchingResponse)
def match_donation(donation_id: int, db: Session = Depends(get_db)) -> MatchingResponse:
    donation = db.get(Donation, donation_id)
    if donation is None:
        raise HTTPException(status_code=404, detail="Donation not found")
    candidates, rejected = run_matching(donation, db.query(RecipientOrganization).all())
    if candidates:
        notify_match_found(db, donation.id, candidates[0].recipient_name)
    else:
        notify_match_failed(db, donation.id)
    db.commit()
    return MatchingResponse(
        donation_id=donation.id,
        candidates=[candidate.__dict__ for candidate in candidates],
        rejected=[rejection.__dict__ for rejection in rejected],
    )