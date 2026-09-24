from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum


class DemoStage(str, Enum):
    READY = "READY"
    DONATION_POSTED = "DONATION_POSTED"
    VALIDATION = "VALIDATION"
    MATCHING = "MATCHING"
    DRIVER_DISPATCH = "DRIVER_DISPATCH"
    ROUTE_READY = "ROUTE_READY"
    PICKUP_READY = "PICKUP_READY"
    DELIVERY_IN_PROGRESS = "DELIVERY_IN_PROGRESS"
    RESCUE_COMPLETED = "RESCUE_COMPLETED"


STAGE_SEQUENCE = [
    DemoStage.READY,
    DemoStage.DONATION_POSTED,
    DemoStage.VALIDATION,
    DemoStage.MATCHING,
    DemoStage.DRIVER_DISPATCH,
    DemoStage.ROUTE_READY,
    DemoStage.PICKUP_READY,
    DemoStage.DELIVERY_IN_PROGRESS,
    DemoStage.RESCUE_COMPLETED,
]


DEMO_SCENARIOS = {
    "successful": {
        "name": "Successful Rescue",
        "label": "SUCCESSFUL RESCUE",
        "donor_name": "Green Leaf Restaurant",
        "donor_location": "Demo Restaurant Location",
        "food_type": "vegetarian meals",
        "donation_quantity": 40,
        "servings": 40,
        "usable_minutes": 120,
        "recipient_name": "Sunrise Community Shelter",
        "recipient_capacity": 50,
        "recipient_need": 35,
        "driver_name": "Alex",
        "driver_vehicle": "Van",
        "driver_capacity": 60,
        "driver_available": True,
        "recipient_available": True,
        "donor_latitude": 12.971,
        "donor_longitude": 77.594,
        "recipient_latitude": 12.979,
        "recipient_longitude": 77.603,
        "driver_latitude": 12.965,
        "driver_longitude": 77.586,
        "expected_outcome": "RESCUE COMPLETED",
    },
    "infeasible": {
        "name": "No Feasible Rescue",
        "label": "NO FEASIBLE RESCUE",
        "donor_name": "Night Market Kitchen",
        "donor_location": "Low-capacity demo site",
        "food_type": "vegetarian meals",
        "donation_quantity": 40,
        "servings": 40,
        "usable_minutes": 90,
        "recipient_name": "Harbor Shelter",
        "recipient_capacity": 10,
        "recipient_need": 8,
        "driver_name": "Unavailable Driver",
        "driver_vehicle": "Truck",
        "driver_capacity": 10,
        "driver_available": False,
        "recipient_available": True,
        "donor_latitude": 12.971,
        "donor_longitude": 77.594,
        "recipient_latitude": 12.985,
        "recipient_longitude": 77.610,
        "driver_latitude": 12.960,
        "driver_longitude": 77.620,
        "expected_outcome": "NO FEASIBLE RESCUE",
    },
    "expiring": {
        "name": "Expiring Donation",
        "label": "URGENT",
        "donor_name": "City Pantry",
        "donor_location": "Time-sensitive donor site",
        "food_type": "vegetarian meals",
        "donation_quantity": 40,
        "servings": 40,
        "usable_minutes": 20,
        "recipient_name": "Riverside Shelter",
        "recipient_capacity": 45,
        "recipient_need": 35,
        "driver_name": "Alex",
        "driver_vehicle": "Van",
        "driver_capacity": 60,
        "driver_available": True,
        "recipient_available": True,
        "donor_latitude": 12.970,
        "donor_longitude": 77.595,
        "recipient_latitude": 12.978,
        "recipient_longitude": 77.604,
        "driver_latitude": 12.965,
        "driver_longitude": 77.588,
        "expected_outcome": "URGENT",
    },
}


@dataclass(frozen=True)
class DemoScenario:
    donor_name: str
    donor_location: str
    food_type: str
    donation_quantity: int
    servings: int
    usable_minutes: int
    recipient_name: str
    recipient_capacity: int
    recipient_need: int
    driver_name: str
    driver_vehicle: str
    driver_capacity: int
    donor_latitude: float
    donor_longitude: float
    recipient_latitude: float
    recipient_longitude: float
    driver_latitude: float
    driver_longitude: float


@dataclass
class DemoTimelineEvent:
    stage: DemoStage
    timestamp: str
    explanation: str


def build_demo_scenario(scenario_name: str = "successful") -> dict[str, object]:
    selected = DEMO_SCENARIOS.get(scenario_name, DEMO_SCENARIOS["successful"])
    return {
        **selected,
        "usable_minutes": selected["usable_minutes"],
        "servable_minutes": selected["usable_minutes"],
        "demo_mode": True,
        "synthetic_label": "DEMO DATA",
        "scenario_name": scenario_name,
    }


@dataclass
class DemoController:
    state: DemoStage = DemoStage.READY
    timeline: list[DemoTimelineEvent] = field(default_factory=list)
    scenario: dict[str, object] = field(default_factory=lambda: build_demo_scenario())
    stage_index: int = 0

    def reset(self) -> None:
        self.state = DemoStage.READY
        self.timeline = []
        self.stage_index = 0

    def start(self) -> None:
        self.reset()
        self.state = DemoStage.DONATION_POSTED
        self.stage_index = 1
        self.timeline.append(DemoTimelineEvent(
            stage=DemoStage.DONATION_POSTED,
            timestamp=datetime.now(timezone.utc).strftime("%H:%M:%S"),
            explanation="Donation posted using synthetic demo data."
        ))

    def advance(self) -> None:
        if self.state == DemoStage.READY:
            self.start()
            return
        if self.state == DemoStage.RESCUE_COMPLETED:
            return

        next_index = min(len(STAGE_SEQUENCE) - 1, self.stage_index + 1)
        self.state = STAGE_SEQUENCE[next_index]
        self.stage_index = next_index

        explanation_map = {
            DemoStage.DONATION_POSTED: "Donation posted and validated for the demo run.",
            DemoStage.VALIDATION: "Validation confirmed the donation still fits the usable window and recipient capacity.",
            DemoStage.MATCHING: "Recipient selection considers distance, urgency, capacity, and food fit.",
            DemoStage.DRIVER_DISPATCH: "Only drivers who can carry the donation and meet the window are considered.",
            DemoStage.ROUTE_READY: "The route checks donor-to-recipient feasibility against the usable window.",
            DemoStage.PICKUP_READY: "Driver is ready at the donor and pickup can proceed.",
            DemoStage.DELIVERY_IN_PROGRESS: "Delivery begins once the food has been picked up.",
            DemoStage.RESCUE_COMPLETED: "Impact is recorded after a successful delivery.",
        }

        self.timeline.append(DemoTimelineEvent(
            stage=self.state,
            timestamp=datetime.now(timezone.utc).strftime("%H:%M:%S"),
            explanation=explanation_map.get(self.state, "Demo step progressed."),
        ))

    def current_explanation(self) -> str:
        current = self.state
        if current == DemoStage.READY:
            return "Ready to start the synthetic rescue workflow."
        for event in reversed(self.timeline):
            if event.stage == current:
                return event.explanation
        return "Demo step is in progress."

    def progress_ratio(self) -> tuple[int, int]:
        total = len(STAGE_SEQUENCE) - 1
        current = min(self.stage_index, total)
        return current, total
