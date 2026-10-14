import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/constants.dart';
import '../../models/models.dart';
import '../../services/embedded_server_service.dart';
import '../customer/customer_home_screen.dart';
import '../driver/driver_screen.dart';
import '../kitchen/kitchen_screen.dart';

class RoleSelectScreen extends StatefulWidget {
  const RoleSelectScreen({super.key});

  @override
  State<RoleSelectScreen> createState() => _RoleSelectScreenState();
}

class _RoleSelectScreenState extends State<RoleSelectScreen> {
  final EmbeddedServerService _serverService = EmbeddedServerService();
  bool _isHostingServer = false;
  StreamSubscription<bool>? _serverSub;

  @override
  void initState() {
    super.initState();
    _isHostingServer = _serverService.isRunning;
    _serverSub = _serverService.onStatusChanged.listen((running) {
      if (mounted) setState(() => _isHostingServer = running);
    });
  }

  @override
  void dispose() {
    _serverSub?.cancel();
    super.dispose();
  }

  void _navigateToRole(BuildContext context, UserRole role) {
    Widget target;
    switch (role) {
      case UserRole.customer:
        target = const CustomerHomeScreen();
        break;
      case UserRole.driver:
        target = const DriverScreen();
        break;
      case UserRole.kitchen:
        target = const KitchenScreen();
        break;
    }

    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => target),
    );
  }

  Future<void> _toggleHostingServer(bool value) async {
    if (value) {
      final success = await _serverService.startServer();
      if (success) {
        AppConstants.customBackendApi = 'http://127.0.0.1:5050/api/v1';
        if (mounted) {
          setState(() => _isHostingServer = true);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: const Color(0xFF10B981),
              content: Text(
                '⚡ Hub Server Active on http://${_serverService.detectedIp}:5050! Zero Laptop Needed.',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              duration: const Duration(seconds: 4),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Colors.red,
              content: Text('Failed to bind server port 5050.'),
            ),
          );
        }
      }
    } else {
      await _serverService.stopServer();
      AppConstants.customBackendApi = '';
      if (mounted) {
        setState(() => _isHostingServer = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Colors.grey,
            content: Text('On-device Hub Server Stopped.'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 16),
              // Brand Logo & Header
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFFC8019).withOpacity(0.35),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Image.asset(
                      'assets/images/logo.png',
                      fit: BoxFit.cover,
                    ),
                  ),
                  const SizedBox(width: 14),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'RouteWise',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: -0.5,
                        ),
                      ),
                      Text(
                        'Real Time Engine',
                        style: TextStyle(fontSize: 12, color: Colors.grey, letterSpacing: 0.5),
                      ),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 36),

              const Text(
                'Select Your Role to Continue',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
              const Text(
                'The app interface and live location tracking will adapt automatically based on who you log in as.',
                style: TextStyle(fontSize: 12, color: Colors.grey),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 28),

              _buildRoleCard(
                context,
                role: UserRole.customer,
                title: 'Hungry Customer',
                subtitle: 'Order from real restaurants or friend\'s live kitchen, track real driver GPS & receive OTP.',
                badge: 'LIVE MAP & OTP',
                badgeColor: const Color(0xFF10B981),
                cardColor: const Color(0xFF1E1E1E),
                borderColor: const Color(0xFF2E2E2E),
              ),

              const SizedBox(height: 16),

              _buildRoleCard(
                context,
                role: UserRole.driver,
                title: 'Delivery Partner (Driver)',
                subtitle: 'Go online, broadcast real smartphone GPS, navigate in Google Maps & verify OTP.',
                badge: 'REAL DEVICE GPS',
                badgeColor: const Color(0xFFFC8019),
                cardColor: const Color(0xFF1E1E1E),
                borderColor: const Color(0xFF2E2E2E),
              ),

              const SizedBox(height: 16),

              _buildRoleCard(
                context,
                role: UserRole.kitchen,
                title: 'Kitchen Display Terminal',
                subtitle: 'Cloud kitchen screen to accept incoming orders and mark food ready for pickup.',
                badge: 'KDS TERMINAL',
                badgeColor: const Color(0xFFE23744),
                cardColor: const Color(0xFF1E1E1E),
                borderColor: const Color(0xFF2E2E2E),
              ),

              const SizedBox(height: 24),

              // ===============================================================
              // 📱 On-Device Hub Server Card (Zero Laptop Mode)
              // ===============================================================
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: _isHostingServer
                        ? [const Color(0xFF064E3B), const Color(0xFF065F46)]
                        : [const Color(0xFF1E1E1E), const Color(0xFF171717)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: _isHostingServer
                        ? const Color(0xFF10B981)
                        : Colors.white.withOpacity(0.12),
                    width: _isHostingServer ? 1.5 : 1.0,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: _isHostingServer ? const Color(0xFF10B981) : Colors.white10,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            _isHostingServer ? Icons.wifi_tethering : Icons.portable_wifi_off,
                            color: Colors.white,
                            size: 20,
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
                                runSpacing: 4,
                                children: [
                                  const Text(
                                    '📱 On-Device Hub Server',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: _isHostingServer ? Colors.greenAccent : Colors.orangeAccent,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      _isHostingServer ? 'ACTIVE' : 'LAPTOP-FREE',
                                      style: const TextStyle(
                                        color: Colors.black,
                                        fontWeight: FontWeight.w900,
                                        fontSize: 8,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                _isHostingServer
                                    ? 'Hosting at http://${_serverService.detectedIp}:5050'
                                    : 'Run RouteWise server directly on this phone (Zero Laptop)',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: _isHostingServer ? Colors.green.shade200 : Colors.grey,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Switch(
                          value: _isHostingServer,
                          activeColor: const Color(0xFF10B981),
                          onChanged: _toggleHostingServer,
                        ),
                      ],
                    ),
                    if (_isHostingServer) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.3),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.info_outline, color: Colors.greenAccent, size: 16),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Turn on Personal Hotspot! Ask Friend 1 (Customer) and Friend 2 (Kitchen) to join this Wi-Fi.',
                                style: TextStyle(color: Colors.green.shade100, fontSize: 10),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 14),

              // RouteWise 4G Cloud Synchronization Card
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withOpacity(0.1)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: _isHostingServer ? const Color(0xFF10B981) : const Color(0xFFFC8019),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: _isHostingServer ? const Color(0xFF10B981) : const Color(0xFFFC8019),
                            blurRadius: 6,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _isHostingServer ? 'Current Active Hub: On-Device Hotspot' : 'RouteWise Cloud / Tunnel Sync',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          Text(
                            AppConstants.customBackendApi.isNotEmpty
                                ? AppConstants.customBackendApi
                                : (_isHostingServer
                                    ? 'http://${_serverService.detectedIp}:5050/api/v1'
                                    : AppConstants.cloudBackendApi),
                            style: const TextStyle(fontSize: 10, color: Colors.grey),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.settings, color: Colors.white70, size: 18),
                      onPressed: () => _showServerSettingsDialog(context),
                      tooltip: 'Configure Backend URL',
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRoleCard(
    BuildContext context, {
    required UserRole role,
    required String title,
    required String subtitle,
    required String badge,
    required Color badgeColor,
    required Color cardColor,
    required Color borderColor,
  }) {
    return InkWell(
      onTap: () => _navigateToRole(context, role),
      borderRadius: BorderRadius.circular(22),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: borderColor),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.4),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    crossAxisAlignment: WrapCrossAlignment.center,
                    spacing: 8,
                    runSpacing: 4,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                        decoration: BoxDecoration(
                          color: badgeColor.withValues(alpha: 0.18),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: badgeColor.withValues(alpha: 0.4)),
                        ),
                        child: Text(
                          badge,
                          style: TextStyle(
                            fontSize: 8,
                            fontWeight: FontWeight.w800,
                            color: badgeColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 11, color: Colors.grey, height: 1.3),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  void _showServerSettingsDialog(BuildContext context) {
    final controller = TextEditingController(
      text: AppConstants.customBackendApi.isNotEmpty
          ? AppConstants.customBackendApi
          : AppConstants.cloudBackendApi,
    );

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: const Color(0xFF1E1E1E),
          title: const Row(
            children: [
              Icon(Icons.cloud_sync, color: Color(0xFFFC8019)),
              SizedBox(width: 10),
              Text('Connection & Server Setup', style: TextStyle(color: Colors.white, fontSize: 16)),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Quick 1-Tap Presets:',
                  style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),

                // Preset 1: Android Hotspot Host
                InkWell(
                  onTap: () {
                    setDialogState(() {
                      controller.text = 'http://192.168.43.1:5050/api/v1';
                    });
                  },
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.wifi_tethering, color: Color(0xFF10B981), size: 16),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            '📱 Friend\'s Hotspot Hub (192.168.43.1:5050)',
                            style: TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 6),

                // Preset 2: Cloud Tunnel
                InkWell(
                  onTap: () {
                    setDialogState(() {
                      controller.text = AppConstants.cloudBackendApi;
                    });
                  },
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.blue.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.blue.withOpacity(0.3)),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.cloud_outlined, color: Colors.blueAccent, size: 16),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            '🌐 4G/5G Cloud Tunnel (${AppConstants.cloudBackendApi})',
                            style: const TextStyle(color: Colors.blueAccent, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 6),

                // Preset 3: Local Host / Loopback
                InkWell(
                  onTap: () {
                    setDialogState(() {
                      controller.text = 'http://127.0.0.1:5050/api/v1';
                    });
                  },
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.purple.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.purple.withOpacity(0.3)),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.phone_android, color: Colors.purpleAccent, size: 16),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            '🏠 This Phone Server (127.0.0.1:5050)',
                            style: TextStyle(color: Colors.purpleAccent, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 14),
                const Text(
                  'Or enter custom server URL:',
                  style: TextStyle(color: Colors.grey, fontSize: 11),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: controller,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: Colors.black26,
                    hintText: 'http://192.168.43.1:5050/api/v1',
                    hintStyle: const TextStyle(color: Colors.grey),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                AppConstants.customBackendApi = '';
                setState(() {});
                Navigator.of(ctx).pop();
              },
              child: const Text('Reset', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFC8019)),
              onPressed: () {
                AppConstants.customBackendApi = controller.text.trim();
                setState(() {});
                Navigator.of(ctx).pop();
              },
              child: const Text('Save & Connect', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
