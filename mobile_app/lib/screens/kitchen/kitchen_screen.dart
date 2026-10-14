import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../../models/models.dart';
import '../../services/delivery_service.dart';

class KitchenScreen extends StatefulWidget {
  const KitchenScreen({super.key});

  @override
  State<KitchenScreen> createState() => _KitchenScreenState();
}

class _KitchenScreenState extends State<KitchenScreen> {
  final DeliveryService _service = DeliveryService();
  FoodOrder? _order;
  bool _loading = true;
  StreamSubscription<FoodOrder>? _orderSub;
  Timer? _pollTimer;

  // Real Phone GPS Station State
  Position? _kitchenPosition;
  bool _isBroadcastingKitchen = false;
  String? _kitchenGpsStatus;

  @override
  void initState() {
    super.initState();
    _initKitchenGps();
    _fetchOrder();
    _orderSub = _service.onOrderUpdate.listen((order) {
      if (mounted) setState(() => _order = order);
    });

    // Auto-poll every 2.5 seconds for new customer orders or rider updates
    _pollTimer = Timer.periodic(const Duration(milliseconds: 2500), (_) {
      _fetchOrder(silent: true);
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _orderSub?.cancel();
    super.dispose();
  }

  // Detect physical phone GPS and broadcast as the Live Kitchen station
  Future<void> _initKitchenGps() async {
    setState(() => _kitchenGpsStatus = 'Acquiring Kitchen GPS...');
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
        final pos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
        );
        if (mounted) {
          setState(() {
            _kitchenPosition = pos;
            _isBroadcastingKitchen = true;
            _kitchenGpsStatus = 'Broadcasting Live Kitchen Station';
          });
        }

        // Register with Cloud Server
        await _service.registerKitchenLocation(
          name: "Friend's Live Kitchen",
          latitude: pos.latitude,
          longitude: pos.longitude,
          address: 'Live Phone GPS (${pos.latitude.toStringAsFixed(4)}, ${pos.longitude.toStringAsFixed(4)})',
        );
      } else {
        if (mounted) {
          setState(() => _kitchenGpsStatus = 'Location permission denied');
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _kitchenGpsStatus = 'GPS note: $e');
      }
    }
  }

  Future<void> _fetchOrder({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    final order = await _service.getActiveOrder(null, true);
    if (mounted) {
      setState(() {
        _order = order;
        _loading = false;
      });
    }
  }

  Future<void> _updateStatus(String status) async {
    if (_order == null) return;
    await _service.updateOrderStatus(_order!.id, status);
    _fetchOrder(silent: false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F2F5),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Row(
          children: [
            Text('🍳', style: TextStyle(fontSize: 20)),
            SizedBox(width: 8),
            Text(
              'Kitchen Terminal (KDS)',
              style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Color(0xFFE23744)),
            onPressed: () => _fetchOrder(silent: false),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Live Kitchen Phone GPS Station Banner
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                ),
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.12), blurRadius: 10, offset: const Offset(0, 4)),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: _isBroadcastingKitchen ? Colors.green.withOpacity(0.2) : Colors.orange.withOpacity(0.2),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      _isBroadcastingKitchen ? Icons.location_on : Icons.location_searching,
                      color: _isBroadcastingKitchen ? const Color(0xFF10B981) : Colors.orange,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Wrap(
                          crossAxisAlignment: WrapCrossAlignment.center,
                          spacing: 6,
                          runSpacing: 2,
                          children: [
                            const Text(
                              'Live Kitchen Station',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: _isBroadcastingKitchen ? Colors.green.shade600 : Colors.grey.shade700,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                _isBroadcastingKitchen ? 'BROADCASTING' : 'OFFLINE',
                                style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 3),
                        Text(
                          _kitchenPosition != null
                              ? 'GPS: (${_kitchenPosition!.latitude.toStringAsFixed(4)}, ${_kitchenPosition!.longitude.toStringAsFixed(4)})'
                              : (_kitchenGpsStatus ?? 'Detecting location...'),
                          style: TextStyle(color: Colors.grey.shade300, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.my_location, color: Colors.white70, size: 20),
                    onPressed: _initKitchenGps,
                    tooltip: 'Refresh Kitchen GPS',
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Order Section
            _loading
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 40),
                      child: CircularProgressIndicator(color: Color(0xFFE23744)),
                    ),
                  )
                : _order == null
                    ? Container(
                        padding: const EdgeInsets.all(32),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Column(
                          children: [
                            const Text('🍽️', style: TextStyle(fontSize: 48)),
                            const SizedBox(height: 12),
                            const Text(
                              'Waiting for Customer Orders...',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'When your friend places an order in Customer mode, it will appear here in real time.',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                            ),
                          ],
                        ),
                      )
                    : Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(22),
                          boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 8)],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Order #${_order!.id}',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                    ),
                                    Text(
                                      _order!.restaurantName,
                                      style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                                    ),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.orange.shade100,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    _order!.statusTitle,
                                    style: TextStyle(
                                      color: Colors.orange.shade900,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                    ),
                                  ),
                                ),
                              ],
                            ),

                            const Divider(height: 24),

                            const Text(
                              'Dishes to Prepare:',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            const SizedBox(height: 10),

                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade50,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: Colors.grey.shade200),
                              ),
                              child: Column(
                                children: _order!.items.map((it) {
                                  final name = it['name']?.toString() ?? 'Dish';
                                  final qty = it['quantity'] ?? 1;
                                  final price = (it['price'] as num?)?.toDouble() ?? 0.0;
                                  final total = (it['total'] as num?)?.toDouble() ?? (price * (qty as num));
                                  return Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 4),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text('$qty × $name', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                        Text('₹${total.toStringAsFixed(0)}', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                                      ],
                                    ),
                                  );
                                }).toList(),
                              ),
                            ),

                            const SizedBox(height: 16),

                            Row(
                              children: [
                                const Icon(Icons.person_pin, size: 18, color: Colors.grey),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Customer: ${_order!.customerName}',
                                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                      ),
                                      Text(
                                        _order!.customerAddress,
                                        style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),

                            const SizedBox(height: 16),

                            // Live Rider GPS Telemetry Preview for Kitchen
                            if (_order!.status == 'out_for_delivery' || _order!.status == 'ready_for_pickup')
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(12),
                                margin: const EdgeInsets.only(bottom: 16),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF0FDF4),
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(color: const Color(0xFFBBF7D0)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        const Text('🛵', style: TextStyle(fontSize: 16)),
                                        const SizedBox(width: 8),
                                        Text(
                                          'Rider ${_order!.driverName} Live Telemetry',
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF15803D)),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      'Rider Position: (${_order!.driverLocation.latitude.toStringAsFixed(4)}, ${_order!.driverLocation.longitude.toStringAsFixed(4)})',
                                      style: TextStyle(fontSize: 11, color: Colors.grey.shade800),
                                    ),
                                    Text(
                                      'Speed: ${_order!.driverLocation.speedKmh.toStringAsFixed(0)} km/h • Remaining ETA: ${_order!.estimatedDeliveryMins} mins',
                                      style: TextStyle(fontSize: 11, color: Colors.grey.shade700),
                                    ),
                                  ],
                                ),
                              ),

                            // Action buttons
                            if (_order!.status == 'placed')
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFFFC8019),
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                  ),
                                  onPressed: () => _updateStatus('preparing'),
                                  child: const Text(
                                    'Accept & Start Cooking',
                                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ),

                            if (_order!.status == 'preparing')
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.green.shade700,
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                  ),
                                  onPressed: () => _updateStatus('ready_for_pickup'),
                                  child: const Text(
                                    'Mark Food Packed & Ready for Pickup',
                                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ),

                            if (_order!.status == 'ready_for_pickup')
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.blue.shade50,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: Colors.blue.shade200),
                                ),
                                child: const Text(
                                  'Food packed! Awaiting delivery rider collection.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: Colors.blue, fontWeight: FontWeight.bold, fontSize: 12),
                                ),
                              ),

                            if (_order!.status == 'out_for_delivery')
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.purple.shade50,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: Colors.purple.shade200),
                                ),
                                child: const Text(
                                  'Picked up! Rider is navigating on real roads to customer.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: Colors.purple, fontWeight: FontWeight.bold, fontSize: 12),
                                ),
                              ),

                            if (_order!.status == 'delivered')
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.green.shade50,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: Colors.green.shade200),
                                ),
                                child: const Text(
                                  '✅ Order Delivered Successfully at Doorstep!',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 12),
                                ),
                              ),
                          ],
                        ),
                      ),
          ],
        ),
      ),
    );
  }
}
