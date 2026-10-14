import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.db import Base

class DeliveryStatusEvent(Base):
    __tablename__ = "delivery_status_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    delivery_id = Column(String(36), ForeignKey("deliveries.id", ondelete="CASCADE"), nullable=False, index=True)
    route_plan_id = Column(String(36), ForeignKey("route_plans.id", ondelete="SET NULL"), nullable=True, index=True)
    previous_status = Column(String(30), nullable=True)
    new_status = Column(String(30), nullable=False)
    reason = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    delivery = relationship("Delivery", back_populates="status_events")
    route_plan = relationship("RoutePlan", back_populates="status_events")

    def to_dict(self):
        return {
            "id": self.id,
            "delivery_id": self.delivery_id,
            "route_plan_id": self.route_plan_id,
            "previous_status": self.previous_status,
            "new_status": self.new_status,
            "reason": self.reason,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }
