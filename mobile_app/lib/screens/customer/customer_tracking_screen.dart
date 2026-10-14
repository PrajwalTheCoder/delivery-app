import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/models.dart';
import '../../services/delivery_service.dart';

class CustomerTrackingScreen extends StatefulWidget {
  final String? orderId;
  const CustomerTrackingScreen({super.key, this.orderId});

  @override
  State<CustomerTrackingScreen> createState() => _CustomerTrackingScreenState();
}

class _CustomerTrackingScreenState extends State<CustomerTrackingScreen>
    with SingleTickerProviderStateMixin {
  final DeliveryService _service = DeliveryService();
  final MapController _mapController = MapController();

  late FoodOrder? _order = _service.currentOrder;
  late bool _loading = _order == null;
  Timer? _pollTimer;
  Timer? _simulationTimer;

  // Zomato Smooth Rider Animation Controller
  late AnimationController _animController;
  LatLng _prevRiderPosition = const LatLng(19.0358, 73.0674);
  LatLng _targetRiderPosition = const LatLng(19.0358, 73.0674);
  LatLng _currentRiderPosition = const LatLng(19.0358, 73.0674);

  double _prevHeading = 0.0;
  double _targetHeading = 0.0;
  double _currentHeading = 0.0;

  double _currentSpeedKmh = 24.0;
  double _distanceRemainingMeters = 1200.0;
  int _predictedEtaMinutes = 6;

  // Simulation mode index along road geometry
  int _simStepIndex = 0;
  bool _isSimulating = false;

  @override
  void initState() {
    super.initState();

    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    );

    _animController.addListener(() {
      final t = Curves.easeInOutCubic.transform(_animController.value);
      setState(() {
        _currentRiderPosition = LatLng(
          _prevRiderPosition.latitude +
              (_targetRiderPosition.latitude - _prevRiderPosition.latitude) * t,
          _prevRiderPosition.longitude +
              (_targetRiderPosition.longitude - _prevRiderPosition.longitude) * t,
        );

        // Smooth heading angular interpolation
        double diff = _targetHeading - _prevHeading;
        while (diff < -180) {
          diff += 360;
        }
        while (diff > 180) {
          diff -= 360;
        }
        _currentHeading = _prevHeading + diff * t;
      });
    });

    _fetchOrder();

    // Listen to real-time driver GPS telemetry
    _driverLocSub = _service.onDriverLocationUpdate.listen((loc) {
      if (mounted && !_isSimulating) {
        _onNewRiderTelemetry(
          newPosition: LatLng(loc.latitude, loc.longitude),
          heading: loc.heading,
          speed: loc.speedKmh,
        );
      }
    });

    // Listen to real-time order lifecycle changes (status updates, delivered, etc.)
    _orderSub = _service.onOrderUpdate.listen((updated) {
      if (mounted && (widget.orderId == null || widget.orderId == updated.id)) {
        setState(() => _order = updated);
      }
    });

    // Poll every 2.5s for real GPS updates from driver device or cloud
    _pollTimer = Timer.periodic(const Duration(milliseconds: 2500), (_) {
      if (!_isSimulating) {
        _fetchOrder(silent: true);
      }
    });
  }

  StreamSubscription<DriverLocation>? _driverLocSub;
  StreamSubscription<FoodOrder>? _orderSub;

  @override
  void dispose() {
    _animController.dispose();
    _driverLocSub?.cancel();
    _orderSub?.cancel();
    _pollTimer?.cancel();
    _simulationTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchOrder({bool silent = false}) async {
    if (!silent && _order == null) setState(() => _loading = true);
    final order = await _service.getActiveOrder(widget.orderId);
    if (mounted && order != null) {
      final newPos = LatLng(
        order.driverLocation.latitude,
        order.driverLocation.longitude,
      );

      _onNewRiderTelemetry(
        newPosition: newPos,
        heading: order.driverLocation.heading,
        speed: order.driverLocation.speedKmh,
      );

      setState(() {
        _order = order;
        _loading = false;
      });
    }
  }

  // Zomato Map-Matching and Telemetry Consumer
  void _onNewRiderTelemetry({
    required LatLng newPosition,
    required double heading,
    required double speed,
  }) {
    if (!mounted) return;

    _prevRiderPosition = _currentRiderPosition;
    _targetRiderPosition = newPosition;

    _prevHeading = _currentHeading;
    _targetHeading = heading;

    _currentSpeedKmh = speed > 2.0 ? speed : 22.0; // Urban average fallback

    // Calculate remaining distance to customer
    if (_order != null) {
      final cust = LatLng(_order!.customerLat, _order!.customerLon);
      _distanceRemainingMeters = _calculateDistanceMeters(_targetRiderPosition, cust);

      // Zomato Dynamic Predictive ETA
      final speedMps = (_currentSpeedKmh * 1000) / 3600;
      final secondsLeft = speedMps > 0 ? (_distanceRemainingMeters / speedMps) : 180;
      _predictedEtaMinutes = max(1, (secondsLeft / 60).round());
    }

    _animController.forward(from: 0.0);
  }

  double _calculateDistanceMeters(LatLng p1, LatLng p2) {
    const r = 6371000.0; // Earth radius in meters
    final dLat = (p2.latitude - p1.latitude) * (pi / 180.0);
    final dLon = (p2.longitude - p1.longitude) * (pi / 180.0);
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(p1.latitude * (pi / 180.0)) *
            cos(p2.latitude * (pi / 180.0)) *
            sin(dLon / 2) *
            sin(dLon / 2);
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return r * c;
  }

  // Toggle Live Ride Simulation along road network
  void _toggleSimulation() {
    if (_isSimulating) {
      _simulationTimer?.cancel();
      setState(() => _isSimulating = false);
      return;
    }

    if (_order == null || _order!.roadGeometry.isEmpty) return;

    setState(() {
      _isSimulating = true;
      _simStepIndex = 0;
    });

    final geom = _order!.roadGeometry;

    _simulationTimer = Timer.periodic(const Duration(milliseconds: 2200), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }

      if (_simStepIndex >= geom.length - 1) {
        timer.cancel();
        setState(() {
          _isSimulating = false;
        });
        return;
      }

      _simStepIndex++;
      final curr = LatLng(geom[_simStepIndex][0], geom[_simStepIndex][1]);
      final prev = LatLng(geom[_simStepIndex - 1][0], geom[_simStepIndex - 1][1]);

      // Calculate bearing
      final dLon = (curr.longitude - prev.longitude) * (pi / 180);
      final y = sin(dLon) * cos(curr.latitude * (pi / 180));
      final x = cos(prev.latitude * (pi / 180)) * sin(curr.latitude * (pi / 180)) -
          sin(prev.latitude * (pi / 180)) * cos(curr.latitude * (pi / 180)) * cos(dLon);
      double bearing = (atan2(y, x) * 180 / pi + 360) % 360;

      _onNewRiderTelemetry(
        newPosition: curr,
        heading: bearing,
        speed: 28.0 + (Random().nextDouble() * 6.0),
      );
    });
  }

  Future<void> _callDriver(String phone) async {
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading && _order == null) {
      return const Scaffold(
        backgroundColor: Color(0xFF121212),
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFFFC8019)),
        ),
      );
    }

    final order = _order!;
    final customerLatLng = LatLng(order.customerLat, order.customerLon);
    final restaurantLatLng = LatLng(order.restaurantLat, order.restaurantLon);

    List<LatLng> polylinePoints = [];
    if (order.roadGeometry.isNotEmpty) {
      polylinePoints = order.roadGeometry.map((p) => LatLng(p[0], p[1])).toList();
    } else {
      polylinePoints = [_currentRiderPosition, customerLatLng];
    }

    // Determine Zomato Live Status Card text & color
    final isNearby = _distanceRemainingMeters < 350;
    final isDelivered = order.status == 'delivered';

    return Scaffold(
      backgroundColor: const Color(0xFF1C1C1E),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Order #${order.id}',
                  style: const TextStyle(
                      color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 14),
                ),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: order.isRealMode ? Colors.green.shade50 : Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: order.isRealMode ? Colors.green : Colors.blue,
                      width: 1,
                    ),
                  ),
                  child: Text(
                    order.isRealMode ? '⚡ REAL GPS' : '🎮 DEMO',
                    style: TextStyle(
                      color: order.isRealMode ? Colors.green.shade800 : Colors.blue.shade800,
                      fontWeight: FontWeight.bold,
                      fontSize: 9,
                    ),
                  ),
                ),
              ],
            ),
            Text(
              order.restaurantName,
              style: TextStyle(color: Colors.grey.shade600, fontSize: 11),
            ),
          ],
        ),
        actions: [
          // Simulate / Play Ride Button (for testing indoor movement)
          IconButton(
            tooltip: _isSimulating ? 'Stop Ride Simulation' : 'Simulate Zomato Rider Movement',
            icon: Icon(
              _isSimulating ? Icons.pause_circle_filled : Icons.play_circle_filled,
              color: const Color(0xFFFC8019),
              size: 26,
            ),
            onPressed: _toggleSimulation,
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.black87),
            onPressed: () => _fetchOrder(),
          ),
        ],
      ),
      body: Stack(
        children: [
          // FlutterMap OpenStreetMap Layer
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _currentRiderPosition,
              initialZoom: 15.0,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.routewise.delivery',
              ),
              // Road Polyline
              if (polylinePoints.isNotEmpty)
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: polylinePoints,
                      color: const Color(0xFFFC8019),
                      strokeWidth: 5.5,
                      borderColor: Colors.white,
                      borderStrokeWidth: 1.5,
                    ),
                  ],
                ),
              // Map Markers
              MarkerLayer(
                markers: [
                  // Restaurant Marker
                  Marker(
                    point: restaurantLatLng,
                    width: 44,
                    height: 44,
                    child: Container(
                      decoration: const BoxDecoration(
                        color: Color(0xFFE23744),
                        shape: BoxShape.circle,
                        boxShadow: [BoxShadow(color: Colors.black38, blurRadius: 6)],
                      ),
                      child: const Center(
                        child: Text('🍳', style: TextStyle(fontSize: 20)),
                      ),
                    ),
                  ),
                  // Customer Destination Pin
                  Marker(
                    point: customerLatLng,
                    width: 44,
                    height: 44,
                    child: Container(
                      decoration: const BoxDecoration(
                        color: Color(0xFF16803D),
                        shape: BoxShape.circle,
                        boxShadow: [BoxShadow(color: Colors.black38, blurRadius: 6)],
                      ),
                      child: const Center(
                        child: Text('🏠', style: TextStyle(fontSize: 20)),
                      ),
                    ),
                  ),
                  // Zomato Smooth Rotating Scooter Pin
                  Marker(
                    point: _currentRiderPosition,
                    width: 58,
                    height: 58,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Glow Halo Pulse
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: const Color(0xFFFC8019).withValues(alpha: 0.35),
                          ),
                        ),
                        // Directional Rotated Scooter
                        Transform.rotate(
                          angle: (_currentHeading * pi / 180),
                          child: Container(
                            width: 42,
                            height: 42,
                            decoration: BoxDecoration(
                              color: const Color(0xFFFC8019),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2.5),
                              boxShadow: const [
                                BoxShadow(color: Colors.black45, blurRadius: 8),
                              ],
                            ),
                            child: const Center(
                              child: Text('🛵', style: TextStyle(fontSize: 20)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Top Floating Zomato Prediction Header
          Positioned(
            top: 14,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF121212),
                borderRadius: BorderRadius.circular(18),
                boxShadow: const [BoxShadow(color: Colors.black38, blurRadius: 12)],
                border: Border.all(color: const Color(0xFF2C2C2E)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: isNearby
                          ? Colors.green.withValues(alpha: 0.2)
                          : const Color(0xFFFC8019).withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      isNearby ? Icons.location_on : Icons.speed,
                      color: isNearby ? Colors.greenAccent : const Color(0xFFFC8019),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isDelivered
                              ? 'Delivered Safely!'
                              : isNearby
                                  ? 'Arriving in 1-2 mins! 🔔'
                                  : (_currentSpeedKmh < 3.0 && !_isSimulating)
                                      ? 'Rider at traffic signal 🚦'
                                      : 'Arriving in ~$_predictedEtaMinutes mins',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        Text(
                          isDelivered
                              ? 'Enjoy your fresh meal'
                              : isNearby
                                  ? 'Rider is approaching your doorstep'
                                  : (_currentSpeedKmh < 3.0 && !_isSimulating)
                                      ? '${(_distanceRemainingMeters / 1000).toStringAsFixed(1)} km away • Resuming motion soon'
                                      : '${(_distanceRemainingMeters / 1000).toStringAsFixed(1)} km away • Moving at ${_currentSpeedKmh.toStringAsFixed(0)} km/h',
                          style: TextStyle(color: Colors.grey.shade400, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  if (_isSimulating)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFC8019),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'RIDING',
                        style: TextStyle(
                            color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Bottom Slide-Up Delivery Info Card
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 16)],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Center drag pill
                  Center(
                    child: Container(
                      width: 36,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Status Header & OTP Box
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isDelivered
                                  ? 'Order Delivered ✅'
                                  : isNearby
                                      ? 'Rider At Doorstep! 🔔'
                                      : order.statusTitle,
                              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                            ),
                            Text(
                              isNearby
                                  ? 'Share 4-digit OTP below to collect food'
                                  : order.statusMessage,
                              style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Delivery OTP Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFC8019).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFFC8019), width: 1.5),
                        ),
                        child: Column(
                          children: [
                            const Text(
                              'GIVE OTP TO RIDER',
                              style: TextStyle(
                                  fontSize: 8,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFFFC8019)),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              order.deliveryOtp,
                              style: const TextStyle(
                                fontSize: 19,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 2.5,
                                color: Color(0xFFFC8019),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const Divider(height: 20),

                  // Items Ordered Summary
                  if (order.items.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'ITEMS ORDERED (${order.items.length})',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey.shade700,
                            letterSpacing: 0.5,
                          ),
                        ),
                        Text(
                          '₹${order.totalAmount.toStringAsFixed(0)} (Paid)',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Colors.green,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Column(
                      children: order.items.map((it) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 2),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '${it['quantity']} × ${it['name']}',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                              ),
                              Text(
                                '₹${it['price'] ?? ''}',
                                style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                    const Divider(height: 18),
                  ],

                  // Delivery Rider Profile Card
                  Row(
                    children: [
                      Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          shape: BoxShape.circle,
                        ),
                        child: const Center(child: Text('🛵', style: TextStyle(fontSize: 20))),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              order.driverName,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            Text(
                              order.driverVehicle,
                              style: TextStyle(fontSize: 10, color: Colors.grey.shade600),
                            ),
                          ],
                        ),
                      ),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green.shade700,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        onPressed: () => _callDriver(order.driverPhone),
                        icon: const Icon(Icons.phone, size: 14, color: Colors.white),
                        label: const Text('Call',
                            style: TextStyle(
                                color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
