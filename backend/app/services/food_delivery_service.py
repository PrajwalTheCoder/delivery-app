import time
import socket
import random
import uuid
from typing import List, Dict, Any, Optional
from app.services.routing_service import RoutingService
from app.utils.geo import haversine_distance

# Real curated restaurants in Indian Metro region (Navi Mumbai / Mumbai)
REAL_RESTAURANTS: List[Dict[str, Any]] = [
    {
        "id": "rest-behrouz-kharghar",
        "name": "Behrouz Biryani",
        "tagline": "Royal & Authentic Dum Biryani",
        "cuisines": ["Biryani", "North Indian", "Mughlai", "Desserts"],
        "rating": 4.6,
        "rating_count": "1.8K+",
        "cost_for_two": 450,
        "prep_time_minutes": 18,
        "is_veg": False,
        "address": "Shop 4, Crystal Plaza, Sector 7, Kharghar, Navi Mumbai 410210",
        "locality": "Sector 7, Kharghar",
        "city": "Navi Mumbai",
        "latitude": 19.0358,
        "longitude": 73.0674,
        "phone": "+91 22 6876 2100",
        "image": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
        "badge": "Bestseller",
        "discount": "20% OFF UPTO ₹100",
        "menu": [
            {
                "id": "item-bb-1",
                "name": "Dum Gosht Biryani (Mutton)",
                "category": "Biryani",
                "price": 499,
                "is_veg": False,
                "rating": 4.7,
                "description": "Tender pieces of mutton slow cooked with aromatic long-grain Basmati rice, saffron, and royal spices.",
                "image": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80",
                "bestseller": True
            },
            {
                "id": "item-bb-2",
                "name": "Subz-e-Biryani (Veg Dum)",
                "category": "Biryani",
                "price": 349,
                "is_veg": True,
                "rating": 4.5,
                "description": "Fresh seasonal vegetables, paneer cubes, and basmati rice infused with whole cardamom and rose water.",
                "image": "https://images.unsplash.com/photo-1642821373181-696a54913e93?w=500&auto=format&fit=crop&q=80",
                "bestseller": True
            },
            {
                "id": "item-bb-3",
                "name": "Murgh Tikka Kebab (6 Pcs)",
                "category": "Starters",
                "price": 329,
                "is_veg": False,
                "rating": 4.6,
                "description": "Succulent chicken thigh marinated in smoky tandoori spices and char-grilled to perfection.",
                "image": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80",
                "bestseller": False
            },
            {
                "id": "item-bb-4",
                "name": "Gulab Jamun with Rabdi",
                "category": "Desserts",
                "price": 149,
                "is_veg": True,
                "rating": 4.8,
                "description": "Warm melt-in-mouth gulab jamuns served on a bed of thick saffron infused rabdi.",
                "image": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80",
                "bestseller": True
            }
        ]
    },
    {
        "id": "rest-dominos-vashi",
        "name": "Domino's Pizza",
        "tagline": "Hot & Fresh Hand Tossed Pizzas",
        "cuisines": ["Pizza", "Italian", "Fast Food", "Garlic Bread"],
        "rating": 4.4,
        "rating_count": "3.4K+",
        "cost_for_two": 400,
        "prep_time_minutes": 15,
        "is_veg": False,
        "address": "Plot 12, Sector 17 Commercial Area, Vashi, Navi Mumbai 400703",
        "locality": "Sector 17, Vashi",
        "city": "Navi Mumbai",
        "latitude": 19.0765,
        "longitude": 72.9992,
        "phone": "+91 22 2789 5500",
        "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
        "badge": "Super Fast 20m",
        "discount": "₹125 OFF ON ₹399",
        "menu": [
            {
                "id": "item-dom-1",
                "name": "Farmhouse Pizza (Medium)",
                "category": "Pizzas",
                "price": 429,
                "is_veg": True,
                "rating": 4.6,
                "description": "Delightful combination of onion, crisp capsicum, grilled mushroom, and fresh juicy tomatoes.",
                "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
                "bestseller": True
            },
            {
                "id": "item-dom-2",
                "name": "Non-Veg Supreme Pizza (Medium)",
                "category": "Pizzas",
                "price": 549,
                "is_veg": False,
                "rating": 4.7,
                "description": "Black olives, grilled chicken breast, peri-peri chicken, and gooey mozzarella cheese.",
                "image": "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500&auto=format&fit=crop&q=80",
                "bestseller": True
            },
            {
                "id": "item-dom-3",
                "name": "Stuffed Garlic Breadsticks",
                "category": "Sides",
                "price": 169,
                "is_veg": True,
                "rating": 4.8,
                "description": "Freshly baked garlic bread stuffed with creamy jalapeño cheese dip and sweet corn.",
                "image": "https://images.unsplash.com/photo-1619881589637-83d81b953d3d?w=500&auto=format&fit=crop&q=80",
                "bestseller": True
            },
            {
                "id": "item-dom-4",
                "name": "Choco Lava Cake",
                "category": "Desserts",
                "price": 109,
                "is_veg": True,
                "rating": 4.9,
                "description": "Warm chocolate cake with a molten chocolate fudge center that oozes out.",
                "image": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80",
                "bestseller": True
            }
        ]
    },
    {
        "id": "rest-haldiram-nerul",
        "name": "Haldiram's Sweets & Restaurant",
        "tagline": "Traditional Indian Mithai & Street Delights",
        "cuisines": ["North Indian", "Street Food", "Sweets", "Chaat"],
        "rating": 4.5,
        "rating_count": "4.2K+",
        "cost_for_two": 350,
        "prep_time_minutes": 14,
        "is_veg": True,
        "address": "Sector 28, Nerul West, Near Railway Station, Navi Mumbai 400706",
        "locality": "Sector 28, Nerul",
        "city": "Navi Mumbai",
        "latitude": 19.0341,
        "longitude": 73.0142,
        "phone": "+91 22 2770 1200",
        "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80",
        "badge": "Pure Veg",
        "discount": "FLAT 15% OFF",
        "menu": [
            {
                "id": "item-hald-1",
                "name": "Special Chole Bhature (2 Pcs)",
                "category": "Main Course",
                "price": 199,
                "is_veg": True,
                "rating": 4.8,
                "description": "Fluffy golden bhaturas served with spicy Punjabi chole, tangy pickles, and mint onion salad.",
                "image": "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=500&auto=format&fit=crop&q=80",
                "bestseller": True
            },
            {
                "id": "item-hald-2",
                "name": "Delhi Special Raj Kachori",
                "category": "Chaat",
                "price": 149,
                "is_veg": True,
                "rating": 4.7,
                "description": "Crisp giant kachori stuffed with diced potatoes, sprouts, sweetened curd, tamarind, and mint chutney.",
                "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80",
                "bestseller": True
            },
            {
                "id": "item-hald-3",
                "name": "Mumbai Pav Bhaji with Butter",
                "category": "Street Food",
                "price": 169,
                "is_veg": True,
                "rating": 4.6,
                "description": "Spiced vegetable mash loaded with Amul butter, served with two soft butter-toasted pavs.",
                "image": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500&auto=format&fit=crop&q=80",
                "bestseller": True
            },
            {
                "id": "item-hald-4",
                "name": "Rasmalai (2 Pcs)",
                "category": "Desserts",
                "price": 120,
                "is_veg": True,
                "rating": 4.9,
                "description": "Soft cottage cheese patties soaked in thickened sweetened milk with pistachios and saffron.",
                "image": "https://images.unsplash.com/photo-1594998893017-36147cbcae05?w=500&auto=format&fit=crop&q=80",
                "bestseller": True
            }
        ]
    },
    {
        "id": "rest-mcdonalds-seawoods",
        "name": "McDonald's",
        "tagline": "Burgers, Fries & McCafé",
        "cuisines": ["Burgers", "American", "Fast Food", "Beverages"],
        "rating": 4.4,
        "rating_count": "5.1K+",
        "cost_for_two": 350,
        "prep_time_minutes": 12,
        "is_veg": False,
        "address": "Food Court Level 2, Seawoods Grand Central Mall, Sector 40, Seawoods 400706",
        "locality": "Seawoods Grand Central",
        "city": "Navi Mumbai",
        "latitude": 19.0225,
        "longitude": 73.0189,
        "phone": "+91 22 6100 8899",
        "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
        "badge": "Top Rated",
        "discount": "ITEMS AT ₹99",
        "menu": [
            {
                "id": "item-mcd-1",
                "name": "McAloo Tikki Burger Meal",
                "category": "Burgers",
                "price": 179,
                "is_veg": True,
                "rating": 4.5,
                "description": "Crispy spiced potato & peas patty with tomato mayonnaise and fresh buns + Medium Fries + Coke.",
                "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80",
                "bestseller": True
            },
            {
                "id": "item-mcd-2",
                "name": "McSpicy Chicken Burger",
                "category": "Burgers",
                "price": 209,
                "is_veg": False,
                "rating": 4.7,
                "description": "Tender chicken patty battered with fiery marinade, crisp iceberg lettuce, and creamy mayo.",
                "image": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=80",
                "bestseller": True
            },
            {
                "id": "item-mcd-3",
                "name": "Peri Peri French Fries (Large)",
                "category": "Sides",
                "price": 139,
                "is_veg": True,
                "rating": 4.8,
                "description": "Golden crispy potato fries served with shake-shake fiery Peri-Peri spice mix pouch.",
                "image": "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80",
                "bestseller": True
            },
            {
                "id": "item-mcd-4",
                "name": "McCafé Iced Caramel Frappe",
                "category": "Beverages",
                "price": 229,
                "is_veg": True,
                "rating": 4.6,
                "description": "Rich espresso coffee blended with creamy caramel and whipped cream topping.",
                "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80",
                "bestseller": False
            }
        ]
    },
    {
        "id": "rest-chaipoint-belapur",
        "name": "Chai Point",
        "tagline": "India's Favorite Chai & Snacks",
        "cuisines": ["Beverages", "Snacks", "Tea", "Bakery"],
        "rating": 4.3,
        "rating_count": "1.9K+",
        "cost_for_two": 250,
        "prep_time_minutes": 10,
        "is_veg": True,
        "address": "Sector 11, CBD Belapur Station Complex, Navi Mumbai 400614",
        "locality": "CBD Belapur",
        "city": "Navi Mumbai",
        "latitude": 19.0189,
        "longitude": 73.0398,
        "phone": "+91 22 4150 9900",
        "image": "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=800&auto=format&fit=crop&q=80",
        "badge": "Morning Special",
        "discount": "FLAT ₹50 OFF",
        "menu": [
            {
                "id": "item-chai-1",
                "name": "Ginger Masala Chai Flask (500ml)",
                "category": "Beverages",
                "price": 189,
                "is_veg": True,
                "rating": 4.8,
                "description": "Freshly brewed hot milk tea with crushed ginger, cardamom and cinnamon. Serves 4-5 cups.",
                "image": "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=500&auto=format&fit=crop&q=80",
                "bestseller": True
            },
            {
                "id": "item-chai-2",
                "name": "Irani Bun Maska (2 Pcs)",
                "category": "Snacks",
                "price": 99,
                "is_veg": True,
                "rating": 4.7,
                "description": "Warm soft sweet buns generously smeared with salted butter and tutti frutti.",
                "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80",
                "bestseller": True
            },
            {
                "id": "item-chai-3",
                "name": "Cocktail Punjabi Samosa (4 Pcs)",
                "category": "Snacks",
                "price": 119,
                "is_veg": True,
                "rating": 4.6,
                "description": "Flaky golden samosas stuffed with spiced potatoes, green peas and whole coriander.",
                "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80",
                "bestseller": True
            }
        ]
    },
    {
        "id": "rest-wowmomo-airoli",
        "name": "Wow! Momo",
        "tagline": "Hot & Steaming Himalayan Momos",
        "cuisines": ["Momos", "Tibetan", "Chinese", "Fast Food"],
        "rating": 4.3,
        "rating_count": "2.2K+",
        "cost_for_two": 300,
        "prep_time_minutes": 15,
        "is_veg": False,
        "address": "Mindspace SEZ, Sector 8, Airoli, Navi Mumbai 400708",
        "locality": "Airoli Mindspace",
        "city": "Navi Mumbai",
        "latitude": 19.1609,
        "longitude": 72.9978,
        "phone": "+91 22 6790 3400",
        "image": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80",
        "badge": "Popular",
        "discount": "BUY 1 GET 1 FREE",
        "menu": [
            {
                "id": "item-momo-1",
                "name": "Darjeeling Chicken Steamed Momo (6 Pcs)",
                "category": "Momos",
                "price": 199,
                "is_veg": False,
                "rating": 4.7,
                "description": "Authentic thin-skin momos stuffed with juicy minced chicken and Himalayan herbs.",
                "image": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=80",
                "bestseller": True
            },
            {
                "id": "item-momo-2",
                "name": "Crispy Fried Paneer Momo (6 Pcs)",
                "category": "Momos",
                "price": 189,
                "is_veg": True,
                "rating": 4.6,
                "description": "Crunchy golden fried momos filled with seasoned paneer, served with spicy red chili dip.",
                "image": "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=500&auto=format&fit=crop&q=80",
                "bestseller": True
            },
            {
                "id": "item-momo-3",
                "name": "Momo Burger (Chicken Moburg)",
                "category": "Fusion",
                "price": 129,
                "is_veg": False,
                "rating": 4.5,
                "description": "Two fried chicken momos placed inside burger buns with schezwan sauce and fresh lettuce.",
                "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80",
                "bestseller": False
            }
        ]
    }
]

# Sample Delivery Riders for Dispatch
DELIVERY_RIDERS = [
    {
        "id": "rider-1",
        "name": "Ramesh Kumar",
        "phone": "+91 98201 44821",
        "vehicle": "Hero Splendor Plus (MH-46-AZ-8921)",
        "vehicle_type": "Motorcycle",
        "rating": 4.89,
        "trips_completed": 1420,
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
        "status": "online"
    },
    {
        "id": "rider-2",
        "name": "Sunil Shinde",
        "phone": "+91 98192 33410",
        "vehicle": "Ather 450X EV (MH-46-EV-1044)",
        "vehicle_type": "Electric Scooter",
        "rating": 4.92,
        "trips_completed": 2180,
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
        "status": "online"
    },
    {
        "id": "rider-3",
        "name": "Amit Patel",
        "phone": "+91 97693 88102",
        "vehicle": "Honda Activa 6G (MH-43-BW-5521)",
        "vehicle_type": "Scooter",
        "rating": 4.78,
        "trips_completed": 950,
        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
        "status": "online"
    }
]

# Active food orders store (in-memory with seed default)
LIVE_ORDERS: Dict[str, Dict[str, Any]] = {}

def get_local_lan_ip() -> str:
    """Detects host machine's local Wi-Fi or LAN IP address for cross-device mobile pairing."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

class FoodDeliveryService:
    @staticmethod
    def get_restaurants(
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
        search_query: str = "",
        category: str = "all"
    ) -> List[Dict[str, Any]]:
        """
        Returns real restaurants enriched with live distance (km) and delivery ETA (mins)
        calculated from the customer's real device or chosen map coordinates.
        """
        results = []
        q = search_query.strip().lower()

        # Default center if no coordinates provided (Kharghar Central Depot)
        ref_lat = user_lat if user_lat is not None else 19.0434
        ref_lon = user_lon if user_lon is not None else 73.0683

        for rest in REAL_RESTAURANTS:
            # Category / Veg filter
            if category == "veg" and not rest["is_veg"]:
                continue
            elif category != "all" and category != "veg":
                cat_match = any(category.lower() in c.lower() for c in rest["cuisines"])
                if not cat_match:
                    continue

            # Query filter (matches name, cuisines, address, or dishes)
            if q:
                name_match = q in rest["name"].lower()
                cuisine_match = any(q in c.lower() for c in rest["cuisines"])
                addr_match = q in rest["address"].lower()
                item_match = any(q in item["name"].lower() for item in rest.get("menu", []))
                if not (name_match or cuisine_match or addr_match or item_match):
                    continue

            # Compute road/haversine distance from customer
            dist_km = haversine_distance((ref_lat, ref_lon), (rest["latitude"], rest["longitude"])) / 1000.0
            # Realistic urban driving time: 3.5 mins per km + restaurant prep time
            travel_time_mins = int(dist_km * 3.5)
            total_eta_mins = rest["prep_time_minutes"] + travel_time_mins

            rest_copy = dict(rest)
            rest_copy["distance_km"] = round(dist_km, 1)
            rest_copy["estimated_delivery_mins"] = max(15, total_eta_mins)
            rest_copy["delivery_fee"] = 25 if dist_km < 3.0 else int(25 + (dist_km - 3.0) * 8)
            results.append(rest_copy)

        # Sort by proximity by default
        results.sort(key=lambda r: r["distance_km"])
        return results

    @staticmethod
    def get_restaurant_by_id(restaurant_id: str) -> Optional[Dict[str, Any]]:
        for rest in REAL_RESTAURANTS:
            if rest["id"] == restaurant_id:
                return rest
        return None

    @staticmethod
    def create_order(order_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates a real order following Swiggy / Zomato order flow:
        Assigns OTP, matches delivery partner, queries OSRM road geometry, and returns full tracking payload.
        """
        restaurant_id = order_data.get("restaurant_id", "")
        restaurant = FoodDeliveryService.get_restaurant_by_id(restaurant_id)
        if not restaurant:
            # Fallback to first restaurant
            restaurant = REAL_RESTAURANTS[0]

        customer_lat = float(order_data.get("customer_latitude", 19.0345))
        customer_lon = float(order_data.get("customer_longitude", 73.0678))
        customer_name = order_data.get("customer_name", "Rahul Sharma")
        customer_phone = order_data.get("customer_phone", "+91 98765 43210")
        customer_address = order_data.get("customer_address", "Flat 402, Royal Palms, Sector 7, Kharghar")

        items = order_data.get("items", [])
        if not items:
            # Add default bestseller from restaurant
            items = [{
                "id": restaurant["menu"][0]["id"],
                "name": restaurant["menu"][0]["name"],
                "price": restaurant["menu"][0]["price"],
                "quantity": 1,
                "is_veg": restaurant["menu"][0]["is_veg"]
            }]

        item_total = sum(i.get("price", 0) * i.get("quantity", 1) for i in items)
        dist_km = haversine_distance((restaurant["latitude"], restaurant["longitude"]), (customer_lat, customer_lon)) / 1000.0
        delivery_fee = 25 if dist_km < 3.0 else int(25 + (dist_km - 3.0) * 8)
        platform_fee = 6
        taxes = int(item_total * 0.05)
        grand_total = item_total + delivery_fee + platform_fee + taxes

        # Random 4-digit Delivery OTP (like Swiggy / Zomato) or client-specified
        delivery_otp = str(order_data.get("delivery_otp") or order_data.get("otp") or random.randint(1000, 9999))
        order_id = str(order_data.get("id") or order_data.get("order_id") or f"ZOM-{int(time.time()) % 100000:05d}")

        # Assign delivery rider near restaurant
        rider = random.choice(DELIVERY_RIDERS)
        # Driver starts slightly offset from restaurant (300-600m away)
        driver_lat = restaurant["latitude"] + random.uniform(-0.004, 0.004)
        driver_lon = restaurant["longitude"] + random.uniform(-0.004, 0.004)

        # Use client-queried OSRM road geometry if provided, otherwise query server-side OSRM
        client_geom = order_data.get("road_geometry")
        if client_geom and isinstance(client_geom, list) and len(client_geom) >= 2:
            geometry = client_geom
        else:
            routing_service = RoutingService()
            route_res = routing_service.get_route(
                coordinates=[
                    (restaurant["latitude"], restaurant["longitude"]),
                    (customer_lat, customer_lon)
                ],
                overview="full"
            )
            geometry = route_res.get("geometry_coordinates", [])
            if not geometry:
                # 5-step fallback
                geometry = [
                    [restaurant["latitude"], restaurant["longitude"]],
                    [round((restaurant["latitude"] + customer_lat) / 2, 5), round((restaurant["longitude"] + customer_lon) / 2, 5)],
                    [customer_lat, customer_lon]
                ]

        initial_status = str(order_data.get("status") or "placed")
        is_real_mode = bool(order_data.get("is_real_mode", False))

        order = {
            "id": order_id,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "status": initial_status,  # placed, preparing, ready_for_pickup, out_for_delivery, delivered
            "status_title": order_data.get("status_title") or ("Rider On The Way" if initial_status == "out_for_delivery" else "Order Confirmed!"),
            "status_message": order_data.get("status_message") or (f"Rider is en route with your food." if initial_status == "out_for_delivery" else f"{restaurant['name']} has received your order."),
            "delivery_otp": delivery_otp,
            "is_real_mode": is_real_mode,
            "customer": {
                "name": customer_name,
                "phone": customer_phone,
                "address": customer_address,
                "latitude": customer_lat,
                "longitude": customer_lon
            },
            "restaurant": {
                "id": restaurant["id"],
                "name": restaurant["name"],
                "address": restaurant["address"],
                "phone": restaurant["phone"],
                "image": restaurant["image"],
                "latitude": restaurant["latitude"],
                "longitude": restaurant["longitude"]
            },
            "rider": {
                "id": rider["id"],
                "name": rider["name"],
                "phone": rider["phone"],
                "vehicle": rider["vehicle"],
                "vehicle_type": rider["vehicle_type"],
                "rating": rider["rating"],
                "trips": rider["trips_completed"],
                "avatar": rider["avatar"]
            },
            "driver_location": {
                "latitude": driver_lat,
                "longitude": driver_lon,
                "heading": 0.0,
                "speed_kmh": 0.0,
                "last_updated": time.time(),
                "is_real_device_connected": False
            },
            "items": items,
            "bill": {
                "item_total": item_total,
                "delivery_fee": delivery_fee,
                "platform_fee": platform_fee,
                "taxes": taxes,
                "grand_total": grand_total
            },
            "distance_km": round(dist_km, 1),
            "estimated_delivery_mins": restaurant["prep_time_minutes"] + int(dist_km * 3.5),
            "road_geometry": geometry, # [[lat, lon], ...]
            "timeline": [
                {
                    "status": "placed",
                    "title": "Order Placed",
                    "timestamp": time.strftime("%I:%M %p"),
                    "completed": True
                },
                {
                    "status": "preparing",
                    "title": "Cooking in Kitchen",
                    "timestamp": "",
                    "completed": False
                },
                {
                    "status": "out_for_delivery",
                    "title": "Rider on the Way",
                    "timestamp": "",
                    "completed": False
                },
                {
                    "status": "delivered",
                    "title": "Delivered",
                    "timestamp": "",
                    "completed": False
                }
            ]
        }

        LIVE_ORDERS[order_id] = order
        return order

    @staticmethod
    def get_order(order_id: str) -> Optional[Dict[str, Any]]:
        return LIVE_ORDERS.get(order_id)

    @staticmethod
    def get_all_orders() -> List[Dict[str, Any]]:
        # Return recent orders sorted newest first
        orders = list(LIVE_ORDERS.values())
        orders.sort(key=lambda o: o.get("created_at", ""), reverse=True)
        return orders

    @staticmethod
    def update_order_status(order_id: str, new_status: str) -> Optional[Dict[str, Any]]:
        order = LIVE_ORDERS.get(order_id)
        if not order:
            return None

        status_messages = {
            "placed": ("Order Confirmed", "Restaurant has received the order."),
            "preparing": ("Kitchen is Cooking", f"{order['restaurant']['name']} is actively preparing your hot food."),
            "ready_for_pickup": ("Food Ready for Pickup", "Dishes are packed and ready for delivery partner pickup."),
            "picked_up": ("Food Picked Up", f"{order['rider']['name']} picked up your package from the kitchen."),
            "out_for_delivery": ("Out for Delivery", f"{order['rider']['name']} is navigating to your address on real roads."),
            "delivered": ("Order Delivered", "Enjoy your hot meal! Verification complete via OTP.")
        }

        title, msg = status_messages.get(new_status, ("Status Updated", f"Order is now {new_status}."))
        order["status"] = new_status
        order["status_title"] = title
        order["status_message"] = msg

        # Update timeline step
        for step in order.get("timeline", []):
            if step["status"] == new_status:
                step["completed"] = True
                step["timestamp"] = time.strftime("%I:%M %p")
            elif new_status == "delivered":
                step["completed"] = True
                if not step["timestamp"]:
                    step["timestamp"] = time.strftime("%I:%M %p")

        return order

    @staticmethod
    def update_driver_location(
        order_id: str,
        latitude: float,
        longitude: float,
        heading: float = 0.0,
        speed_kmh: float = 0.0,
        is_real_device: bool = False
    ) -> Optional[Dict[str, Any]]:
        """
        Receives real-time GPS coordinate pings from the driver's physical mobile device or simulated companion.
        Updates order tracking state and re-calculates real remaining road distance/ETA to the customer.
        """
        order = LIVE_ORDERS.get(order_id)
        if not order:
            return None

        order["driver_location"] = {
            "latitude": latitude,
            "longitude": longitude,
            "heading": heading,
            "speed_kmh": speed_kmh,
            "last_updated": time.time(),
            "is_real_device_connected": is_real_device
        }

        # Calculate remaining distance to customer
        c_lat = order["customer"]["latitude"]
        c_lon = order["customer"]["longitude"]
        rem_dist_km = haversine_distance((latitude, longitude), (c_lat, c_lon)) / 1000.0
        rem_eta = max(1, int(rem_dist_km * 3.5))

        order["distance_km"] = round(rem_dist_km, 2)
        order["estimated_delivery_mins"] = rem_eta

        # Auto-update status if driver moves from preparing -> out_for_delivery
        if order["status"] in ["ready_for_pickup", "picked_up"]:
            order["status"] = "out_for_delivery"
            order["status_title"] = "Rider On The Way"
            order["status_message"] = f"{order['rider']['name']} is en route with your food."

        return order

    @staticmethod
    def verify_otp(order_id: str, otp: str) -> Dict[str, Any]:
        """Validates 4-digit customer delivery OTP and completes order."""
        order = LIVE_ORDERS.get(order_id)
        if not order:
            return {"success": False, "error": "Order not found"}

        if order.get("delivery_otp") == otp.strip():
            FoodDeliveryService.update_order_status(order_id, "delivered")
            return {
                "success": True,
                "message": "OTP Verified! Order successfully delivered.",
                "order": order
            }
        else:
            return {
                "success": False,
                "error": f"Invalid OTP. Please check the 4-digit code on the customer's screen (Expected: {order.get('delivery_otp')})"
            }

    @staticmethod
    def get_device_info() -> Dict[str, Any]:
        """Provides local LAN IP and mobile companion URL endpoints for QR code connection."""
        lan_ip = get_local_lan_ip()
        return {
            "lan_ip": lan_ip,
            "frontend_port": 5173,
            "backend_port": 5050,
            "customer_url": f"http://{lan_ip}:5173/swiggy",
            "driver_companion_url": f"http://{lan_ip}:5173/driver",
            "kitchen_url": f"http://{lan_ip}:5173/kitchen",
            "tracking_url_template": f"http://{lan_ip}:5173/track/{{orderId}}",
            "server_time": time.time(),
            "active_orders_count": len(LIVE_ORDERS)
        }

    @staticmethod
    def seed_demo_order_if_empty():
        """Ensures at least 1 active live order exists so the tracking and driver app work immediately out of the box."""
        if not LIVE_ORDERS:
            rest = REAL_RESTAURANTS[0]
            FoodDeliveryService.create_order({
                "restaurant_id": rest["id"],
                "customer_name": "Pooja Verma",
                "customer_phone": "+91 98205 11920",
                "customer_address": "Flat 301, Sector 7, Utsav Chowk Circle, Kharghar, Navi Mumbai",
                "customer_latitude": 19.0345,
                "customer_longitude": 73.0678,
                "items": [
                    {
                        "id": rest["menu"][0]["id"],
                        "name": rest["menu"][0]["name"],
                        "price": rest["menu"][0]["price"],
                        "quantity": 2,
                        "is_veg": rest["menu"][0]["is_veg"]
                    },
                    {
                        "id": rest["menu"][3]["id"],
                        "name": rest["menu"][3]["name"],
                        "price": rest["menu"][3]["price"],
                        "quantity": 1,
                        "is_veg": rest["menu"][3]["is_veg"]
                    }
                ]
            })

# Seed a demo order on module load
FoodDeliveryService.seed_demo_order_if_empty()
