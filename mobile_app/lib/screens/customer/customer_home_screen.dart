import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../../models/models.dart';
import '../../services/delivery_service.dart';
import 'customer_tracking_screen.dart';

class CustomerHomeScreen extends StatefulWidget {
  const CustomerHomeScreen({super.key});

  @override
  State<CustomerHomeScreen> createState() => _CustomerHomeScreenState();
}

class _CustomerHomeScreenState extends State<CustomerHomeScreen> {
  final DeliveryService _service = DeliveryService();
  List<Restaurant> _restaurants = DeliveryService.defaultRestaurants;
  bool _loading = false;
  String _selectedCategory = 'all';

  // Cart
  final Map<String, int> _cart = {};
  Restaurant? _activeRestaurant;

  // Real-time order listener
  StreamSubscription<FoodOrder>? _orderSub;

  @override
  void initState() {
    super.initState();
    _loadRestaurants();
    _orderSub = _service.onOrderUpdate.listen((_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _orderSub?.cancel();
    super.dispose();
  }

  Future<void> _loadRestaurants() async {
    final list = await _service.getRestaurants();
    if (mounted) {
      setState(() {
        _restaurants = list;
      });
    }
  }

  void _showMenuModal(Restaurant restaurant) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          return Container(
            height: MediaQuery.of(context).size.height * 0.75,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            restaurant.name,
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            restaurant.cuisines.join(', '),
                            style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.green.shade700,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '★ ${restaurant.rating}',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ),
                  ],
                ),
                const Divider(height: 24),
                const Text(
                  'Recommended Dishes',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: ListView.builder(
                    itemCount: restaurant.menu.length,
                    itemBuilder: (ctx, idx) {
                      final item = restaurant.menu[idx];
                      final qty = _cart[item.id] ?? 0;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 14),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 14,
                              height: 14,
                              decoration: BoxDecoration(
                                border: Border.all(
                                  color: item.isVeg ? Colors.green : Colors.red,
                                  width: 2,
                                ),
                                borderRadius: BorderRadius.circular(3),
                              ),
                              child: Center(
                                child: Container(
                                  width: 6,
                                  height: 6,
                                  decoration: BoxDecoration(
                                    color: item.isVeg ? Colors.green : Colors.red,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.name,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                  ),
                                  Text(
                                    '₹${item.price.toInt()}',
                                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
                                  ),
                                  Text(
                                    item.description,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            if (qty > 0)
                              Container(
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFC8019).withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: const Color(0xFFFC8019)),
                                ),
                                child: Row(
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.remove, size: 16, color: Color(0xFFFC8019)),
                                      onPressed: () {
                                        setState(() {
                                          if (qty <= 1) {
                                            _cart.remove(item.id);
                                          } else {
                                            _cart[item.id] = qty - 1;
                                          }
                                        });
                                        setModalState(() {});
                                      },
                                    ),
                                    Text('$qty', style: const TextStyle(fontWeight: FontWeight.bold)),
                                    IconButton(
                                      icon: const Icon(Icons.add, size: 16, color: Color(0xFFFC8019)),
                                      onPressed: () {
                                        setState(() {
                                          _cart[item.id] = qty + 1;
                                        });
                                        setModalState(() {});
                                      },
                                    ),
                                  ],
                                ),
                              )
                            else
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.white,
                                  foregroundColor: const Color(0xFFFC8019),
                                  side: const BorderSide(color: Color(0xFFFC8019), width: 1.5),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                ),
                                onPressed: () {
                                  setState(() {
                                    _activeRestaurant = restaurant;
                                    _cart[item.id] = 1;
                                  });
                                  setModalState(() {});
                                },
                                child: const Text('ADD +', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                              ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                if (_cart.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFFC8019),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: () {
                        Navigator.of(ctx).pop();
                        _showCheckoutSheet();
                      },
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.shopping_bag_outlined, color: Colors.white),
                          const SizedBox(width: 8),
                          Text(
                            'View Cart & Checkout ( items) ➔',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showCheckoutSheet() {
    if (_activeRestaurant == null || _cart.isEmpty) return;
    final restaurant = _activeRestaurant!;

    bool isRealMode = false;
    bool isPlacing = false;
    Position? detectedPosition;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          double subtotal = 0.0;
          _cart.forEach((id, qty) {
            final item = restaurant.menu.firstWhere(
              (m) => m.id == id,
              orElse: () => MenuItem(
                id: id,
                name: 'Dish',
                category: 'Food',
                price: 249.0,
                isVeg: true,
                description: '',
                imageUrl: '',
              ),
            );
            subtotal += item.price * qty;
          });

          final deliveryFee = 35.0;
          final packagingFee = 25.0;
          final taxes = subtotal * 0.05;
          final grandTotal = subtotal + deliveryFee + packagingFee + taxes;

          return Container(
            height: MediaQuery.of(context).size.height * 0.85,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Checkout & Confirm Order',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          restaurant.name,
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.of(ctx).pop(),
                    ),
                  ],
                ),
                const Divider(height: 20),

                Expanded(
                  child: ListView(
                    children: [
                      // Mode Selector
                      const Text(
                        'SELECT TRACKING MODE:',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5, color: Colors.black54),
                      ),
                      const SizedBox(height: 8),

                      // Real Hardware GPS Mode Card
                      InkWell(
                        onTap: () async {
                          setSheetState(() => isRealMode = true);
                          try {
                            LocationPermission permission = await Geolocator.checkPermission();
                            if (permission == LocationPermission.denied) {
                              permission = await Geolocator.requestPermission();
                            }
                            if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
                              final pos = await Geolocator.getCurrentPosition();
                              setSheetState(() => detectedPosition = pos);
                            }
                          } catch (_) {}
                        },
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isRealMode ? Colors.green.shade50 : Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isRealMode ? Colors.green : Colors.grey.shade300,
                              width: isRealMode ? 2 : 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.sensors, color: isRealMode ? Colors.green : Colors.grey, size: 24),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        const Flexible(
                                          child: Text(
                                            '\u26a1 Real GPS Mode',
                                            overflow: TextOverflow.ellipsis,
                                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                          decoration: BoxDecoration(
                                            color: Colors.green,
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: const Text('LIVE', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                                        ),
                                      ],
                                    ),
                                    Text(
                                      detectedPosition != null
                                          ? 'GPS Detected: ${detectedPosition!.latitude.toStringAsFixed(4)}, ${detectedPosition!.longitude.toStringAsFixed(4)}'
                                          : 'Uses real phone GPS hardware, dynamic 4-digit OTP, & live movement.',
                                      style: TextStyle(fontSize: 11, color: isRealMode ? Colors.green.shade800 : Colors.grey.shade600),
                                    ),
                                  ],
                                ),
                              ),
                              Radio<bool>(
                                value: true,
                                groupValue: isRealMode,
                                activeColor: Colors.green,
                                onChanged: (val) => setSheetState(() => isRealMode = val!),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Demo Simulation Mode Card
                      InkWell(
                        onTap: () => setSheetState(() => isRealMode = false),
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: !isRealMode ? Colors.blue.shade50 : Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: !isRealMode ? Colors.blue : Colors.grey.shade300,
                              width: !isRealMode ? 2 : 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.sports_esports, color: !isRealMode ? Colors.blue : Colors.grey, size: 24),
                              const SizedBox(width: 12),
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '🎮 Demo Simulation Mode',
                                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                    ),
                                    Text(
                                      'Simulated Kharghar road route with auto rider animation & demo OTP (4829).',
                                      style: TextStyle(fontSize: 11, color: Colors.blueGrey),
                                    ),
                                  ],
                                ),
                              ),
                              Radio<bool>(
                                value: false,
                                groupValue: isRealMode,
                                activeColor: Colors.blue,
                                onChanged: (val) => setSheetState(() => isRealMode = val!),
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 16),
                      const Text(
                        'ORDER ITEMS:',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5, color: Colors.black54),
                      ),
                      const SizedBox(height: 8),

                      // Dish list
                      ..._cart.entries.map((entry) {
                        final item = restaurant.menu.firstWhere(
                          (m) => m.id == entry.key,
                          orElse: () => MenuItem(
                            id: entry.key,
                            name: 'Dish',
                            category: 'Food',
                            price: 249.0,
                            isVeg: true,
                            description: '',
                            imageUrl: '',
                          ),
                        );
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Text('${entry.value}x', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFFC8019))),
                                  const SizedBox(width: 8),
                                  Text(item.name, style: const TextStyle(fontSize: 13)),
                                ],
                              ),
                              Text('₹${(item.price * entry.value).toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                            ],
                          ),
                        );
                      }),

                      const Divider(height: 24),

                      // Bill breakdown
                      _buildBillRow('Item Subtotal', '₹${subtotal.toStringAsFixed(0)}'),
                      _buildBillRow('Delivery Partner Fee', '₹${deliveryFee.toStringAsFixed(0)}'),
                      _buildBillRow('Restaurant Packaging & Taxes', '₹${(packagingFee + taxes).toStringAsFixed(0)}'),
                      const Divider(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Grand Total', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
                          Text('₹${grandTotal.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Color(0xFFFC8019))),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 12),

                // Confirm & Place Order Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFC8019),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    onPressed: isPlacing
                        ? null
                        : () async {
                            setSheetState(() => isPlacing = true);

                            double customerLat = 19.03080;
                            double customerLon = 73.07220;
                            String customerAddress = 'Flat 301, Sector 7, Kharghar';

                            if (isRealMode && detectedPosition == null) {
                              try {
                                LocationPermission permission = await Geolocator.checkPermission();
                                if (permission == LocationPermission.denied) {
                                  permission = await Geolocator.requestPermission();
                                }
                                if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
                                  detectedPosition = await Geolocator.getCurrentPosition();
                                }
                              } catch (_) {}
                            }

                            if (isRealMode && detectedPosition != null) {
                              customerLat = detectedPosition!.latitude;
                              customerLon = detectedPosition!.longitude;
                              customerAddress = 'Live GPS Location (${customerLat.toStringAsFixed(4)}, ${customerLon.toStringAsFixed(4)})';
                            }

                            final newOrder = await _service.createRealOrder(
                              restaurant: restaurant,
                              cart: _cart,
                              customerName: 'Prajwal (Customer)',
                              customerAddress: customerAddress,
                              customerLat: customerLat,
                              customerLon: customerLon,
                              realMode: isRealMode,
                            );

                            setState(() {
                              _cart.clear();
                              _activeRestaurant = null;
                            });

                            if (ctx.mounted) {
                              Navigator.of(ctx).pop();
                            }
                            if (mounted) {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => CustomerTrackingScreen(orderId: newOrder.id),
                                ),
                              );
                            }
                          },
                    child: isPlacing
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                isRealMode ? '⚡ Place Real GPS Order' : '🎮 Place Demo Order',
                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(width: 8),
                              const Icon(Icons.arrow_forward),
                            ],
                          ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildBillRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
          Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    int totalItems = _cart.values.fold(0, (prev, curr) => prev + curr);
    final active = _service.currentOrder;
    final isReal = active?.isRealMode ?? false;
    final otpText = active?.deliveryOtp ?? '4829';
    final titleText = active != null ? '${active.statusTitle} (OTP: $otpText)' : 'Active Delivery in Progress (OTP: 4829)';
    final subText = active != null ? '${active.driverName} • ${active.restaurantName}' : 'Ramesh Kumar is moving live on road • Tap to view map';

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.location_on, color: Color(0xFFFC8019), size: 16),
                SizedBox(width: 4),
                Text(
                  'Utsav Chowk, Kharghar',
                  style: TextStyle(color: Color(0xFF282C3F), fontWeight: FontWeight.bold, fontSize: 14),
                ),
              ],
            ),
            Text(
              'Sector 7, Navi Mumbai 410210',
              style: TextStyle(color: Colors.grey.shade500, fontSize: 11),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.directions_bike, color: Color(0xFFFC8019)),
            tooltip: 'Live Track Active Order',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const CustomerTrackingScreen()),
              );
            },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFFC8019)))
          : Column(
              children: [
                // Category Pills
                SizedBox(
                  height: 52,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    children: [
                      _buildCategoryChip('all', 'All Cuisines', '✨'),
                      _buildCategoryChip('biryani', 'Biryani', '🍚'),
                      _buildCategoryChip('pizza', 'Pizzas', '🍕'),
                      _buildCategoryChip('veg', 'Pure Veg', '🥦'),
                    ],
                  ),
                ),

                // Active Live Order Banner
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: InkWell(
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const CustomerTrackingScreen()),
                      );
                    },
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFFC8019), Color(0xFFE23744)],
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFFC8019).withOpacity(0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.radar, color: Colors.white, size: 22),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        titleText,
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                      decoration: BoxDecoration(
                                        color: isReal ? Colors.greenAccent.shade700 : Colors.blue.shade700,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        isReal ? '⚡ REAL' : '🎮 DEMO',
                                        style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                  ],
                                ),
                                Text(
                                  subText,
                                  style: const TextStyle(color: Colors.white70, fontSize: 10),
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.chevron_right, color: Colors.white),
                        ],
                      ),
                    ),
                  ),
                ),

                // Restaurants List
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _restaurants.length,
                    itemBuilder: (ctx, idx) {
                      final rest = _restaurants[idx];

                      return Card(
                        elevation: 1.5,
                        margin: const EdgeInsets.only(bottom: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        clipBehavior: Clip.antiAlias,
                        child: InkWell(
                          onTap: () => _showMenuModal(rest),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Stack(
                                children: [
                                  Image.network(
                                    rest.imageUrl,
                                    height: 150,
                                    width: double.infinity,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) => Container(
                                      height: 150,
                                      color: Colors.grey.shade300,
                                      child: const Icon(Icons.restaurant, size: 48, color: Colors.grey),
                                    ),
                                  ),
                                  if (rest.discount.isNotEmpty)
                                    Positioned(
                                      bottom: 10,
                                      left: 10,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: Colors.blue.shade700,
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          rest.discount,
                                          style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                              Padding(
                                padding: const EdgeInsets.all(14),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          rest.name,
                                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: Colors.green.shade700,
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            '★ ${rest.rating}',
                                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      rest.cuisines.join(', '),
                                      style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                                    ),
                                    const SizedBox(height: 6),
                                    Row(
                                      children: [
                                        Icon(Icons.timer_outlined, size: 14, color: Colors.grey.shade600),
                                        const SizedBox(width: 4),
                                        Text('${rest.prepTimeMinutes} mins', style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
                                        const SizedBox(width: 12),
                                        Text('₹${rest.costForTwo} for two', style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
      bottomNavigationBar: totalItems > 0
          ? Container(
              padding: const EdgeInsets.all(16),
              color: Colors.white,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFC8019),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: _showCheckoutSheet,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.shopping_bag_outlined, color: Colors.white),
                    const SizedBox(width: 8),
                    Text(
                      'Review Order & Checkout ($totalItems items) ➔',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ],
                ),
              ),
            )
          : null,
    );
  }

  Widget _buildCategoryChip(String id, String label, String emoji) {
    final isSelected = _selectedCategory == id;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        selected: isSelected,
        label: Text('$emoji $label'),
        labelStyle: TextStyle(
          color: isSelected ? Colors.white : Colors.black87,
          fontSize: 11,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
        backgroundColor: Colors.white,
        selectedColor: Colors.black87,
        onSelected: (val) {
          setState(() => _selectedCategory = id);
        },
      ),
    );
  }
}
