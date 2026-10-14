class AppConstants {
  // Supabase Configuration
  // Replace these with your Supabase Project URL and Anon Key from Project Settings -> API
  static const String supabaseUrl = 'https://YOUR_PROJECT_ID.supabase.co';
  static const String supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

  // PC Dashboard Backend API (Local LAN IP for cross-device synchronization)
  // Ensure your mobile phone and PC are on the same Wi-Fi network
  static const String localBackendApi = 'http://192.168.0.101:5000/api/v1';
  static const String localFrontendUrl = 'http://192.168.0.101:5173';

  // App Strings
  static const String appName = 'RouteWise Delivery';
}
