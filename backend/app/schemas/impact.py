from typing import Any

from pydantic import BaseModel


class ImpactMetric(BaseModel):
    value: int | float
    label: str


class ImpactResponse(BaseModel):
    meals_rescued: ImpactMetric
    donations_completed: ImpactMetric
    estimated_people_served: ImpactMetric
    expired_donations: ImpactMetric
    unmatched_donations: ImpactMetric
    weight_diverted_kg: ImpactMetric
    co2e_avoided_kg: ImpactMetric
    average_time_to_match_minutes: ImpactMetric
    average_pickup_minutes: ImpactMetric
    average_delivery_minutes: ImpactMetric
    average_rescue_completion_minutes: ImpactMetric
    successful_matches: ImpactMetric
    rescue_before_expiry_rate: ImpactMetric
    rescue_success_rate: ImpactMetric
    driver_utilization: ImpactMetric
    recipient_utilization: ImpactMetric
    funnel: dict[str, int]
    methodology: str


class AnalyticsResponse(ImpactResponse):
    rescue_trends: list[dict[str, Any]]
    food_categories: list[dict[str, Any]]
    recipient_demand: list[dict[str, Any]]
    geographic_distribution: list[dict[str, Any]]
    recent_activity: list[dict[str, Any]]
