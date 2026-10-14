import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.db import Base

class RouteResult(Base):
    __tablename__ = "route_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    route_plan_id = Column(String(36), ForeignKey("route_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    algorithm = Column(String(50), nullable=False)
    total_distance_meters = Column(Float, nullable=False)
    estimated_duration_seconds = Column(Float, nullable=False)
    execution_time_ms = Column(Float, nullable=False)
    result_metadata = Column(Text, nullable=True) # JSON string
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    route_plan = relationship("RoutePlan", back_populates="results")

    def to_dict(self):
        metadata_dict = {}
        if self.result_metadata:
            try:
                metadata_dict = json.loads(self.result_metadata)
            except Exception:
                metadata_dict = {"raw": self.result_metadata}
        return {
            "id": self.id,
            "route_plan_id": self.route_plan_id,
            "algorithm": self.algorithm,
            "total_distance_meters": self.total_distance_meters,
            "estimated_duration_seconds": self.estimated_duration_seconds,
            "execution_time_ms": self.execution_time_ms,
            "result_metadata": metadata_dict,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
