enum UserRole {
  customer,
  driver,
  kitchen;

  String get displayName {
    switch (this) {
      case UserRole.customer:
        return 'Customer';
      case UserRole.driver:
        return 'Delivery Partner';
      case UserRole.kitchen:
        return 'Kitchen / Merchant';
    }
  }

  String get iconEmoji {
    switch (this) {
      case UserRole.customer:
        return '🛒';
      case UserRole.driver:
        return '🛵';
      case UserRole.kitchen:
        return '🍳';
    }
  }
}

class MenuItem {
  final String id;
  final String name;
  final String category;
  final double price;
  final bool isVeg;
  final double rating;
  final String description;
  final String imageUrl;
  final bool bestseller;

  MenuItem({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    required this.isVeg,
    this.rating = 4.6,
    required this.description,
    required this.imageUrl,
    this.bestseller = false,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      category: json['category']?.toString() ?? 'Main',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      isVeg: json['is_veg'] == true,
      rating: (json['rating'] as num?)?.toDouble() ?? 4.6,
      description: json['description']?.toString() ?? '',
      imageUrl: json['image_url']?.toString() ?? json['image']?.toString() ?? '',
      bestseller: json['bestseller'] == true,
    );
  }
}

class Restaurant {
  final String id;
  final String name;
  final String tagline;
  final List<String> cuisines;
  final String address;
  final String locality;
  final double latitude;
  final double longitude;
  final double rating;
  final int costForTwo;
  final int prepTimeMinutes;
  final bool isVeg;
  final String imageUrl;
  final String discount;
  final List<MenuItem> menu;

  Restaurant({
    required this.id,
    required this.name,
    required this.tagline,
    required this.cuisines,
    required this.address,
    required this.locality,
    required this.latitude,
    required this.longitude,
    required this.rating,
    required this.costForTwo,
    this.prepTimeMinutes = 15,
    this.isVeg = false,
    required this.imageUrl,
    this.discount = '',
    this.menu = const [],
  });

  factory Restaurant.fromJson(Map<String, dynamic> json) {
    var rawMenu = json['menu'] as List? ?? [];
    List<MenuItem> menuItems = rawMenu.map((m) => MenuItem.fromJson(m)).toList();

    List<String> rawCuisines = [];
    if (json['cuisines'] is List) {
      rawCuisines = (json['cuisines'] as List).map((e) => e.toString()).toList();
    }

    return Restaurant(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      tagline: json['tagline']?.toString() ?? '',
      cuisines: rawCuisines,
      address: json['address']?.toString() ?? '',
      locality: json['locality']?.toString() ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 19.0358,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 73.0674,
      rating: (json['rating'] as num?)?.toDouble() ?? 4.5,
      costForTwo: (json['cost_for_two'] as num?)?.toInt() ?? 400,
      prepTimeMinutes: (json['prep_time_minutes'] as num?)?.toInt() ?? 15,
      isVeg: json['is_veg'] == true,
      imageUrl: json['image_url']?.toString() ?? json['image']?.toString() ?? '',
      discount: json['discount']?.toString() ?? '',
      menu: menuItems,
    );
  }
}

class DriverLocation {
  final double latitude;
  final double longitude;
  final double heading;
  final double speedKmh;
  final bool isRealDevice;
  final DateTime updatedAt;

  DriverLocation({
    required this.latitude,
    required this.longitude,
    this.heading = 0.0,
    this.speedKmh = 0.0,
    this.isRealDevice = false,
    required this.updatedAt,
  });

  factory DriverLocation.fromJson(Map<String, dynamic> json) {
    return DriverLocation(
      latitude: (json['latitude'] as num?)?.toDouble() ?? 19.0352,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 73.0676,
      heading: (json['heading'] as num?)?.toDouble() ?? 0.0,
      speedKmh: (json['speed'] as num?)?.toDouble() ?? (json['speed_kmh'] as num?)?.toDouble() ?? 0.0,
      isRealDevice: json['is_real_device'] == true || json['is_real_device_connected'] == true,
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at'].toString()) ?? DateTime.now() : DateTime.now(),
    );
  }
}

class FoodOrder {
  final String id;
  final String customerName;
  final String customerAddress;
  final double customerLat;
  final double customerLon;
  final String restaurantName;
  final double restaurantLat;
  final double restaurantLon;
  final String status;
  final String statusTitle;
  final String statusMessage;
  final String deliveryOtp;
  final double totalAmount;
  final String driverName;
  final String driverPhone;
  final String driverVehicle;
  final DriverLocation driverLocation;
  final List<List<double>> roadGeometry;
  final int estimatedDeliveryMins;
  final List<Map<String, dynamic>> items;
  final bool isRealMode;

  FoodOrder({
    required this.id,
    required this.customerName,
    required this.customerAddress,
    required this.customerLat,
    required this.customerLon,
    required this.restaurantName,
    required this.restaurantLat,
    required this.restaurantLon,
    required this.status,
    required this.statusTitle,
    required this.statusMessage,
    required this.deliveryOtp,
    required this.totalAmount,
    required this.driverName,
    required this.driverPhone,
    required this.driverVehicle,
    required this.driverLocation,
    required this.roadGeometry,
    this.estimatedDeliveryMins = 18,
    this.items = const [],
    this.isRealMode = false,
  });

  FoodOrder copyWith({
    String? status,
    String? statusTitle,
    String? statusMessage,
    DriverLocation? driverLocation,
    int? estimatedDeliveryMins,
    List<List<double>>? roadGeometry,
  }) {
    return FoodOrder(
      id: id,
      customerName: customerName,
      customerAddress: customerAddress,
      customerLat: customerLat,
      customerLon: customerLon,
      restaurantName: restaurantName,
      restaurantLat: restaurantLat,
      restaurantLon: restaurantLon,
      status: status ?? this.status,
      statusTitle: statusTitle ?? this.statusTitle,
      statusMessage: statusMessage ?? this.statusMessage,
      deliveryOtp: deliveryOtp,
      totalAmount: totalAmount,
      driverName: driverName,
      driverPhone: driverPhone,
      driverVehicle: driverVehicle,
      driverLocation: driverLocation ?? this.driverLocation,
      roadGeometry: roadGeometry ?? this.roadGeometry,
      estimatedDeliveryMins: estimatedDeliveryMins ?? this.estimatedDeliveryMins,
      items: items,
      isRealMode: isRealMode,
    );
  }

  factory FoodOrder.fromJson(Map<String, dynamic> json) {
    var rawCust = json['customer'] as Map<String, dynamic>?;
    var rawRest = json['restaurant'] as Map<String, dynamic>?;
    var rawRider = json['rider'] as Map<String, dynamic>?;
    var rawDriverLoc = json['driver_location'] as Map<String, dynamic>?;

    List<List<double>> geom = [];
    var rawGeom = json['road_geometry'];
    if (rawGeom is List) {
      for (var point in rawGeom) {
        if (point is List && point.length >= 2) {
          geom.add([(point[0] as num).toDouble(), (point[1] as num).toDouble()]);
        }
      }
    }

    List<Map<String, dynamic>> parsedItems = [];
    if (json['items'] is List) {
      for (var it in json['items']) {
        if (it is Map<String, dynamic>) {
          parsedItems.add(it);
        } else if (it is Map) {
          parsedItems.add(Map<String, dynamic>.from(it));
        }
      }
    }
    if (parsedItems.isEmpty) {
      parsedItems = [
        {'name': 'Dum Gosht Biryani (Mutton)', 'quantity': 1, 'price': 499.0},
        {'name': 'Gulab Jamun with Rabdi', 'quantity': 1, 'price': 149.0},
      ];
    }

    return FoodOrder(
      id: json['id']?.toString() ?? json['order_id']?.toString() ?? 'ZOM-84920',
      customerName: rawCust?['name']?.toString() ?? json['customer_name']?.toString() ?? 'Pooja Verma',
      customerAddress: rawCust?['address']?.toString() ?? json['customer_address']?.toString() ?? 'Flat 301, Sector 7, Kharghar',
      customerLat: (rawCust?['latitude'] as num?)?.toDouble() ?? (json['customer_lat'] as num?)?.toDouble() ?? 19.0345,
      customerLon: (rawCust?['longitude'] as num?)?.toDouble() ?? (json['customer_lon'] as num?)?.toDouble() ?? 73.0678,
      restaurantName: rawRest?['name']?.toString() ?? json['restaurant_name']?.toString() ?? 'Behrouz Biryani',
      restaurantLat: (rawRest?['latitude'] as num?)?.toDouble() ?? (json['restaurant_lat'] as num?)?.toDouble() ?? 19.0358,
      restaurantLon: (rawRest?['longitude'] as num?)?.toDouble() ?? (json['restaurant_lon'] as num?)?.toDouble() ?? 73.0674,
      status: json['status']?.toString() ?? 'out_for_delivery',
      statusTitle: json['status_title']?.toString() ?? 'Rider On The Way',
      statusMessage: json['status_message']?.toString() ?? 'Rider is en route with your hot food.',
      deliveryOtp: json['delivery_otp']?.toString() ?? json['otp']?.toString() ?? '4829',
      totalAmount: (json['bill']?['grand_total'] as num?)?.toDouble() ?? (json['total_amount'] as num?)?.toDouble() ?? 530.0,
      driverName: rawRider?['name']?.toString() ?? json['driver_name']?.toString() ?? 'Ramesh Kumar',
      driverPhone: rawRider?['phone']?.toString() ?? json['driver_phone']?.toString() ?? '+91 98201 44821',
      driverVehicle: rawRider?['vehicle']?.toString() ?? json['driver_vehicle']?.toString() ?? 'Hero Splendor (MH-46-AZ-8921)',
      driverLocation: rawDriverLoc != null
          ? DriverLocation.fromJson(rawDriverLoc)
          : DriverLocation(
              latitude: 19.0352,
              longitude: 73.0676,
              updatedAt: DateTime.now(),
            ),
      roadGeometry: geom,
      estimatedDeliveryMins: (json['estimated_delivery_mins'] as num?)?.toInt() ?? 18,
      items: parsedItems,
      isRealMode: json['is_real_mode'] == true,
    );
  }
}
