import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/constants.dart';
import 'screens/auth/role_select_screen.dart';
import 'services/delivery_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase if valid URL provided
  try {
    if (AppConstants.supabaseUrl.startsWith('https://') &&
        !AppConstants.supabaseUrl.contains('YOUR_PROJECT_ID')) {
      await Supabase.initialize(
        url: AppConstants.supabaseUrl,
        anonKey: AppConstants.supabaseAnonKey,
      );
      DeliveryService().initSupabase();
    }
  } catch (e) {
    debugPrint('Supabase auto-init note: $e');
  }

  runApp(const RouteWiseMobileApp());
}

class RouteWiseMobileApp extends StatelessWidget {
  const RouteWiseMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'RouteWise Delivery',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFFC8019),
          primary: const Color(0xFFFC8019),
          secondary: const Color(0xFFE23744),
          brightness: Brightness.light,
        ),
        fontFamily: 'Roboto',
      ),
      home: const RoleSelectScreen(),
    );
  }
}
