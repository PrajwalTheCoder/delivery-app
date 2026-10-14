import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.db import Base

class RouteStop(Base):
    __tablename__ = "route_stops"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    route_plan_id = Column(String(36), ForeignKey("route_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    delivery_id = Column(String(36), ForeignKey("deliveries.id", ondelete="CASCADE"), nullable=False, index=True)
    stop_order = Column(Integer, nullable=False) # 1, 2, 3...
    estimated_arrival_seconds = Column(Float, nullable=True) # relative to route start
    leg_distance_meters = Column(Float, nullable=True, default=0.0)
    leg_duration_seconds = Column(Float, nullable=True, default=0.0)
    status = Column(String(20), nullable=False, default="pending") # pending, in_transit, delivered, failed
    failure_reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    route_plan = relationship("RoutePlan", back_populates="stops")
    delivery = relationship("Delivery", back_populates="route_stops")

    def to_dict(self):
        return {
            "id": self.id,
            "route_plan_id": self.route_plan_id,
            "delivery_id": self.delivery_id,
            "stop_order": self.stop_order,
            "estimated_arrival_seconds": self.estimated_arrival_seconds,
            "leg_distance_meters": self.leg_distance_meters,
            "leg_duration_seconds": self.leg_duration_seconds,
            "status": self.status,
            "failure_reason": self.failure_reason,
            "notes": self.notes,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "delivery": self.delivery.to_dict() if self.delivery else None
        }
