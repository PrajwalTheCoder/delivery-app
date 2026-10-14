from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.delivery import Delivery
from app.models.delivery_status_event import DeliveryStatusEvent

# Built-in realistic demo deliveries for Navi Mumbai (recommended demonstration region)
# with authentic localities, coordinates, customer labels, packages and time windows
DEMO_DELIVERIES: List[Dict[str, Any]] = [
    {
        "customer_label": "Aarav Sharma (Utsav Chowk)",
        "address": "Sector 7, Kharghar, Navi Mumbai, Maharashtra 410210",
        "latitude": 19.0345,
        "longitude": 73.0678,
        "contact": "+91 98201 12345",
        "description": "Lunch Meal Box: 2x Thali, 1x Gulab Jamun",
        "priority": "high",
        "package_weight_kg": 1.8,
        "time_window_start": "12:00",
        "time_window_end": "13:30",
        "service_duration_minutes": 10,
        "geocoding_confidence": "high",
        "notes": "Call customer on arrival at gate 3",
        "status": "pending"
    },
    {
        "customer_label": "Priya Nair (Vashi Plaza)",
        "address": "Sector 17 Commercial Complex, Vashi, Navi Mumbai 400703",
        "latitude": 19.0760,
        "longitude": 72.9986,
        "contact": "+91 98765 43210",
        "description": "Urgent Medical & Pharmacy Delivery, Handle with care",
        "priority": "urgent",
        "package_weight_kg": 0.8,
        "time_window_start": "11:00",
        "time_window_end": "12:30",
        "service_duration_minutes": 8,
        "geocoding_confidence": "high",
        "notes": "Deliver directly to 2nd floor reception",
        "status": "pending"
    },
    {
        "customer_label": "Rohan Deshmukh (CBD Belapur)",
        "address": "Sector 11, CBD Belapur Station Road, Navi Mumbai 400614",
        "latitude": 19.0183,
        "longitude": 73.0392,
        "contact": "+91 98111 22334",
        "description": "Corporate catering hamper for team lunch",
        "priority": "normal",
        "package_weight_kg": 4.5,
        "time_window_start": "12:30",
        "time_window_end": "14:00",
        "service_duration_minutes": 15,
        "geocoding_confidence": "high",
        "notes": "Security clearance required at main lobby",
        "status": "pending"
    },
    {
        "customer_label": "Sneha Kulkarni (Seawoods Mall)",
        "address": "Grand Central Complex, Sector 40, Seawoods, Navi Mumbai 400706",
        "latitude": 19.0219,
        "longitude": 73.0182,
        "contact": "+91 97654 32198",
        "description": "Bakery basket, cold brew coffee bottles",
        "priority": "normal",
        "package_weight_kg": 2.2,
        "time_window_start": "13:00",
        "time_window_end": "15:00",
        "service_duration_minutes": 10,
        "geocoding_confidence": "high",
        "notes": "Keep upright, fragile packaging",
        "status": "pending"
    },
    {
        "customer_label": "Vikram Mehta (Nerul Gymkhana)",
        "address": "Sector 28, Nerul West, Navi Mumbai 400706",
        "latitude": 19.0330,
        "longitude": 73.0135,
        "contact": "+91 98333 44556",
        "description": "Sports nutrition and recovery kit",
        "priority": "low",
        "package_weight_kg": 3.0,
        "time_window_start": "14:00",
        "time_window_end": "17:00",
        "service_duration_minutes": 10,
        "geocoding_confidence": "high",
        "notes": "Leave with clubhouse front desk if unreachable",
        "status": "pending"
    },
    {
        "customer_label": "Ananya Joshi (Kopar Khairane)",
        "address": "Sector 15, Kopar Khairane, Navi Mumbai 400709",
        "latitude": 19.0987,
        "longitude": 73.0076,
        "contact": "+91 98444 55667",
        "description": "Artisan desserts and assorted snack boxes",
        "priority": "normal",
        "package_weight_kg": 1.5,
        "time_window_start": "14:30",
        "time_window_end": "16:30",
        "service_duration_minutes": 8,
        "geocoding_confidence": "high",
        "notes": "Ring doorbell twice",
        "status": "pending"
    }
]

class DeliveryService:
    @staticmethod
    def get_all(
        db: Session,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Delivery]:
        query = db.query(Delivery)
        if status and status != "all":
            query = query.filter(Delivery.status == status)
        if priority and priority != "all":
            query = query.filter(Delivery.priority == priority)
        if search:
            s = f"%{search.strip()}%"
            query = query.filter(
                (Delivery.customer_label.ilike(s)) |
                (Delivery.address.ilike(s)) |
                (Delivery.description.ilike(s)) |
                (Delivery.notes.ilike(s))
            )
        return query.order_by(Delivery.created_at.desc()).all()

    @staticmethod
    def get_by_id(db: Session, delivery_id: str) -> Optional[Delivery]:
        return db.query(Delivery).filter(Delivery.id == delivery_id).first()

    @staticmethod
    def create(db: Session, data: Dict[str, Any]) -> Delivery:
        delivery = Delivery(
            customer_label=data.get("customer_label", "Customer"),
            address=data.get("address", ""),
            latitude=float(data["latitude"]),
            longitude=float(data["longitude"]),
            contact=data.get("contact"),
            description=data.get("description"),
            priority=data.get("priority", "normal"),
            status=data.get("status", "pending"),
            package_weight_kg=float(data.get("package_weight_kg", 1.0)),
            time_window_start=data.get("time_window_start"),
            time_window_end=data.get("time_window_end"),
            service_duration_minutes=int(data.get("service_duration_minutes", 10)),
            geocoding_confidence=data.get("geocoding_confidence", "high"),
            notes=data.get("notes")
        )
        db.add(delivery)
        db.flush()

        # Log creation event
        event = DeliveryStatusEvent(
            delivery_id=delivery.id,
            previous_status=None,
            new_status=delivery.status,
            reason="Order created"
        )
        db.add(event)
        db.commit()
        db.refresh(delivery)
        return delivery

    @staticmethod
    def update(db: Session, delivery_id: str, data: Dict[str, Any]) -> Optional[Delivery]:
        delivery = DeliveryService.get_by_id(db, delivery_id)
        if not delivery:
            return None

        prev_status = delivery.status

        for field in [
            "customer_label", "address", "contact", "description",
            "priority", "time_window_start", "time_window_end", "notes",
            "geocoding_confidence"
        ]:
            if field in data and data[field] is not None:
                setattr(delivery, field, data[field])

        if "latitude" in data and data["latitude"] is not None:
            delivery.latitude = float(data["latitude"])
        if "longitude" in data and data["longitude"] is not None:
            delivery.longitude = float(data["longitude"])
        if "package_weight_kg" in data and data["package_weight_kg"] is not None:
            delivery.package_weight_kg = float(data["package_weight_kg"])
        if "service_duration_minutes" in data and data["service_duration_minutes"] is not None:
            delivery.service_duration_minutes = int(data["service_duration_minutes"])

        if "status" in data and data["status"] and data["status"] != prev_status:
            delivery.status = data["status"]
            if data["status"] == "delivered" and not delivery.completed_at:
                delivery.completed_at = datetime.now(timezone.utc)

            event = DeliveryStatusEvent(
                delivery_id=delivery.id,
                previous_status=prev_status,
                new_status=delivery.status,
                reason=data.get("status_reason", "Status update requested")
            )
            db.add(event)

        db.commit()
        db.refresh(delivery)
        return delivery

    @staticmethod
    def delete(db: Session, delivery_id: str) -> bool:
        delivery = DeliveryService.get_by_id(db, delivery_id)
        if not delivery:
            return False
        db.delete(delivery)
        db.commit()
        return True

    @staticmethod
    def seed_demo_data(db: Session) -> List[Delivery]:
        """Loads realistic demo deliveries for Navi Mumbai without duplicating existing ones."""
        created = []
        for item in DEMO_DELIVERIES:
            existing = db.query(Delivery).filter(
                Delivery.customer_label == item["customer_label"],
                Delivery.address == item["address"]
            ).first()
            if not existing:
                d = Delivery(**item)
                db.add(d)
                created.append(d)
        db.commit()
        for d in created:
            db.refresh(d)
        return created

    @staticmethod
    def clear_demo_data(db: Session) -> int:
        """Removes demo deliveries and associated stops for clean presentation reset."""
        labels = [item["customer_label"] for item in DEMO_DELIVERIES]
        count = db.query(Delivery).filter(Delivery.customer_label.in_(labels)).delete(synchronize_session=False)
        db.commit()
        return count
