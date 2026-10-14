import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Text
from sqlalchemy.orm import relationship
from app.database.db import Base

class RoutePlan(Base):
    __tablename__ = "route_plans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    start_address = Column(String(255), nullable=False)
    start_latitude = Column(Float, nullable=False)
    start_longitude = Column(Float, nullable=False)
    destination_policy = Column(String(30), nullable=False, default="return_to_depot") # return_to_depot, open_route
    optimization_objective = Column(String(20), nullable=False, default="distance") # distance, duration
    algorithm = Column(String(50), nullable=False, default="nearest_neighbor_2opt")
    total_distance_meters = Column(Float, nullable=False, default=0.0)
    estimated_duration_seconds = Column(Float, nullable=False, default=0.0)
    baseline_distance_meters = Column(Float, nullable=False, default=0.0)
    baseline_duration_seconds = Column(Float, nullable=False, default=0.0)
    distance_saved_meters = Column(Float, nullable=False, default=0.0)
    duration_saved_seconds = Column(Float, nullable=False, default=0.0)
    savings_percentage = Column(Float, nullable=False, default=0.0)
    original_sequence_json = Column(Text, nullable=True)
    optimized_sequence_json = Column(Text, nullable=True)
    route_geometry_json = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="planned") # planned, in_transit, completed, cancelled
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    stops = relationship("RouteStop", back_populates="route_plan", cascade="all, delete-orphan", order_by="RouteStop.stop_order")
    results = relationship("RouteResult", back_populates="route_plan", cascade="all, delete-orphan")
    metric_snapshots = relationship("RouteMetricSnapshot", back_populates="route_plan", cascade="all, delete-orphan")
    status_events = relationship("DeliveryStatusEvent", back_populates="route_plan")

    def to_dict(self):
        original_seq = []
        optimized_seq = []
        geometry = []
        if self.original_sequence_json:
            try:
                original_seq = json.loads(self.original_sequence_json)
            except Exception:
                pass
        if self.optimized_sequence_json:
            try:
                optimized_seq = json.loads(self.optimized_sequence_json)
            except Exception:
                pass
        if self.route_geometry_json:
            try:
                geometry = json.loads(self.route_geometry_json)
            except Exception:
                pass

        return {
            "id": self.id,
            "name": self.name,
            "start_address": self.start_address,
            "start_latitude": self.start_latitude,
            "start_longitude": self.start_longitude,
            "destination_policy": self.destination_policy,
            "optimization_objective": self.optimization_objective,
            "algorithm": self.algorithm,
            "total_distance_meters": self.total_distance_meters,
            "estimated_duration_seconds": self.estimated_duration_seconds,
            "baseline_distance_meters": self.baseline_distance_meters,
            "baseline_duration_seconds": self.baseline_duration_seconds,
            "distance_saved_meters": self.distance_saved_meters,
            "duration_saved_seconds": self.duration_saved_seconds,
            "savings_percentage": self.savings_percentage,
            "original_sequence": original_seq,
            "optimized_sequence": optimized_seq,
            "route_geometry": geometry,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "stops": [stop.to_dict() for stop in self.stops],
            "results": [res.to_dict() for res in self.results],
            "metric_snapshots": [s.to_dict() for s in self.metric_snapshots]
        }
