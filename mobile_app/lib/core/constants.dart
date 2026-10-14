class AppConstants {
  // ===========================================================================
  // 🔥 Firebase Cloud Firestore Configuration
  // Get these from: Firebase Console -> Project Settings -> General -> Web App
  // ===========================================================================
  static const String firebaseApiKey = 'YOUR_FIREBASE_API_KEY';
  static const String firebaseAppId = 'YOUR_FIREBASE_APP_ID';
  static const String firebaseProjectId = 'YOUR_FIREBASE_PROJECT_ID';
  static const String firebaseMessagingSenderId = 'YOUR_MESSAGING_SENDER_ID';
  static const String firebaseStorageBucket = 'YOUR_FIREBASE_STORAGE_BUCKET';

  // Supabase Configuration (Alternative option)
  static const String supabaseUrl = 'https://YOUR_PROJECT_ID.supabase.co';
  static const String supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

  // PC Dashboard Backend API (Local LAN IP for cross-device synchronization)
  // Ensure your mobile phone and PC are on the same Wi-Fi network or connected via USB ADB
  static const String localBackendApi = 'http://192.168.0.101:5050/api/v1';
  static const String localLoopbackApi = 'http://127.0.0.1:5050/api/v1';
  static const String localFrontendUrl = 'http://192.168.0.101:5173';

  // App Strings
  static const String appName = 'RouteWise';
}
