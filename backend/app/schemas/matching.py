from pydantic import BaseModel


class MatchCandidate(BaseModel):
    recipient_id: int
    recipient_name: str
    overall_score: float
    distance_km: float
    reasons: list[str]
    components: dict[str, float]


class MatchRejection(BaseModel):
    recipient_id: int
    recipient_name: str
    reason: str


class MatchingResponse(BaseModel):
    donation_id: int
    candidates: list[MatchCandidate]
    rejected: list[MatchRejection]