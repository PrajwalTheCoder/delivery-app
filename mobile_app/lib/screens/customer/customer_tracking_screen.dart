import 'dart:async';
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

class _CustomerTrackingScreenState extends State<CustomerTrackingScreen> {
  final DeliveryService _service = DeliveryService();
  final MapController _mapController = MapController();

  FoodOrder? _order;
  bool _loading = true;
  Timer? _pollTimer;

  // Live Rider Position
  LatLng _riderPosition = const LatLng(19.0352, 73.0676);

  @override
  void initState() {
    super.initState();
    _fetchOrder();
    // Poll every 3 seconds to reflect real phone GPS updates
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (_) => _fetchOrder(silent: true));
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchOrder({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    final order = await _service.getActiveOrder(widget.orderId);
    if (mounted && order != null) {
      setState(() {
        _order = order;
        _riderPosition = LatLng(
          order.driverLocation.latitude,
          order.driverLocation.longitude,
        );
        _loading = false;
      });
    }
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
      polylinePoints = [_riderPosition, customerLatLng];
    }

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
            Text(
              'Order #${order.id}',
              style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 14),
            ),
            Text(
              order.restaurantName,
              style: TextStyle(color: Colors.grey.shade600, fontSize: 11),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Color(0xFFFC8019)),
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
              initialCenter: _riderPosition,
              initialZoom: 14.5,
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
                      strokeWidth: 5.0,
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
                  // Live Delivery Scooter Pin
                  Marker(
                    point: _riderPosition,
                    width: 50,
                    height: 50,
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFFC8019),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2.5),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFFC8019).withOpacity(0.6),
                            blurRadius: 10,
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Text('🛵', style: TextStyle(fontSize: 22)),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Top Live Status Tag
          Positioned(
            top: 16,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.95),
                borderRadius: BorderRadius.circular(16),
                boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 8)],
              ),
              child: Row(
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: const BoxDecoration(
                      color: Colors.green,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      order.driverLocation.isRealDevice
                          ? 'Streaming Live from Driver Phone GPS'
                          : 'OSRM Road Navigation Active',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
                    ),
                  ),
                  Text(
                    '${order.estimatedDeliveryMins} mins',
                    style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFFC8019), fontSize: 13),
                  ),
                ],
              ),
            ),
          ),

          // Bottom Swiggy/Zomato Sheet Card
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 16)],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Status Header & OTP Box
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            order.statusTitle,
                            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
                          ),
                          Text(
                            order.statusMessage,
                            style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFC8019).withOpacity(0.12),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFFC8019)),
                        ),
                        child: Column(
                          children: [
                            const Text(
                              'DELIVERY OTP',
                              style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Color(0xFFFC8019)),
                            ),
                            Text(
                              order.deliveryOtp,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 2,
                                color: Color(0xFFFC8019),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const Divider(height: 24),

                  // Delivery Rider Profile Card
                  Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade200,
                          shape: BoxShape.circle,
                        ),
                        child: const Center(child: Text('🛵', style: TextStyle(fontSize: 22))),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              order.driverName,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            Text(
                              order.driverVehicle,
                              style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                            ),
                          ],
                        ),
                      ),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green.shade700,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        ),
                        onPressed: () => _callDriver(order.driverPhone),
                        icon: const Icon(Icons.phone, size: 16, color: Colors.white),
                        label: const Text('Call', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
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
