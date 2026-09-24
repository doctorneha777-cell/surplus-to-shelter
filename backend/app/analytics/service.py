from datetime import datetime, timezone

from datetime import date

from sqlalchemy.orm import Session

from app.models.domain import Driver, Donation, DonationStatus, ImpactRecord, PickupStatus, RecipientOrganization, SafetyWindowStatus, StatusEventType


ESTIMATED_KG_PER_SERVING = 0.35
ESTIMATED_CO2E_KG_PER_KG_FOOD = 2.5
CALCULATION_METHOD = "Estimated from servings x 0.35 kg/serving; CO2e uses 2.5 kg CO2e/kg rescued food; methodology v1."


def _utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def record_completed_impact(db: Session, donation: Donation) -> ImpactRecord | None:
    if donation.pickup is None or donation.status != DonationStatus.COMPLETED:
        return None
    existing = db.query(ImpactRecord).filter(ImpactRecord.donation_id == donation.id).first()
    if existing:
        return existing
    completed_at = donation.pickup.delivered_at or datetime.now(timezone.utc)
    weight = round(donation.servings * ESTIMATED_KG_PER_SERVING, 2)
    record = ImpactRecord(
        donation_id=donation.id,
        pickup_id=donation.pickup.id,
        meals_rescued=donation.servings,
        quantity=donation.quantity,
        quantity_unit=donation.unit,
        estimated_weight_kg=weight,
        estimated_people_served=donation.servings,
        estimated_co2e_kg=round(weight * ESTIMATED_CO2E_KG_PER_KG_FOOD, 2),
        completed_at=_utc(completed_at),
        calculation_method=CALCULATION_METHOD,
        is_estimated=True,
    )
    db.add(record)
    return record


def calculate_impact(db: Session, start_date: date | None = None, end_date: date | None = None) -> dict[str, object]:
    donations = db.query(Donation).all()
    for donation in donations:
        if donation.status == DonationStatus.COMPLETED:
            record_completed_impact(db, donation)
    db.flush()
    records = db.query(ImpactRecord).all()
    if start_date:
        records = [record for record in records if _utc(record.completed_at).date() >= start_date]
        donations = [donation for donation in donations if _utc(donation.created_at).date() >= start_date]
    if end_date:
        records = [record for record in records if _utc(record.completed_at).date() <= end_date]
        donations = [donation for donation in donations if _utc(donation.created_at).date() <= end_date]
    completed = [donation for donation in donations if donation.status == DonationStatus.COMPLETED]
    rescued_servings = sum(record.meals_rescued for record in records)
    matched_durations = []
    pickup_durations = []
    delivery_durations = []
    rescue_durations = []
    for donation in donations:
        events = {event.status: _utc(event.created_at) for event in donation.status_events}
        if StatusEventType.MATCHED in events and donation.created_at:
            matched_durations.append(max(0, (events[StatusEventType.MATCHED] - _utc(donation.created_at)).total_seconds() / 60))
        if StatusEventType.PICKED_UP in events and StatusEventType.DRIVER_ASSIGNED in events:
            pickup_durations.append(max(0, (events[StatusEventType.PICKED_UP] - events[StatusEventType.DRIVER_ASSIGNED]).total_seconds() / 60))
        if StatusEventType.DELIVERED in events and StatusEventType.PICKED_UP in events:
            delivery_durations.append(max(0, (events[StatusEventType.DELIVERED] - events[StatusEventType.PICKED_UP]).total_seconds() / 60))
        if StatusEventType.DELIVERED in events:
            rescue_durations.append(max(0, (events[StatusEventType.DELIVERED] - _utc(donation.created_at)).total_seconds() / 60))
    completed_before_expiry = sum(_utc(record.completed_at) <= _utc(record.donation.usable_until) for record in records if record.donation)
    matched = sum(StatusEventType.MATCHED in {event.status for event in donation.status_events} for donation in donations)
    assigned = sum(StatusEventType.DRIVER_ASSIGNED in {event.status for event in donation.status_events} for donation in donations)
    picked_up = sum(StatusEventType.PICKED_UP in {event.status for event in donation.status_events} for donation in donations)
    delivered = sum(StatusEventType.DELIVERED in {event.status for event in donation.status_events} for donation in donations)
    posted = len(donations)
    estimated_weight = round(sum(record.estimated_weight_kg for record in records), 2)
    return {
        "meals_rescued": {"value": rescued_servings, "label": "ACTUAL RECORDED"},
        "donations_completed": {"value": len(completed), "label": "ACTUAL RECORDED"},
        "expired_donations": {
            "value": sum(donation.safety_window_status == SafetyWindowStatus.EXPIRED for donation in donations),
            "label": "ACTUAL RECORDED",
        },
        "weight_diverted_kg": {"value": estimated_weight, "label": "ESTIMATED"},
        "estimated_people_served": {"value": sum(record.estimated_people_served for record in records), "label": "ESTIMATED"},
        "co2e_avoided_kg": {"value": round(sum(record.estimated_co2e_kg for record in records), 2), "label": "ESTIMATED"},
        "average_time_to_match_minutes": {
            "value": round(sum(matched_durations) / len(matched_durations), 1) if matched_durations else 0,
            "label": "ACTUAL RECORDED",
        },
        "average_pickup_minutes": {
            "value": round(sum(pickup_durations) / len(pickup_durations), 1) if pickup_durations else 0,
            "label": "ACTUAL RECORDED",
        },
        "average_delivery_minutes": {"value": round(sum(delivery_durations) / len(delivery_durations), 1) if delivery_durations else 0, "label": "ACTUAL RECORDED"},
        "average_rescue_completion_minutes": {"value": round(sum(rescue_durations) / len(rescue_durations), 1) if rescue_durations else 0, "label": "ACTUAL RECORDED"},
        "unmatched_donations": {"value": sum(donation.status == DonationStatus.POSTED and donation.pickup is None and donation.safety_window_status != SafetyWindowStatus.EXPIRED for donation in donations), "label": "ACTUAL RECORDED"},
        "successful_matches": {"value": matched, "label": "ACTUAL RECORDED"},
        "rescue_before_expiry_rate": {"value": round(completed_before_expiry / len(records) * 100, 1) if records else 0, "label": "ACTUAL RECORDED"},
        "rescue_success_rate": {"value": round(len(records) / max(posted - sum(donation.status == DonationStatus.CANCELLED for donation in donations), 1) * 100, 1), "label": "ACTUAL RECORDED"},
        "driver_utilization": {"value": round(assigned / max(db.query(Driver).count(), 1) * 100, 1), "label": "ACTUAL RECORDED"},
        "recipient_utilization": {"value": round(sum(record.meals_rescued for record in records) / max(sum(recipient.capacity for recipient in db.query(RecipientOrganization).all()), 1) * 100, 1), "label": "ACTUAL RECORDED"},
        "funnel": {"posted": posted, "matched": matched, "driver_assigned": assigned, "picked_up": picked_up, "delivered": delivered, "completed": len(records)},
        "methodology": CALCULATION_METHOD,
    }