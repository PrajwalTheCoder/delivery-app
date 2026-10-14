import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../customer/customer_home_screen.dart';
import '../driver/driver_screen.dart';
import '../kitchen/kitchen_screen.dart';

class RoleSelectScreen extends StatelessWidget {
  const RoleSelectScreen({super.key});

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 16),
              // Brand Logo & Header
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 54,
                    height: 54,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFFC8019), Color(0xFFE23744)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFFC8019).withOpacity(0.4),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Center(
                      child: Text(
                        '🛵',
                        style: TextStyle(fontSize: 26),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Text(
                            'RouteWise',
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFC8019).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: const Color(0xFFFC8019)),
                            ),
                            child: const Text(
                              'AI',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFFFC8019),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const Text(
                        'Swiggy & Zomato Real-Time Engine',
                        style: TextStyle(fontSize: 11, color: Colors.grey),
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

              const SizedBox(height: 32),

              // Role Cards
              _buildRoleCard(
                context,
                role: UserRole.customer,
                title: 'Customer Food App',
                subtitle: 'Browse real restaurants, order dishes, and track rider live on the road.',
                badge: 'LIVE MAP & OTP',
                badgeColor: const Color(0xFF16803D),
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

              const Spacer(),

              // Supabase & PC Dashboard Connection Info
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.04),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withOpacity(0.1)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.wifi_tethering, color: Color(0xFFFC8019), size: 20),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Connected to PC Dashboard on C (http://192.168.0.101:5173) & Supabase Realtime.',
                        style: TextStyle(fontSize: 11, color: Colors.grey),
                      ),
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
              color: Colors.black.withOpacity(0.3),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.06),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Center(
                child: Text(
                  role.iconEmoji,
                  style: const TextStyle(fontSize: 24),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          title,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: badgeColor.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: badgeColor.withOpacity(0.5)),
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
}
