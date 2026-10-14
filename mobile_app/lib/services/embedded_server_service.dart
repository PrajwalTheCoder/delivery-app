import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'package:flutter/foundation.dart';

/// Embedded HTTP Server for Android Device Hub Mode.
/// Runs directly on the Realme smartphone so all 3 roles (Customer, Kitchen, Driver)
/// can communicate in real time over Wi-Fi Hotspot with ZERO LAPTOP REQUIRED!
class EmbeddedServerService {
  static final EmbeddedServerService _instance = EmbeddedServerService._internal();
  factory EmbeddedServerService() => _instance;
  EmbeddedServerService._internal();

  HttpServer? _server;
  bool get isRunning => _server != null;
  int port = 5050;
  String detectedIp = '192.168.43.1';

  final StreamController<bool> _statusController = StreamController<bool>.broadcast();
  Stream<bool> get onStatusChanged => _statusController.stream;

  // In-memory data store matching Python backend
  Map<String, dynamic>? liveKitchenLocation;
  final Map<String, Map<String, dynamic>> _liveOrders = {};

  // Standard restaurants catalog
  final List<Map<String, dynamic>> _catalogRestaurants = [
    {
      "id": "rest-behrouz-kharghar",
      "name": "Behrouz Biryani",
      "tagline": "Royal & Authentic Dum Biryani",
      "cuisines": ["Biryani", "North Indian", "Mughlai", "Desserts"],
      "rating": 4.6,
      "rating_count": "1.8K+",
      "cost_for_two": 450,
      "prep_time_minutes": 18,
      "is_veg": false,
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
          "is_veg": false,
          "rating": 4.7,
          "description": "Tender pieces of mutton slow cooked with aromatic long-grain Basmati rice, saffron, and royal spices.",
          "image": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80",
          "bestseller": true
        },
        {
          "id": "item-bb-2",
          "name": "Subz-e-Biryani (Veg Dum)",
          "category": "Biryani",
          "price": 349,
          "is_veg": true,
          "rating": 4.5,
          "description": "Fresh seasonal vegetables, paneer cubes, and basmati rice infused with whole cardamom and rose water.",
          "image": "https://images.unsplash.com/photo-1642821373181-696a54913e93?w=500&auto=format&fit=crop&q=80",
          "bestseller": true
        },
        {
          "id": "item-bb-4",
          "name": "Gulab Jamun with Rabdi",
          "category": "Desserts",
          "price": 149,
          "is_veg": true,
          "rating": 4.8,
          "description": "Warm melt-in-mouth gulab jamuns served on a bed of thick saffron infused rabdi.",
          "image": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80",
          "bestseller": true
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
      "is_veg": false,
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
          "is_veg": true,
          "rating": 4.6,
          "description": "Delightful combination of onion, crisp capsicum, grilled mushroom, and fresh juicy tomatoes.",
          "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
          "bestseller": true
        },
        {
          "id": "item-dom-3",
          "name": "Stuffed Garlic Breadsticks",
          "category": "Sides",
          "price": 169,
          "is_veg": true,
          "rating": 4.8,
          "description": "Freshly baked garlic bread stuffed with creamy jalapeño cheese dip and sweet corn.",
          "image": "https://images.unsplash.com/photo-1619881589637-83d81b953d3d?w=500&auto=format&fit=crop&q=80",
          "bestseller": true
        }
      ]
    }
  ];

  /// Start embedded HTTP server on port 5050
  Future<bool> startServer() async {
    if (_server != null) return true;

    try {
      // Find local IP
      detectedIp = await _findLocalIp();

      _server = await HttpServer.bind(
        InternetAddress.anyIPv4,
        port,
        shared: true,
      );

      debugPrint('⚡ RouteWise On-Device Hub Server running on http://$detectedIp:$port');
      _statusController.add(true);

      _server!.listen(
        _handleRequest,
        onError: (e) {
          debugPrint('On-device server error: $e');
        },
      );
      return true;
    } catch (e) {
      debugPrint('Failed to start on-device server: $e');
      _server = null;
      _statusController.add(false);
      return false;
    }
  }

  /// Stop server
  Future<void> stopServer() async {
    await _server?.close(force: true);
    _server = null;
    _statusController.add(false);
  }

  Future<String> _findLocalIp() async {
    try {
      for (final interface in await NetworkInterface.list()) {
        for (final addr in interface.addresses) {
          if (addr.type == InternetAddressType.IPv4 && !addr.isLoopback) {
            return addr.address;
          }
        }
      }
    } catch (_) {}
    return '192.168.43.1'; // standard Android Personal Hotspot IP
  }

  /// Request Router & Dispatcher
  Future<void> _handleRequest(HttpRequest request) async {
    // 1. CORS Headers
    request.response.headers.add('Access-Control-Allow-Origin', '*');
    request.response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    request.response.headers.add('Access-Control-Allow-Headers', '*');
    request.response.headers.add('Content-Type', 'application/json; charset=utf-8');

    if (request.method == 'OPTIONS') {
      request.response.statusCode = HttpStatus.ok;
      await request.response.close();
      return;
    }

    final path = request.uri.path;
    final method = request.method;

    try {
      // Health / Status Check
      if (path == '/' || path == '/api/v1/health' || path == '/health') {
        _sendJson(request, {
          'status': 'ok',
          'engine': 'RouteWise On-Device Edge Hub',
          'device': 'Realme Mobile Smartphone',
          'active_orders': _liveOrders.length,
          'kitchen_registered': liveKitchenLocation != null,
        });
        return;
      }

      // 1. Kitchen Location
      if (path == '/api/v1/food/kitchen/location' || path == '/food/kitchen/location') {
        if (method == 'POST') {
          final body = await _readJsonBody(request);
          liveKitchenLocation = {
            'name': body['name'] ?? "Friend's Live Kitchen",
            'latitude': (body['latitude'] as num?)?.toDouble() ?? 19.0358,
            'longitude': (body['longitude'] as num?)?.toDouble() ?? 73.0674,
            'address': body['address'] ?? 'Live Phone GPS Station',
            'updated_at': DateTime.now().millisecondsSinceEpoch,
          };
          _sendJson(request, {
            'message': 'Kitchen registered successfully on mobile hub',
            'kitchen': liveKitchenLocation,
          });
        } else {
          _sendJson(request, {
            'kitchen': liveKitchenLocation,
          });
        }
        return;
      }

      // 2. Restaurants Catalog
      if (path == '/api/v1/food/restaurants' || path == '/food/restaurants') {
        final results = <Map<String, dynamic>>[];

        // If kitchen is registered, inject at the top
        if (liveKitchenLocation != null && liveKitchenLocation!['latitude'] != null) {
          final kLat = (liveKitchenLocation!['latitude'] as num).toDouble();
          final kLon = (liveKitchenLocation!['longitude'] as num).toDouble();
          results.add({
            'id': 'rest-live-kitchen',
            'name': '🍳 ${liveKitchenLocation!['name']}',
            'tagline': "Real-time Kitchen Station from Friend's Phone GPS",
            'cuisines': ['Fresh Kitchen', 'Biryani', 'Burgers', 'Chai', 'Fast Food'],
            'rating': 4.95,
            'rating_count': 'Live',
            'cost_for_two': 250,
            'prep_time_minutes': 10,
            'is_veg': false,
            'address': liveKitchenLocation!['address'],
            'locality': "Friend's Real Location",
            'city': 'Navi Mumbai',
            'latitude': kLat,
            'longitude': kLon,
            'phone': '+91 99200 11223',
            'image': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
            'badge': '⚡ Live Phone GPS',
            'discount': 'FLAT 30% OFF',
            'distance_km': 0.8,
            'estimated_delivery_mins': 12,
            'delivery_fee': 25,
            'menu': [
              {
                'id': 'item-live-1',
                'name': 'Special Dum Gosht Biryani',
                'category': 'Biryani',
                'price': 349,
                'is_veg': false,
                'rating': 4.9,
                'description': 'Hot Basmati rice infused with saffron and tender spices.',
                'image': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500',
                'bestseller': true,
              },
              {
                'id': 'item-live-2',
                'name': 'Crispy Paneer Burger',
                'category': 'Burgers',
                'price': 189,
                'is_veg': true,
                'rating': 4.7,
                'description': 'Crispy herb patty with melted cheddar and chipotle mayo.',
                'image': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
                'bestseller': true,
              },
              {
                'id': 'item-live-3',
                'name': 'Garlic Breadsticks with Dip',
                'category': 'Sides',
                'price': 129,
                'is_veg': true,
                'rating': 4.8,
                'description': 'Freshly baked herb breadsticks with creamy garlic dip.',
                'image': 'https://images.unsplash.com/photo-1573821663912-569905455b1c?w=500',
                'bestseller': false,
              },
              {
                'id': 'item-live-4',
                'name': 'Hot Ginger Masala Chai',
                'category': 'Beverages',
                'price': 69,
                'is_veg': true,
                'rating': 4.9,
                'description': 'Freshly brewed spiced tea with crushed ginger and cardamom.',
                'image': 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=500',
                'bestseller': true,
              },
            ],
          });
        }

        results.addAll(_catalogRestaurants);
        _sendJson(request, {'count': results.length, 'restaurants': results});
        return;
      }

      // 3. Orders (Create or List)
      if (path == '/api/v1/food/orders' || path == '/food/orders') {
        if (method == 'POST') {
          final body = await _readJsonBody(request);
          final order = _createOrderFromPayload(body);
          _liveOrders[order['id']] = order;
          _sendJson(request, {
            'message': 'Order placed successfully on phone hub!',
            'order': order,
          }, status: HttpStatus.created);
        } else {
          final list = _liveOrders.values.toList().reversed.toList();
          _sendJson(request, {'count': list.length, 'orders': list});
        }
        return;
      }

      // 4. Order Track / Get by ID
      final trackMatch = RegExp(r'/food/orders/([^/]+)(?:/track)?').firstMatch(path);
      if (trackMatch != null) {
        final orderId = trackMatch.group(1)!;

        // Status update
        if (path.endsWith('/status') && method == 'POST') {
          final body = await _readJsonBody(request);
          final status = body['status']?.toString() ?? 'preparing';
          final order = _liveOrders[orderId] ?? (_liveOrders.isNotEmpty ? _liveOrders.values.last : null);
          if (order != null) {
            order['status'] = status;
            order['status_title'] = _getStatusTitle(status);
            order['status_message'] = _getStatusMessage(status, order['restaurant']?['name'] ?? 'Restaurant');
            for (final step in (order['timeline'] as List? ?? [])) {
              if (step['status'] == status) {
                step['completed'] = true;
                step['timestamp'] = _formatTimeNow();
              }
            }
            _sendJson(request, {'message': "Order status updated to '$status'", 'order': order});
          } else {
            _sendJson(request, {'error': 'Order not found'}, status: HttpStatus.notFound);
          }
          return;
        }

        // Driver GPS Location Sync
        if (path.endsWith('/driver-location') && method == 'POST') {
          final body = await _readJsonBody(request);
          final lat = (body['latitude'] ?? body['lat'] as num?)?.toDouble();
          final lon = (body['longitude'] ?? body['lon'] as num?)?.toDouble();
          final heading = (body['heading'] as num?)?.toDouble() ?? 0.0;
          final speed = (body['speed'] as num?)?.toDouble() ?? 0.0;

          final order = _liveOrders[orderId] ?? (_liveOrders.isNotEmpty ? _liveOrders.values.last : null);
          if (order != null && lat != null && lon != null) {
            order['driver_location'] = {
              'latitude': lat,
              'longitude': lon,
              'heading': heading,
              'speed_kmh': speed,
              'last_updated': DateTime.now().millisecondsSinceEpoch ~/ 1000,
              'is_real_device_connected': true,
            };

            // Haversine remaining distance
            final cLat = (order['customer']?['latitude'] as num?)?.toDouble() ?? 19.0345;
            final cLon = (order['customer']?['longitude'] as num?)?.toDouble() ?? 73.0678;
            final remDist = _haversineKm(lat, lon, cLat, cLon);
            order['distance_km'] = double.parse(remDist.toStringAsFixed(2));
            order['estimated_delivery_mins'] = max(1, (remDist * 3.5).toInt());

            if (order['status'] == 'ready_for_pickup' || order['status'] == 'picked_up') {
              order['status'] = 'out_for_delivery';
              order['status_title'] = 'Rider On The Way';
              order['status_message'] = 'Rider is en route with your food.';
            }

            _sendJson(request, {
              'message': 'Driver location updated on phone hub',
              'driver_location': order['driver_location'],
              'remaining_distance_km': order['distance_km'],
              'remaining_eta_mins': order['estimated_delivery_mins'],
            });
          } else {
            _sendJson(request, {'error': 'Order or coords missing'}, status: HttpStatus.notFound);
          }
          return;
        }

        // Verify OTP
        if (path.endsWith('/verify-otp') && method == 'POST') {
          final body = await _readJsonBody(request);
          final otp = body['otp']?.toString().trim();
          final order = _liveOrders[orderId] ?? (_liveOrders.isNotEmpty ? _liveOrders.values.last : null);
          if (order != null) {
            if (order['delivery_otp'] == otp) {
              order['status'] = 'delivered';
              order['status_title'] = 'Order Delivered';
              order['status_message'] = 'Enjoy your hot meal! Verification complete via OTP.';
              for (final step in (order['timeline'] as List? ?? [])) {
                if (step['status'] == 'delivered') {
                  step['completed'] = true;
                  step['timestamp'] = _formatTimeNow();
                }
              }
              _sendJson(request, {'success': true, 'message': 'OTP Verified! Order marked as Delivered.'});
            } else {
              _sendJson(request, {'success': false, 'error': 'Invalid OTP code. Please ask the customer.'}, status: HttpStatus.badRequest);
            }
          } else {
            _sendJson(request, {'success': false, 'error': 'Order not found'}, status: HttpStatus.notFound);
          }
          return;
        }

        // Standard GET Order or Track
        final order = _liveOrders[orderId] ?? (_liveOrders.isNotEmpty ? _liveOrders.values.last : null);
        if (order != null) {
          _sendJson(request, order);
        } else {
          _sendJson(request, {'error': 'Order not found'}, status: HttpStatus.notFound);
        }
        return;
      }

      // Default 404
      _sendJson(request, {'error': 'Not found'}, status: HttpStatus.notFound);
    } catch (e) {
      debugPrint('Error handling request in on-device hub: $e');
      _sendJson(request, {'error': e.toString()}, status: HttpStatus.internalServerError);
    }
  }

  Map<String, dynamic> _createOrderFromPayload(Map<String, dynamic> body) {
    final rng = Random();
    final orderId = body['id']?.toString() ?? 'RW-${10000 + rng.nextInt(90000)}';
    final otp = body['delivery_otp']?.toString() ?? '${1000 + rng.nextInt(9000)}';

    final restLat = (body['restaurant_latitude'] as num?)?.toDouble() ?? 19.0358;
    final restLon = (body['restaurant_longitude'] as num?)?.toDouble() ?? 73.0674;
    final restName = body['restaurant_name']?.toString() ?? 'Kitchen Station';
    final restAddr = body['restaurant_address']?.toString() ?? 'Navi Mumbai';

    final custLat = (body['customer_latitude'] as num?)?.toDouble() ?? 19.0308;
    final custLon = (body['customer_longitude'] as num?)?.toDouble() ?? 73.0722;
    final custName = body['customer_name']?.toString() ?? 'Rahul Sharma';
    final custAddr = body['customer_address']?.toString() ?? 'College Campus';

    final items = (body['items'] as List?) ?? [
      {'name': 'Special Dum Biryani', 'quantity': 1, 'price': 349.0, 'total': 349.0}
    ];

    final dist = _haversineKm(restLat, restLon, custLat, custLon);
    final eta = max(10, 8 + (dist * 3.5).toInt());

    // Generate road points if not provided
    List<dynamic> geometry = (body['road_geometry'] as List?) ?? [];
    if (geometry.length < 2) {
      geometry = [
        [restLat, restLon],
        [restLat + (custLat - restLat) * 0.33, restLon + (custLon - restLon) * 0.33],
        [restLat + (custLat - restLat) * 0.66, restLon + (custLon - restLon) * 0.66],
        [custLat, custLon],
      ];
    }

    final driverLat = (body['driver_latitude'] as num?)?.toDouble() ?? restLat;
    final driverLon = (body['driver_longitude'] as num?)?.toDouble() ?? restLon;

    return {
      'id': orderId,
      'order_id': orderId,
      'status': body['status']?.toString() ?? 'placed',
      'status_title': 'Order Confirmed!',
      'status_message': '$restName has received your order.',
      'delivery_otp': otp,
      'is_real_mode': body['is_real_mode'] ?? true,
      'customer': {
        'name': custName,
        'phone': '+91 98765 43210',
        'address': custAddr,
        'latitude': custLat,
        'longitude': custLon,
      },
      'restaurant': {
        'id': body['restaurant_id'] ?? 'rest-1',
        'name': restName,
        'address': restAddr,
        'phone': '+91 99200 11223',
        'image': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
        'latitude': restLat,
        'longitude': restLon,
      },
      'rider': {
        'id': 'rider-1',
        'name': 'Ramesh Kumar (RouteWise Rider)',
        'phone': '+91 98201 44821',
        'vehicle': 'Hero Splendor (MH-46-AZ-8921)',
        'vehicle_type': 'Motorcycle',
        'rating': 4.9,
        'trips': 1420,
        'avatar': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      },
      'driver_location': {
        'latitude': driverLat,
        'longitude': driverLon,
        'heading': 45.0,
        'speed_kmh': 24.0,
        'last_updated': DateTime.now().millisecondsSinceEpoch ~/ 1000,
        'is_real_device_connected': true,
      },
      'items': items,
      'bill': {
        'item_total': 349.0,
        'delivery_fee': 25.0,
        'platform_fee': 6.0,
        'taxes': 18.0,
        'grand_total': 398.0,
      },
      'distance_km': double.parse(dist.toStringAsFixed(2)),
      'estimated_delivery_mins': eta,
      'road_geometry': geometry,
      'timeline': [
        {'status': 'placed', 'title': 'Order Placed', 'timestamp': _formatTimeNow(), 'completed': true},
        {'status': 'preparing', 'title': 'Cooking in Kitchen', 'timestamp': '', 'completed': false},
        {'status': 'ready_for_pickup', 'title': 'Ready for Pickup', 'timestamp': '', 'completed': false},
        {'status': 'out_for_delivery', 'title': 'Rider on the Way', 'timestamp': '', 'completed': false},
        {'status': 'delivered', 'title': 'Delivered', 'timestamp': '', 'completed': false},
      ],
    };
  }

  String _getStatusTitle(String status) {
    switch (status) {
      case 'placed':
        return 'Order Confirmed!';
      case 'preparing':
        return 'Kitchen is Cooking';
      case 'ready_for_pickup':
        return 'Food Ready for Pickup';
      case 'out_for_delivery':
        return 'Rider On The Way';
      case 'delivered':
        return 'Order Delivered';
      default:
        return 'Order Active';
    }
  }

  String _getStatusMessage(String status, String restaurantName) {
    switch (status) {
      case 'placed':
        return '$restaurantName has received your order.';
      case 'preparing':
        return '$restaurantName is preparing your fresh meal.';
      case 'ready_for_pickup':
        return 'Food is packed and ready for delivery partner pickup.';
      case 'out_for_delivery':
        return 'Rider has picked up the meal and is navigating to you.';
      case 'delivered':
        return 'Enjoy your meal! Verified by OTP.';
      default:
        return 'Delivery in progress.';
    }
  }

  String _formatTimeNow() {
    final now = DateTime.now();
    final hour = now.hour > 12 ? now.hour - 12 : (now.hour == 0 ? 12 : now.hour);
    final ampm = now.hour >= 12 ? 'PM' : 'AM';
    final min = now.minute.toString().padLeft(2, '0');
    return '$hour:$min $ampm';
  }

  double _haversineKm(double lat1, double lon1, double lat2, double lon2) {
    const r = 6371.0;
    final dLat = (lat2 - lat1) * (pi / 180);
    final dLon = (lon2 - lon1) * (pi / 180);
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1 * (pi / 180)) * cos(lat2 * (pi / 180)) * sin(dLon / 2) * sin(dLon / 2);
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return r * c;
  }

  Future<Map<String, dynamic>> _readJsonBody(HttpRequest request) async {
    try {
      final content = await utf8.decoder.bind(request).join();
      if (content.isEmpty) return {};
      return jsonDecode(content) as Map<String, dynamic>;
    } catch (_) {
      return {};
    }
  }

  void _sendJson(HttpRequest request, dynamic data, {int status = HttpStatus.ok}) {
    request.response.statusCode = status;
    request.response.write(jsonEncode(data));
    request.response.close();
  }
}
