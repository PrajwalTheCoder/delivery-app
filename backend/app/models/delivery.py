import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Text
from sqlalchemy.orm import relationship
from app.database.db import Base

class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_label = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    contact = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    priority = Column(String(20), nullable=False, default="normal")  # low, normal, high, urgent
    status = Column(String(20), nullable=False, default="pending")   # pending, planned, in_transit, delivered, failed, cancelled
    geocoding_confidence = Column(String(30), nullable=True, default="high") # high, medium, verified, exact
    package_weight_kg = Column(Float, nullable=True, default=1.0)
    time_window_start = Column(String(10), nullable=True) # e.g. "09:00"
    time_window_end = Column(String(10), nullable=True)   # e.g. "13:00"
    service_duration_minutes = Column(Integer, nullable=False, default=10)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)

    route_stops = relationship("RouteStop", back_populates="delivery", cascade="all, delete-orphan")
    status_events = relationship("DeliveryStatusEvent", back_populates="delivery", cascade="all, delete-orphan", order_by="DeliveryStatusEvent.timestamp.desc()")

    def to_dict(self):
        return {
            "id": self.id,
            "customer_label": self.customer_label,
            "address": self.address,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "contact": self.contact,
            "description": self.description,
            "priority": self.priority,
            "status": self.status,
            "geocoding_confidence": self.geocoding_confidence,
            "package_weight_kg": self.package_weight_kg,
            "time_window_start": self.time_window_start,
            "time_window_end": self.time_window_end,
            "service_duration_minutes": self.service_duration_minutes,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }
