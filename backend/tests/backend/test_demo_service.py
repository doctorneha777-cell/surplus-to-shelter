from datetime import datetime, timedelta, timezone

from app.services.demo_service import DemoController, DemoStage, build_demo_scenario


def test_demo_scenario_has_expected_values():
    scenario = build_demo_scenario()
    assert scenario["donor_name"] == "Green Leaf Restaurant"
    assert scenario["food_type"] == "vegetarian meals"
    assert scenario["recipient_name"] == "Sunrise Community Shelter"
    assert scenario["driver_name"] == "Alex"
    assert scenario["driver_vehicle"] == "Van"
    assert scenario["servable_minutes"] == 120


def test_demo_controller_transitions_steps():
    controller = DemoController()
    assert controller.state == DemoStage.READY
    controller.start()
    assert controller.state == DemoStage.DONATION_POSTED
    controller.advance()
    assert controller.state == DemoStage.VALIDATION
    controller.advance()
    assert controller.state == DemoStage.MATCHING
    controller.advance()
    assert controller.state == DemoStage.DRIVER_DISPATCH
    controller.advance()
    assert controller.state == DemoStage.ROUTE_READY
    controller.advance()
    assert controller.state == DemoStage.PICKUP_READY
    controller.advance()
    assert controller.state == DemoStage.DELIVERY_IN_PROGRESS
    controller.advance()
    assert controller.state == DemoStage.RESCUE_COMPLETED


def test_demo_controller_reset_clears_session():
    controller = DemoController()
    controller.start()
    controller.advance()
    controller.reset()
    assert controller.state == DemoStage.READY
    assert controller.timeline == []
