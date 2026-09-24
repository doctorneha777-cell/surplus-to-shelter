from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.analytics.service import calculate_impact
from app.database import get_db
from app.models.domain import Donation, DonationStatus, ImpactRecord, RecipientOrganization
from app.schemas.impact import AnalyticsResponse, ImpactResponse

router = APIRouter(prefix="/impact", tags=["impact"])


@router.get("", response_model=ImpactResponse)
def get_impact(start_date: date | None = Query(default=None), end_date: date | None = Query(default=None), db: Session = Depends(get_db)) -> ImpactResponse:
    return calculate_impact(db, start_date, end_date)


@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(start_date: date | None = Query(default=None), end_date: date | None = Query(default=None), db: Session = Depends(get_db)) -> AnalyticsResponse:
    metrics = calculate_impact(db, start_date, end_date)
    donations = db.query(Donation).all()
    records = db.query(ImpactRecord).all()
    categories: dict[str, dict[str, float]] = {}
    for donation in donations:
        item = categories.setdefault(donation.food_type, {"donations": 0, "meals": 0, "completed": 0})
        item["donations"] += 1
        item["meals"] += donation.servings
        item["completed"] += donation.status == DonationStatus.COMPLETED
    recipients = db.query(RecipientOrganization).all()
    recipient_demand = [{"name": recipient.name, "current_need": recipient.current_need, "capacity": recipient.capacity, "fulfilled": sum(record.meals_rescued for record in records if record.donation.recipient_id == recipient.id)} for recipient in recipients]
    recent_activity = [{"donation_id": record.donation_id, "meals": record.meals_rescued, "completed_at": record.completed_at.isoformat()} for record in sorted(records, key=lambda item: item.completed_at, reverse=True)[:10]]
    metrics.update({
        "rescue_trends": [],
        "food_categories": [{"category": key, **value, "completion_rate": round(value["completed"] / value["donations"] * 100, 1) if value["donations"] else 0} for key, value in categories.items()],
        "recipient_demand": recipient_demand,
        "geographic_distribution": [],
        "recent_activity": recent_activity,
    })
    return metrics