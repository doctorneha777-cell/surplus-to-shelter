from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import Boolean, Column, DateTime, Enum as SqlEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class DonationStatus(str, Enum):
    POSTED = "POSTED"
    MATCHED = "MATCHED"
    DRIVER_ASSIGNED = "DRIVER_ASSIGNED"
    PICKED_UP = "PICKED_UP"
    DELIVERED = "DELIVERED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class SafetyWindowStatus(str, Enum):
    SAFE_WINDOW_VALID = "SAFE_WINDOW_VALID"
    EXPIRY_WARNING = "EXPIRY_WARNING"
    EXPIRY_RISK = "EXPIRY_RISK"
    EXPIRED = "EXPIRED"
    MISSING_SAFETY_INFORMATION = "MISSING_SAFETY_INFORMATION"


class DriverStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    ASSIGNED = "ASSIGNED"
    EN_ROUTE_TO_DONOR = "EN_ROUTE_TO_DONOR"
    AT_DONOR = "AT_DONOR"
    PICKED_UP = "PICKED_UP"
    EN_ROUTE_TO_RECIPIENT = "EN_ROUTE_TO_RECIPIENT"
    EN_ROUTE_TO_SHELTER = "EN_ROUTE_TO_SHELTER"
    DELIVERED = "DELIVERED"
    OFFLINE = "OFFLINE"


class PickupStatus(str, Enum):
    POSTED = "POSTED"
    MATCHED = "MATCHED"
    DRIVER_ASSIGNED = "DRIVER_ASSIGNED"
    DRIVER_EN_ROUTE = "DRIVER_EN_ROUTE"
    PICKUP_READY = "PICKUP_READY"
    PICKED_UP = "PICKED_UP"
    DELIVERING = "DELIVERING"
    DELIVERED = "DELIVERED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class StatusEventType(str, Enum):
    POSTED = "POSTED"
    MATCHED = "MATCHED"
    DRIVER_ASSIGNED = "DRIVER_ASSIGNED"
    DRIVER_EN_ROUTE = "DRIVER_EN_ROUTE"
    PICKUP_READY = "PICKUP_READY"
    PICKED_UP = "PICKED_UP"
    DELIVERING = "DELIVERING"
    DELIVERED = "DELIVERED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class NotificationType(str, Enum):
    MATCH_FOUND = "MATCH_FOUND"
    MATCH_ACCEPTED = "MATCH_ACCEPTED"
    DRIVER_ASSIGNED = "DRIVER_ASSIGNED"
    DRIVER_ACCEPTED = "DRIVER_ACCEPTED"
    DRIVER_APPROACHING = "DRIVER_APPROACHING"
    PICKUP_COMPLETED = "PICKUP_COMPLETED"
    DELIVERY_STARTED = "DELIVERY_STARTED"
    DELIVERY_COMPLETED = "DELIVERY_COMPLETED"
    DRIVER_CANCELLED = "DRIVER_CANCELLED"
    REASSIGNMENT = "REASSIGNMENT"
    EXPIRY_WARNING = "EXPIRY_WARNING"
    MATCH_FAILED = "MATCH_FAILED"
    SYSTEM = "SYSTEM"


class NotificationPriority(str, Enum):
    INFO = "INFO"
    SUCCESS = "SUCCESS"
    WARNING = "WARNING"
    URGENT = "URGENT"


class RecipientUrgency(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class RecipientOrganization(Base):
    __tablename__ = "recipient_organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(160), nullable=False, index=True)
    capacity = Column(Integer, nullable=False, default=0)
    current_need = Column(Integer, nullable=False, default=0)
    food_preferences = Column(String(500), nullable=True)
    dietary_restrictions = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    operating_hours = Column(String(120), nullable=True)
    urgency = Column(SqlEnum(RecipientUrgency), nullable=False, default=RecipientUrgency.MEDIUM)
    available = Column(Boolean, nullable=False, default=True)
    verified = Column(Boolean, nullable=False, default=False)

    donations = relationship("Donation", back_populates="recipient")


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(160), nullable=False)
    phone = Column(String(40), nullable=True)
    vehicle_type = Column(String(80), nullable=False)
    capacity = Column(Integer, nullable=False, default=0)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    availability = Column(Boolean, nullable=False, default=True)
    status = Column(SqlEnum(DriverStatus), nullable=False, default=DriverStatus.AVAILABLE)
    verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    donations = relationship("Donation", back_populates="driver")
    pickups = relationship("Pickup", back_populates="driver")


class Donation(Base):
    __tablename__ = "donations"

    id = Column(Integer, primary_key=True, index=True)
    donor_name = Column(String(160), nullable=False)
    food_type = Column(String(80), nullable=False)
    description = Column(Text, nullable=True)
    quantity = Column(Integer, nullable=False)
    unit = Column(String(40), nullable=False)
    servings = Column(Integer, nullable=False)
    dietary_type = Column(String(80), nullable=True)
    allergens = Column(String(500), nullable=True)
    prepared_at = Column(DateTime(timezone=True), nullable=True)
    available_from = Column(DateTime(timezone=True), nullable=False)
    usable_until = Column(DateTime(timezone=True), nullable=False)
    storage_condition = Column(String(120), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(SqlEnum(DonationStatus), nullable=False, default=DonationStatus.POSTED)
    safety_window_status = Column(
        SqlEnum(SafetyWindowStatus),
        nullable=False,
        default=SafetyWindowStatus.MISSING_SAFETY_INFORMATION,
    )
    recipient_id = Column(ForeignKey("recipient_organizations.id"), nullable=True)
    driver_id = Column(ForeignKey("drivers.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    recipient = relationship("RecipientOrganization", back_populates="donations")
    driver = relationship("Driver", back_populates="donations")
    status_events = relationship("StatusEvent", back_populates="donation", order_by="StatusEvent.created_at")
    pickup = relationship("Pickup", back_populates="donation", uselist=False)


class Pickup(Base):
    __tablename__ = "pickups"

    id = Column(Integer, primary_key=True, index=True)
    donation_id = Column(ForeignKey("donations.id"), nullable=False, unique=True, index=True)
    driver_id = Column(ForeignKey("drivers.id"), nullable=False, index=True)
    recipient_id = Column(ForeignKey("recipient_organizations.id"), nullable=False, index=True)
    assigned_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    pickup_started_at = Column(DateTime(timezone=True), nullable=True)
    picked_up_at = Column(DateTime(timezone=True), nullable=True)
    delivery_started_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(SqlEnum(PickupStatus), nullable=False, default=PickupStatus.DRIVER_ASSIGNED)
    estimated_arrival = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)

    donation = relationship("Donation", back_populates="pickup")
    driver = relationship("Driver", back_populates="pickups")
    recipient = relationship("RecipientOrganization")
    status_events = relationship("StatusEvent", back_populates="pickup", order_by="StatusEvent.created_at")


class StatusEvent(Base):
    __tablename__ = "status_events"

    id = Column(Integer, primary_key=True, index=True)
    donation_id = Column(ForeignKey("donations.id"), nullable=True, index=True)
    pickup_id = Column(ForeignKey("pickups.id"), nullable=True, index=True)
    old_status = Column(String(40), nullable=True)
    new_status = Column(String(40), nullable=True)
    status = Column(SqlEnum(StatusEventType), nullable=False)
    actor = Column(String(160), nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    donation = relationship("Donation", back_populates="status_events")
    pickup = relationship("Pickup", back_populates="status_events")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_user_id = Column(Integer, nullable=True, index=True)
    pickup_id = Column(ForeignKey("pickups.id"), nullable=True, index=True)
    notification_type = Column(SqlEnum(NotificationType), nullable=False)
    title = Column(String(160), nullable=False, default="Notification")
    message = Column(String(500), nullable=False)
    recipient_role = Column(String(40), nullable=False)
    related_donation_id = Column(ForeignKey("donations.id"), nullable=True, index=True)
    related_match_id = Column(Integer, nullable=True, index=True)
    related_pickup_id = Column(ForeignKey("pickups.id"), nullable=True, index=True)
    priority = Column(SqlEnum(NotificationPriority), nullable=False, default=NotificationPriority.INFO)
    is_read = Column(Boolean, nullable=False, default=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    dedupe_key = Column(String(240), nullable=True, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    pickup = relationship("Pickup", foreign_keys=[pickup_id])


class ImpactRecord(Base):
    __tablename__ = "impact_records"

    id = Column(Integer, primary_key=True, index=True)
    donation_id = Column(ForeignKey("donations.id"), nullable=False, unique=True, index=True)
    pickup_id = Column(ForeignKey("pickups.id"), nullable=False, unique=True, index=True)
    meals_rescued = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)
    quantity_unit = Column(String(40), nullable=False)
    estimated_weight_kg = Column(Float, nullable=False)
    estimated_people_served = Column(Integer, nullable=False)
    estimated_co2e_kg = Column(Float, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=False)
    calculation_method = Column(String(500), nullable=False)
    is_estimated = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    donation = relationship("Donation")
    pickup = relationship("Pickup")
