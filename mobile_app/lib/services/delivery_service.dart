import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/constants.dart';
import '../models/models.dart';

class DeliveryService {
  static final DeliveryService _instance = DeliveryService._internal();
  factory DeliveryService() => _instance;
  DeliveryService._internal();

  SupabaseClient? _supabase;
  bool _useSupabase = false;

  FirebaseFirestore? _firestore;
  bool _useFirebase = false;

  // Toggle between Real Device GPS & Demo Simulation
  bool isRealMode = false;
  FoodOrder? _activeOrder;
  FoodOrder? get currentOrder => _activeOrder;

  // Broadcast stream controllers for instantaneous real-time sync across devices and screens
  final StreamController<DriverLocation> _driverLocController =
      StreamController<DriverLocation>.broadcast();
  Stream<DriverLocation> get onDriverLocationUpdate => _driverLocController.stream;

  final StreamController<FoodOrder> _orderController =
      StreamController<FoodOrder>.broadcast();
  Stream<FoodOrder> get onOrderUpdate => _orderController.stream;

  // High-precision road waypoints in Kharghar, Navi Mumbai (Crystal Plaza -> Utsav Chowk -> Jalvayu Vihar)
  static const List<List<double>> khargharDemoRoadGeometry = [
    [19.03580, 73.06740], // Behrouz Biryani (Crystal Plaza)
    [19.03565, 73.06748],
    [19.03542, 73.06756],
    [19.03515, 73.06764],
    [19.03485, 73.06772],
    [19.03450, 73.06780], // Turning onto Utsav Chowk Circle
    [19.03418, 73.06795],
    [19.03385, 73.06820],
    [19.03350, 73.06860],
    [19.03320, 73.06910], // Pravesh Marg Straight
    [19.03280, 73.06965],
    [19.03240, 73.07020],
    [19.03200, 73.07080],
    [19.03160, 73.07130],
    [19.03120, 73.07185], // Jalvayu Vihar Gate
    [19.03080, 73.07220], // Customer Residence Doorstep
  ];

  // Create a brand new real order with actual cart items and dynamic OTP
  Future<FoodOrder> createRealOrder({
    required Restaurant restaurant,
    required Map<String, int> cart,
    required String customerName,
    required String customerAddress,
    required double customerLat,
    required double customerLon,
    bool realMode = true,
  }) async {
    isRealMode = realMode;

    // Generate dynamic 4-digit OTP
    final rng = Random();
    final otp = (1000 + rng.nextInt(9000)).toString();
    final orderId = 'RW-${10000 + rng.nextInt(90000)}';

    // Parse items & calculate bill
    List<Map<String, dynamic>> orderItems = [];
    double subtotal = 0.0;

    cart.forEach((itemId, qty) {
      final menuItem = restaurant.menu.firstWhere(
        (m) => m.id == itemId,
        orElse: () => MenuItem(
          id: itemId,
          name: 'Delicious Dish',
          category: 'Special',
          price: 299.0,
          isVeg: false,
          description: '',
          imageUrl: '',
        ),
      );
      final itemTotal = menuItem.price * qty;
      subtotal += itemTotal;
      orderItems.add({
        'name': menuItem.name,
        'quantity': qty,
        'price': menuItem.price,
        'total': itemTotal,
      });
    });

    final packagingFee = 25.0;
    final deliveryFee = 35.0;
    final taxes = subtotal * 0.05;
    final grandTotal = subtotal + packagingFee + deliveryFee + taxes;

    // Realistic road geometry
    List<List<double>> geom = [];
    if (!realMode) {
      geom = List.from(khargharDemoRoadGeometry);
    } else {
      // Generate 8 smooth intermediate waypoints between restaurant and customer
      const steps = 8;
      for (int i = 0; i <= steps; i++) {
        final frac = i / steps;
        // Add subtle road curve deviation
        final curve = sin(frac * pi) * 0.0006;
        final lat = restaurant.latitude + (customerLat - restaurant.latitude) * frac + curve;
        final lon = restaurant.longitude + (customerLon - restaurant.longitude) * frac + (curve * 0.7);
        geom.add([lat, lon]);
      }
    }

    final newOrder = FoodOrder(
      id: orderId,
      customerName: customerName,
      customerAddress: customerAddress,
      customerLat: customerLat,
      customerLon: customerLon,
      restaurantName: restaurant.name,
      restaurantLat: restaurant.latitude,
      restaurantLon: restaurant.longitude,
      status: 'out_for_delivery',
      statusTitle: 'Rider On The Way',
      statusMessage: 'Rider has collected your order and is moving on the road.',
      deliveryOtp: realMode ? otp : '4829',
      totalAmount: grandTotal,
      driverName: 'Ramesh Kumar',
      driverPhone: '+91 98201 44821',
      driverVehicle: 'Hero Splendor (MH-46-AZ-8921)',
      driverLocation: DriverLocation(
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        heading: 45.0,
        speedKmh: 24.0,
        isRealDevice: realMode,
        updatedAt: DateTime.now(),
      ),
      roadGeometry: geom,
      estimatedDeliveryMins: 16,
      items: orderItems,
      isRealMode: realMode,
    );

    _activeOrder = newOrder;
    _orderController.add(newOrder);

    // Sync to Cloud Firestore if connected
    if (_useFirebase && _firestore != null) {
      try {
        await _firestore!.collection('orders').doc(orderId).set({
          'id': orderId,
          'customer_name': customerName,
          'customer_address': customerAddress,
          'customer_lat': customerLat,
          'customer_lon': customerLon,
          'restaurant_name': restaurant.name,
          'status': 'out_for_delivery',
          'otp': newOrder.deliveryOtp,
          'total_amount': grandTotal,
          'items': orderItems,
          'is_real_mode': realMode,
          'created_at': FieldValue.serverTimestamp(),
        });
      } catch (_) {}
    }

    return newOrder;
  }

  void initFirebase() {
    try {
      _firestore = FirebaseFirestore.instance;
      _useFirebase = true;
    } catch (e) {
      debugPrint('Firestore init error: $e');
    }
  }

  void initSupabase() {
    try {
      if (AppConstants.supabaseUrl.startsWith('https://') &&
          !AppConstants.supabaseUrl.contains('YOUR_PROJECT_ID')) {
        _supabase = Supabase.instance.client;
        _useSupabase = true;
      }
    } catch (e) {
      debugPrint('Supabase not yet configured: $e');
    }
  }

  // Fetch real restaurants
  Future<List<Restaurant>> getRestaurants() async {
    // 1. Try Local PC Dashboard API
    try {
      final response = await http
          .get(Uri.parse('${AppConstants.localBackendApi}/food/restaurants'))
          .timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = data['restaurants'] as List? ?? [];
        return list.map((r) => Restaurant.fromJson(r)).toList();
      }
    } catch (_) {
      // Fallback
    }

    // 2. Try Firestore
    if (_useFirebase && _firestore != null) {
      try {
        final snap = await _firestore!.collection('restaurants').get();
        if (snap.docs.isNotEmpty) {
          return snap.docs.map((d) => Restaurant.fromJson({'id': d.id, ...d.data()})).toList();
        }
      } catch (_) {}
    }

    // 3. Try Supabase
    if (_useSupabase && _supabase != null) {
      try {
        final data = await _supabase!.from('restaurants').select();
        return (data as List).map((r) => Restaurant.fromJson(r)).toList();
      } catch (_) {}
    }

    // 4. Robust Default Seed Data
    return [
      Restaurant(
        id: 'rest-behrouz-kharghar',
        name: 'Behrouz Biryani',
        tagline: 'Royal & Authentic Dum Biryani',
        cuisines: ['Biryani', 'North Indian', 'Mughlai'],
        address: 'Shop 4, Crystal Plaza, Sector 7, Kharghar',
        locality: 'Sector 7, Kharghar',
        latitude: 19.0358,
        longitude: 73.0674,
        rating: 4.6,
        costForTwo: 450,
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
        discount: '20% OFF UPTO ₹100',
        menu: [
          MenuItem(
            id: 'item-bb-1',
            name: 'Dum Gosht Biryani (Mutton)',
            category: 'Biryani',
            price: 499,
            isVeg: false,
            description: 'Slow-cooked royal mutton biryani with saffron Basmati rice.',
            imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500',
            bestseller: true,
          ),
          MenuItem(
            id: 'item-bb-2',
            name: 'Subz-e-Biryani (Veg Dum)',
            category: 'Biryani',
            price: 349,
            isVeg: true,
            description: 'Fresh seasonal vegetables and paneer cubes infused with spices.',
            imageUrl: 'https://images.unsplash.com/photo-1642821373181-696a54913e93?w=500',
            bestseller: true,
          ),
          MenuItem(
            id: 'item-bb-3',
            name: 'Gulab Jamun with Rabdi',
            category: 'Desserts',
            price: 149,
            isVeg: true,
            description: 'Golden fried dumplings steeped in saffron cardamom syrup.',
            imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500',
            bestseller: true,
          ),
        ],
      ),
      Restaurant(
        id: 'rest-dominos-vashi',
        name: "Domino's Pizza",
        tagline: 'Hot & Fresh Hand Tossed Pizzas',
        cuisines: ['Pizza', 'Italian', 'Fast Food'],
        address: 'Sector 17 Commercial Area, Vashi, Navi Mumbai',
        locality: 'Sector 17, Vashi',
        latitude: 19.0765,
        longitude: 72.9992,
        rating: 4.4,
        costForTwo: 400,
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
        discount: '₹125 OFF ON ₹399',
        menu: [
          MenuItem(
            id: 'item-dom-1',
            name: 'Farmhouse Pizza (Medium)',
            category: 'Pizzas',
            price: 429,
            isVeg: true,
            description: 'Crisp capsicum, grilled mushroom, and juicy tomatoes.',
            imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500',
            bestseller: true,
          ),
          MenuItem(
            id: 'item-dom-2',
            name: 'Garlic Breadsticks with Dip',
            category: 'Sides',
            price: 139,
            isVeg: true,
            description: 'Freshly baked breadsticks sprinkled with garlic and herbs.',
            imageUrl: 'https://images.unsplash.com/photo-1573821663912-569905455b1c?w=500',
            bestseller: true,
          ),
        ],
      ),
    ];
  }

  // Fetch active order
  Future<FoodOrder?> getActiveOrder([String? orderId]) async {
    // 0. Use active local order if matching or default
    if (_activeOrder != null && (orderId == null || orderId == _activeOrder!.id)) {
      return _activeOrder;
    }
    // 1. Try Local PC Dashboard API
    try {
      final idParam = orderId ?? '';
      final url = idParam.isNotEmpty
          ? '${AppConstants.localBackendApi}/food/orders/$idParam/track'
          : '${AppConstants.localBackendApi}/food/orders';

      final response = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 4));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (idParam.isNotEmpty) {
          return FoodOrder.fromJson(data);
        } else if (data['orders'] is List && (data['orders'] as List).isNotEmpty) {
          return FoodOrder.fromJson((data['orders'] as List).first);
        }
      }
    } catch (_) {}

    // 2. Default Demo Order (Kharghar Route with high-precision waypoints)
    _activeOrder = FoodOrder(
      id: orderId ?? 'ZOM-84920',
      customerName: 'Pooja Verma',
      customerAddress: 'Flat 301, Sector 7, Utsav Chowk Circle, Kharghar, Navi Mumbai',
      customerLat: 19.03080,
      customerLon: 73.07220,
      restaurantName: 'Behrouz Biryani',
      restaurantLat: 19.03580,
      restaurantLon: 73.06740,
      status: 'out_for_delivery',
      statusTitle: 'Rider On The Way',
      statusMessage: 'Ramesh Kumar is en route with your hot food.',
      deliveryOtp: '4829',
      totalAmount: 530,
      driverName: 'Ramesh Kumar',
      driverPhone: '+91 98201 44821',
      driverVehicle: 'Hero Splendor (MH-46-AZ-8921)',
      driverLocation: DriverLocation(
        latitude: 19.03580,
        longitude: 73.06740,
        heading: 45.0,
        speedKmh: 24.0,
        isRealDevice: false,
        updatedAt: DateTime.now(),
      ),
      roadGeometry: khargharDemoRoadGeometry,
      estimatedDeliveryMins: 14,
      items: [
        {'name': 'Dum Gosht Biryani (Mutton)', 'quantity': 1, 'price': 499.0},
        {'name': 'Gulab Jamun with Rabdi', 'quantity': 1, 'price': 149.0},
      ],
      isRealMode: false,
    );

    return _activeOrder;
  }

  // Update Driver Location from mobile device GPS
  Future<void> updateDriverGpsLocation({
    required String orderId,
    required double latitude,
    required double longitude,
    double heading = 0.0,
    double speed = 0.0,
  }) async {
    final updatedLoc = DriverLocation(
      latitude: latitude,
      longitude: longitude,
      heading: heading,
      speedKmh: speed,
      isRealDevice: true,
      updatedAt: DateTime.now(),
    );

    // 0. Update in-memory active order & broadcast immediately
    if (_activeOrder != null && (orderId == _activeOrder!.id || orderId.isEmpty)) {
      _activeOrder = _activeOrder!.copyWith(driverLocation: updatedLoc);
      _orderController.add(_activeOrder!);
    }
    _driverLocController.add(updatedLoc);

    // 1. Broadcast via HTTP to local backend if running
    try {
      await http.post(
        Uri.parse('${AppConstants.localBackendApi}/food/orders/$orderId/driver-location'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'latitude': latitude,
          'longitude': longitude,
          'heading': heading,
          'speed': speed,
          'is_real_device': true,
        }),
      ).timeout(const Duration(milliseconds: 1500));
    } catch (_) {}

    // 2. Broadcast via Firebase Firestore for Cross-Device Sync
    if (_useFirebase && _firestore != null) {
      try {
        await _firestore!.collection('driver_locations').doc(orderId).set({
          'order_id': orderId,
          'latitude': latitude,
          'longitude': longitude,
          'heading': heading,
          'speed': speed,
          'is_real_device': true,
          'updated_at': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));
      } catch (e) {
        debugPrint('Firestore GPS sync note: $e');
      }
    }

    // 3. Broadcast via Supabase Realtime (if configured)
    if (_useSupabase && _supabase != null) {
      try {
        await _supabase!.from('driver_locations').upsert({
          'order_id': orderId,
          'latitude': latitude,
          'longitude': longitude,
          'heading': heading,
          'speed': speed,
          'is_real_device': true,
          'updated_at': DateTime.now().toIso8601String(),
        });
      } catch (_) {}
    }
  }

  // Update Order Status (e.g. from Kitchen or Driver)
  Future<bool> updateOrderStatus(String orderId, String status) async {
    String title = 'Order Updated';
    String message = 'Status has changed.';

    if (status == 'preparing') {
      title = 'Food Being Prepared';
      message = 'The chef is cooking your dishes fresh in the kitchen.';
    } else if (status == 'ready_for_pickup') {
      title = 'Food Packed & Ready';
      message = 'Your order is packed hot and awaiting rider pickup.';
    } else if (status == 'out_for_delivery') {
      title = 'Rider On The Way';
      message = 'Rider has picked up your food and is moving on the road.';
    } else if (status == 'delivered') {
      title = 'Order Delivered ✅';
      message = 'Food was delivered successfully at your doorstep. Bon appétit!';
    }

    if (_activeOrder != null && (orderId == _activeOrder!.id || orderId.isEmpty)) {
      _activeOrder = _activeOrder!.copyWith(
        status: status,
        statusTitle: title,
        statusMessage: message,
      );
      _orderController.add(_activeOrder!);
    }

    // 1. Try Local PC Dashboard API
    try {
      await http.post(
        Uri.parse('${AppConstants.localBackendApi}/food/orders/$orderId/status'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'status': status}),
      );
    } catch (_) {}

    // 2. Try Firebase Firestore
    if (_useFirebase && _firestore != null) {
      try {
        await _firestore!.collection('orders').doc(orderId).update({
          'status': status,
          'status_title': title,
          'status_message': message,
          'updated_at': FieldValue.serverTimestamp(),
        });
      } catch (_) {}
    }
    return true;
  }

  // Stream live Driver GPS from Firebase Firestore or in-memory
  Stream<DriverLocation>? streamDriverGps(String orderId) {
    if (_useFirebase && _firestore != null) {
      return _firestore!
          .collection('driver_locations')
          .doc(orderId)
          .snapshots()
          .where((snap) => snap.exists && snap.data() != null)
          .map((snap) {
        final d = snap.data()!;
        return DriverLocation(
          latitude: (d['latitude'] as num).toDouble(),
          longitude: (d['longitude'] as num).toDouble(),
          heading: (d['heading'] as num?)?.toDouble() ?? 0.0,
          speedKmh: (d['speed'] as num?)?.toDouble() ?? 0.0,
          isRealDevice: true,
          updatedAt: DateTime.now(),
        );
      });
    }
    return _driverLocController.stream;
  }

  // Verify OTP (Driver Doorstep Delivery)
  Future<Map<String, dynamic>> verifyOtp(String orderId, String otp) async {
    final cleanOtp = otp.trim();

    // 0. Check in-memory active order
    if (_activeOrder != null && (orderId == _activeOrder!.id || orderId.isEmpty)) {
      final expectedOtp = _activeOrder!.deliveryOtp.trim();
      if (cleanOtp == expectedOtp || (!_activeOrder!.isRealMode && cleanOtp == '4829')) {
        _activeOrder = _activeOrder!.copyWith(
          status: 'delivered',
          statusTitle: 'Order Delivered ✅',
          statusMessage: 'Delivered successfully at doorstep! Payout credited to driver wallet.',
        );
        _orderController.add(_activeOrder!);

        if (_useFirebase && _firestore != null) {
          try {
            await _firestore!.collection('orders').doc(_activeOrder!.id).update({
              'status': 'delivered',
              'delivered_at': FieldValue.serverTimestamp(),
            });
          } catch (_) {}
        }

        return {'success': true};
      } else {
        return {'success': false, 'error': 'Invalid OTP ($cleanOtp). Ask customer for their 4-digit code.'};
      }
    }

    try {
      final res = await http.post(
        Uri.parse('${AppConstants.localBackendApi}/food/orders/$orderId/verify-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'otp': cleanOtp}),
      );
      if (res.statusCode == 200) {
        return {'success': true};
      }
      final err = jsonDecode(res.body);
      return {'success': false, 'error': err['error'] ?? 'Invalid OTP'};
    } catch (_) {
      // Offline fallback verification
      if (cleanOtp == '4829') {
        return {'success': true};
      }
      return {'success': false, 'error': 'Invalid OTP. (Demo expected: 4829)'};
    }
  }
}
