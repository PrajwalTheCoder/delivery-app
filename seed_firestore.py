"""
RouteWise — Cloud Firestore Database Seeder
Seeds Firestore collections: 'restaurants', 'orders', 'driver_locations'
"""

import json

RESTAURANTS_DATA = [
    {
        "id": "rest-behrouz-kharghar",
        "name": "Behrouz Biryani",
        "tagline": "Royal & Authentic Dum Biryani",
        "cuisines": ["Biryani", "North Indian", "Mughlai"],
        "address": "Shop 4, Crystal Plaza, Sector 7, Kharghar",
        "locality": "Sector 7, Kharghar",
        "city": "Navi Mumbai",
        "latitude": 19.0358,
        "longitude": 73.0674,
        "rating": 4.6,
        "cost_for_two": 450,
        "prep_time_minutes": 15,
        "is_veg": False,
        "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
        "discount": "20% OFF UPTO ₹100",
        "menu": [
            {
                "id": "item-bb-1",
                "name": "Dum Gosht Biryani (Mutton)",
                "category": "Biryani",
                "price": 499,
                "is_veg": False,
                "description": "Slow-cooked royal mutton biryani with saffron Basmati rice.",
                "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500",
                "bestseller": True
            },
            {
                "id": "item-bb-2",
                "name": "Subz-e-Biryani (Veg Dum)",
                "category": "Biryani",
                "price": 349,
                "is_veg": True,
                "description": "Fresh seasonal vegetables and paneer cubes infused with spices.",
                "image_url": "https://images.unsplash.com/photo-1642821373181-696a54913e93?w=500",
                "bestseller": True
            }
        ]
    },
    {
        "id": "rest-dominos-vashi",
        "name": "Domino's Pizza",
        "tagline": "Hot & Fresh Hand Tossed Pizzas",
        "cuisines": ["Pizza", "Italian", "Fast Food"],
        "address": "Sector 17 Commercial Area, Vashi, Navi Mumbai",
        "locality": "Sector 17, Vashi",
        "city": "Navi Mumbai",
        "latitude": 19.0765,
        "longitude": 72.9992,
        "rating": 4.4,
        "cost_for_two": 400,
        "prep_time_minutes": 12,
        "is_veg": True,
        "image_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
        "discount": "₹125 OFF ON ₹399",
        "menu": [
            {
                "id": "item-dom-1",
                "name": "Farmhouse Pizza (Medium)",
                "category": "Pizzas",
                "price": 429,
                "is_veg": True,
                "description": "Crisp capsicum, grilled mushroom, and juicy tomatoes.",
                "image_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500",
                "bestseller": True
            }
        ]
    }
]

INITIAL_ORDER = {
    "id": "ZOM-84920",
    "customer_name": "Pooja Verma",
    "customer_phone": "+91 98201 55610",
    "customer_address": "Flat 301, Sector 7, Utsav Chowk Circle, Kharghar, Navi Mumbai",
    "customer_lat": 19.0345,
    "customer_lon": 73.0678,
    "restaurant_id": "rest-behrouz-kharghar",
    "restaurant_name": "Behrouz Biryani",
    "restaurant_lat": 19.0358,
    "restaurant_lon": 73.0674,
    "status": "out_for_delivery",
    "status_title": "Rider On The Way",
    "status_message": "Ramesh Kumar is en route with your hot food.",
    "delivery_otp": "4829",
    "total_amount": 530,
    "driver_name": "Ramesh Kumar",
    "driver_phone": "+91 98201 44821",
    "driver_vehicle": "Hero Splendor (MH-46-AZ-8921)",
    "driver_lat": 19.0352,
    "driver_lon": 73.0676,
    "estimated_delivery_mins": 14
}

def export_firestore_json():
    with open("firestore_seed_data.json", "w", encoding="utf-8") as f:
        json.dump({
            "restaurants": RESTAURANTS_DATA,
            "orders": [INITIAL_ORDER]
        }, f, indent=2)
    print("Exported firestore_seed_data.json successfully!")

if __name__ == "__main__":
    export_firestore_json()
