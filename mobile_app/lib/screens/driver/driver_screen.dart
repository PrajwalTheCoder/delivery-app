import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/models.dart';
import '../../services/delivery_service.dart';

class DriverScreen extends StatefulWidget {
  const DriverScreen({super.key});

  @override
  State<DriverScreen> createState() => _DriverScreenState();
}

class _DriverScreenState extends State<DriverScreen> {
  final DeliveryService _service = DeliveryService();

  FoodOrder? _activeOrder;
  bool _isOnline = true;
  bool _loading = true;

  // Real Phone GPS Streaming State
  bool _gpsActive = false;
  StreamSubscription<Position>? _positionStream;
  Position? _currentPosition;
  String? _gpsError;

  // OTP Verification
  final TextEditingController _otpController = TextEditingController();
  bool _otpVerifying = false;

  @override
  void initState() {
    super.initState();
    _fetchOrder();
  }

  @override
  void dispose() {
    _positionStream?.cancel();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _fetchOrder() async {
    setState(() => _loading = true);
    final order = await _service.getActiveOrder();
    if (mounted) {
      setState(() {
        _activeOrder = order;
        _loading = false;
      });
    }
  }

  // Toggle Live Smartphone GPS Broadcasting
  Future<void> _toggleGpsBroadcast() async {
    if (_gpsActive) {
      await _positionStream?.cancel();
      setState(() {
        _gpsActive = false;
        _currentPosition = null;
      });
      return;
    }

    // Check location permission
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        setState(() => _gpsError = 'Location permissions are denied.');
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      setState(() => _gpsError = 'Location permissions are permanently denied.');
      return;
    }

    setState(() {
      _gpsActive = true;
      _gpsError = null;
    });

    // Start streaming real hardware GPS
    _positionStream = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 2, // Update every 2 meters
      ),
    ).listen((Position position) {
      setState(() => _currentPosition = position);

      if (_activeOrder != null) {
        _service.updateDriverGpsLocation(
          orderId: _activeOrder!.id,
          latitude: position.latitude,
          longitude: position.longitude,
          heading: position.heading,
          speed: position.speed * 3.6,
        );
      }
    }, onError: (err) {
      setState(() {
        _gpsError = err.toString();
        _gpsActive = false;
      });
    });
  }

  // Open Native Turn-by-Turn in Google Maps app on phone
  Future<void> _openGoogleMapsNavigation() async {
    if (_activeOrder == null) return;

    final destLat = _activeOrder!.status == 'out_for_delivery'
        ? _activeOrder!.customerLat
        : _activeOrder!.restaurantLat;
    final destLon = _activeOrder!.status == 'out_for_delivery'
        ? _activeOrder!.customerLon
        : _activeOrder!.restaurantLon;

    final uri = Uri.parse(
      'https://www.google.com/maps/dir/?api=1&destination=$destLat,$destLon&travelmode=driving',
    );

    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  // Update Status
  Future<void> _updateStatus(String status) async {
    if (_activeOrder == null) return;
    await _service.updateOrderStatus(_activeOrder!.id, status);
    _fetchOrder();
  }

  // Verify OTP
  Future<void> _verifyOtp() async {
    if (_activeOrder == null || _otpController.text.trim().isEmpty) return;
    setState(() => _otpVerifying = true);

    final res = await _service.verifyOtp(_activeOrder!.id, _otpController.text.trim());
    setState(() => _otpVerifying = false);

    if (res['success'] == true) {
      if (mounted) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: const Color(0xFF1E1E1E),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: const Text('🎉 Delivery Completed!', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            content: const Text(
              'Customer OTP verified successfully. Payout of ₹65 credited to your driver wallet.',
              style: TextStyle(color: Colors.white70, fontSize: 13),
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  _fetchOrder();
                },
                child: const Text('OK', style: TextStyle(color: Color(0xFFFC8019), fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.red.shade900,
            content: Text(res['error'] ?? 'Invalid OTP code'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1C1C1E),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Driver Cockpit',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
        ),
        actions: [
          Row(
            children: [
              Text(
                _isOnline ? 'ONLINE' : 'OFFLINE',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: _isOnline ? Colors.green : Colors.grey,
                ),
              ),
              Switch(
                value: _isOnline,
                activeThumbColor: Colors.green,
                onChanged: (val) => setState(() => _isOnline = val),
              ),
            ],
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFFC8019)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Earnings Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E1E1E),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white.withOpacity(0.08)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildStat('Today\'s Payout', '₹640', Colors.orange),
                        _buildStat('Trips', '9 Completed', Colors.green),
                        _buildStat('Rating', '4.89 ★', Colors.blue),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Real Phone GPS Broadcast Card
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: _gpsActive
                            ? [const Color(0xFF0F5132), const Color(0xFF198754)]
                            : [const Color(0xFF1E1E1E), const Color(0xFF2E2E2E)],
                      ),
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color: _gpsActive ? Colors.greenAccent : Colors.white.withOpacity(0.1),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 10,
                                  height: 10,
                                  decoration: BoxDecoration(
                                    color: _gpsActive ? Colors.greenAccent : Colors.grey,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  _gpsActive ? 'GPS STREAMING ACTIVE' : 'PHONE GPS INACTIVE',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 11,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                            const Text(
                              'geolocator',
                              style: TextStyle(color: Colors.white54, fontSize: 10),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _gpsActive
                              ? 'Broadcasting your real smartphone coordinates live to customer & dashboard!'
                              : 'Tap button to stream your phone\'s real-time GPS into the live delivery session.',
                          style: const TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                        if (_currentPosition != null) ...[
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.black38,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              'Lat: ${_currentPosition!.latitude.toStringAsFixed(5)}, Lon: ${_currentPosition!.longitude.toStringAsFixed(5)} • Speed: ${(_currentPosition!.speed * 3.6).toStringAsFixed(1)} km/h',
                              style: const TextStyle(
                                fontFamily: 'monospace',
                                color: Colors.greenAccent,
                                fontSize: 11,
                              ),
                            ),
                          ),
                        ],
                        if (_gpsError != null) ...[
                          const SizedBox(height: 8),
                          Text(_gpsError!, style: const TextStyle(color: Colors.redAccent, fontSize: 11)),
                        ],
                        const SizedBox(height: 14),
                        ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _gpsActive ? Colors.red.shade700 : const Color(0xFFFC8019),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          onPressed: _toggleGpsBroadcast,
                          icon: Icon(_gpsActive ? Icons.stop : Icons.sensors),
                          label: Text(
                            _gpsActive ? 'Stop Phone GPS Sharing' : '📡 Share Real Phone GPS',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Active Order Card
                  if (_activeOrder != null) ...[
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E1E1E),
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(color: Colors.white.withOpacity(0.08)),
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
                                  const Text('CURRENT TASK', style: TextStyle(color: Color(0xFFFC8019), fontSize: 10, fontWeight: FontWeight.bold)),
                                  Text('Order #${_activeOrder!.id}', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.green.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Text('Earning: ₹65', style: TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold, fontSize: 12)),
                              ),
                            ],
                          ),
                          const Divider(color: Colors.white12, height: 24),
                          // Route Step
                          Row(
                            children: [
                              const Icon(Icons.restaurant, color: Color(0xFFE23744), size: 18),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(_activeOrder!.restaurantName, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              const Icon(Icons.home, color: Color(0xFF16803D), size: 18),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(_activeOrder!.customerAddress, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 18),

                          // Google Maps Navigation Button
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blue.shade700,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            ),
                            onPressed: _openGoogleMapsNavigation,
                            icon: const Icon(Icons.navigation),
                            label: const Text('Open Turn-by-Turn in Google Maps', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                          ),

                          const SizedBox(height: 16),

                          // Milestones
                          if (_activeOrder!.status == 'placed')
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFC8019)),
                              onPressed: () => _updateStatus('preparing'),
                              child: const Text('Accept Order & Head to Kitchen', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                            ),

                          if (_activeOrder!.status == 'preparing')
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.amber.shade700),
                              onPressed: () => _updateStatus('ready_for_pickup'),
                              child: const Text('Arrived at Restaurant', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                            ),

                          if (_activeOrder!.status == 'ready_for_pickup')
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.green.shade700),
                              onPressed: () => _updateStatus('out_for_delivery'),
                              child: const Text('Confirm Food Picked Up & Start Driving', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                            ),

                          if (_activeOrder!.status == 'out_for_delivery') ...[
                            const SizedBox(height: 8),
                            const Text(
                              'Doorstep Delivery Verification',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: _otpController,
                                    maxLength: 4,
                                    keyboardType: TextInputType.number,
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 4),
                                    decoration: InputDecoration(
                                      hintText: '4-digit OTP',
                                      hintStyle: const TextStyle(color: Colors.grey, fontSize: 13, letterSpacing: 0),
                                      filled: true,
                                      fillColor: Colors.black54,
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                      counterText: '',
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.green.shade700,
                                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  onPressed: _otpVerifying ? null : _verifyOtp,
                                  child: _otpVerifying
                                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                      : const Text('Complete', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _buildStat(String title, String value, Color color) {
    return Column(
      children: [
        Text(title, style: const TextStyle(color: Colors.grey, fontSize: 10)),
        const SizedBox(height: 4),
        Text(value, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 14)),
      ],
    );
  }
}
