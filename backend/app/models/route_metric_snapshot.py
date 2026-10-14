import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.db import Base

class RouteMetricSnapshot(Base):
    __tablename__ = "route_metric_snapshots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    route_plan_id = Column(String(36), ForeignKey("route_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    algorithm = Column(String(50), nullable=False)
    baseline_distance_meters = Column(Float, nullable=False, default=0.0)
    optimized_distance_meters = Column(Float, nullable=False, default=0.0)
    distance_saved_meters = Column(Float, nullable=False, default=0.0)
    savings_percentage = Column(Float, nullable=False, default=0.0)
    baseline_duration_seconds = Column(Float, nullable=False, default=0.0)
    optimized_duration_seconds = Column(Float, nullable=False, default=0.0)
    duration_saved_seconds = Column(Float, nullable=False, default=0.0)
    execution_time_ms = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    route_plan = relationship("RoutePlan", back_populates="metric_snapshots")

    def to_dict(self):
        return {
            "id": self.id,
            "route_plan_id": self.route_plan_id,
            "algorithm": self.algorithm,
            "baseline_distance_meters": self.baseline_distance_meters,
            "optimized_distance_meters": self.optimized_distance_meters,
            "distance_saved_meters": self.distance_saved_meters,
            "savings_percentage": self.savings_percentage,
            "baseline_duration_seconds": self.baseline_duration_seconds,
            "optimized_duration_seconds": self.optimized_duration_seconds,
            "duration_saved_seconds": self.duration_saved_seconds,
            "execution_time_ms": self.execution_time_ms,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
