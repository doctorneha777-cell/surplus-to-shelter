from dataclasses import dataclass
from datetime import datetime, timezone
from math import asin, cos, radians, sin, sqrt

from app.models.domain import Donation, RecipientOrganization, RecipientUrgency


@dataclass(frozen=True)
class MatchingWeights:
    time: float = 0.25
    distance: float = 0.20
    quantity: float = 0.20
    urgency: float = 0.15
    food: float = 0.10
    dietary: float = 0.05
    semantic: float = 0.05


@dataclass(frozen=True)
class CandidateResult:
    recipient_id: int
    recipient_name: str
    overall_score: float
    distance_km: float
    reasons: list[str]
    components: dict[str, float]


@dataclass(frozen=True)
class RejectionResult:
    recipient_id: int
    recipient_name: str
    reason: str


def haversine_km(latitude_a: float, longitude_a: float, latitude_b: float, longitude_b: float) -> float:
    earth_radius_km = 6371.0
    latitude_delta = radians(latitude_b - latitude_a)
    longitude_delta = radians(longitude_b - longitude_a)
    value = sin(latitude_delta / 2) ** 2 + cos(radians(latitude_a)) * cos(radians(latitude_b)) * sin(longitude_delta / 2) ** 2
    return 2 * earth_radius_km * asin(sqrt(value))


def _tokens(value: str | None) -> set[str]:
    return {token.strip().lower() for token in (value or "").replace(";", ",").split(",") if token.strip()}


def _dietary_compatible(donation: Donation, recipient: RecipientOrganization) -> bool:
    restrictions = _tokens(recipient.dietary_restrictions)
    dietary_type = (donation.dietary_type or "").lower().strip()
    return not dietary_type or not restrictions or dietary_type in restrictions or "any" in restrictions


def _food_score(donation: Donation, recipient: RecipientOrganization) -> float:
    preferences = _tokens(recipient.food_preferences)
    if not preferences or "any" in preferences:
        return 1.0
    return 1.0 if donation.food_type.lower() in preferences else 0.0


def _urgency_score(urgency: RecipientUrgency) -> float:
    return {RecipientUrgency.HIGH: 1.0, RecipientUrgency.MEDIUM: 0.65, RecipientUrgency.LOW: 0.3}[urgency]


def run_matching(
    donation: Donation,
    recipients: list[RecipientOrganization],
    now: datetime | None = None,
    weights: MatchingWeights = MatchingWeights(),
) -> tuple[list[CandidateResult], list[RejectionResult]]:
    current_time = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    usable_until = donation.usable_until
    if usable_until.tzinfo is None:
        usable_until = usable_until.replace(tzinfo=timezone.utc)
    remaining_seconds = (usable_until - current_time).total_seconds()
    time_score = max(0.0, min(1.0, remaining_seconds / (6 * 60 * 60)))
    candidates: list[CandidateResult] = []
    rejected: list[RejectionResult] = []

    for recipient in recipients:
        reason = None
        if remaining_seconds <= 0:
            reason = "Donation is expired."
        elif not recipient.available:
            reason = "Recipient is currently unavailable."
        elif recipient.capacity < donation.servings:
            reason = f"Capacity is {recipient.capacity} servings, below the {donation.servings} required."
        elif not _dietary_compatible(donation, recipient):
            reason = "Recipient dietary restrictions are incompatible."
        if reason:
            rejected.append(RejectionResult(recipient.id, recipient.name, reason))
            continue

        distance = haversine_km(donation.latitude, donation.longitude, recipient.latitude, recipient.longitude)
        distance_score = max(0.0, min(1.0, 1.0 - distance / 20.0))
        quantity_score = max(0.0, min(1.0, recipient.current_need / max(donation.servings, 1)))
        food_score = _food_score(donation, recipient)
        dietary_score = 1.0
        overall_score = (
            weights.time * time_score
            + weights.distance * distance_score
            + weights.quantity * quantity_score
            + weights.urgency * _urgency_score(recipient.urgency)
            + weights.food * food_score
            + weights.dietary * dietary_score
        )
        reasons = [
            f"{distance:.1f} km away",
            f"Can accept {recipient.capacity} servings",
            f"{recipient.urgency.value} urgency",
            "Dietary requirements compatible",
            "Donor-reported usable window has not expired",
        ]
        candidates.append(
            CandidateResult(
                recipient.id,
                recipient.name,
                round(overall_score, 4),
                round(distance, 2),
                reasons,
                {
                    "time_score": round(time_score, 4),
                    "distance_score": round(distance_score, 4),
                    "quantity_score": round(quantity_score, 4),
                    "urgency_score": _urgency_score(recipient.urgency),
                    "food_score": food_score,
                    "dietary_score": dietary_score,
                    "semantic_score": semantic_score,
                },
            )
        )
    candidates.sort(key=lambda candidate: candidate.overall_score, reverse=True)
    return candidates, rejected