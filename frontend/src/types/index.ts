export type PriorityLevel = 'low' | 'normal' | 'high' | 'urgent';
export type DeliveryStatus = 'pending' | 'planned' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';
export type OptimizationObjective = 'distance' | 'duration';
export type DestinationPolicy = 'return_to_depot' | 'open_route';
export type OptimizationAlgorithm = 'nearest_neighbor_2opt' | 'nearest_neighbor' | 'exact_tsp' | 'original';

export interface Delivery {
  id: string;
  customer_label: string;
  address: string;
  latitude: number;
  longitude: number;
  contact?: string | null;
  description?: string | null;
  priority: PriorityLevel;
  status: DeliveryStatus;
  geocoding_confidence?: string;
  package_weight_kg?: number;
  time_window_start?: string | null;
  time_window_end?: string | null;
  service_duration_minutes?: number;
  notes?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface LocationItem {
  id?: string;
  display_name?: string;
  address: string;
  latitude: number;
  longitude: number;
  type?: string;
  priority?: PriorityLevel;
  customer_label?: string;
  contact?: string | null;
  package_weight_kg?: number;
  time_window_start?: string | null;
  time_window_end?: string | null;
  notes?: string | null;
  confidence?: string;
  locality?: string;
  city?: string;
  pincode?: string;
}

export interface OrderedStop extends LocationItem {
  stop_order: number;
  leg_distance_meters?: number;
  leg_duration_seconds?: number;
  estimated_arrival_seconds?: number;
  formatted_arrival?: string;
  status?: string;
  failure_reason?: string;
  completed_at?: string | null;
  delivery_id?: string;
  delivery?: Delivery;
}

export interface FormattedDistance {
  meters: number;
  kilometers: number;
  text: string;
}

export interface FormattedDuration {
  seconds: number;
  minutes: number;
  hours: number;
  text: string;
}

export interface OptimizationResponse {
  success: boolean;
  route_plan_id?: string;
  plan_name: string;
  algorithm: string;
  objective: OptimizationObjective;
  destination_policy: DestinationPolicy;
  start: LocationItem;
  ordered_stops: OrderedStop[];
  baseline_distance?: FormattedDistance;
  baseline_duration?: FormattedDuration;
  total_distance: FormattedDistance;
  estimated_duration: FormattedDuration;
  distance_saved?: FormattedDistance;
  duration_saved?: FormattedDuration;
  savings_percentage?: number;
  route_geometry: [number, number][]; // [lat, lon]
  simulation_coordinates: [number, number][];
  is_real_road_geometry: boolean;
  routing_provider: string;
  execution_time_ms: number;
  comparison: Record<string, { tour: number[]; cost: number; iterations?: number }>;
  original_sequence?: string[];
  optimized_sequence?: string[];
  warnings?: string[];
  error?: string;
}

export interface RouteStop {
  id: string;
  route_plan_id: string;
  delivery_id: string;
  stop_order: number;
  estimated_arrival_seconds?: number;
  leg_distance_meters?: number;
  leg_duration_seconds?: number;
  status: string;
  failure_reason?: string;
  notes?: string;
  completed_at?: string | null;
  delivery?: Delivery;
}

export interface RoutePlan {
  id: string;
  name: string;
  start_address: string;
  start_latitude: number;
  start_longitude: number;
  destination_policy: DestinationPolicy;
  optimization_objective: OptimizationObjective;
  algorithm: string;
  total_distance_meters: number;
  estimated_duration_seconds: number;
  baseline_distance_meters: number;
  baseline_duration_seconds: number;
  distance_saved_meters: number;
  duration_saved_seconds: number;
  savings_percentage: number;
  original_sequence?: string[];
  optimized_sequence?: string[];
  route_geometry?: [number, number][];
  status: string;
  created_at: string;
  stops?: RouteStop[];
  results?: any[];
  metric_snapshots?: any[];
}

export interface AnalyticsSummary {
  total_deliveries: number;
  pending_deliveries: number;
  planned_deliveries: number;
  in_transit_deliveries: number;
  completed_deliveries: number;
  failed_deliveries?: number;
  cancelled_deliveries: number;
  total_route_plans: number;
  total_planned_distance: FormattedDistance;
  average_duration: FormattedDuration;
  total_distance_saved?: FormattedDistance;
  overall_savings_percent?: number;
  recent_plans: RoutePlan[];
  recent_activities: {
    type: 'route_plan' | 'delivery' | 'food_order';
    title: string;
    description: string;
    timestamp: string;
    order_id?: string;
    status?: string;
  }[];
  live_food_orders?: FoodOrder[];
  food_stats?: {
    total: number;
    pending: number;
    in_transit: number;
    completed: number;
  };
}

export interface RouteAnalyticsCharts {
  deliveries_by_status: { name: string; count: number }[];
  deliveries_by_priority: { name: string; count: number }[];
  distance_by_route: {
    name: string;
    distance_km: number;
    baseline_km?: number;
    saved_km?: number;
    savings_percent?: number;
    duration_min: number;
    stops: number;
  }[];
  algorithm_performance: {
    algorithm: string;
    baseline_km?: number;
    optimized_km: number;
    saved_km?: number;
    savings_percent?: number;
    duration_min: number;
    execution_time_ms: number;
  }[];
  total_records_analyzed: {
    deliveries: number;
    route_plans: number;
    route_snapshots?: number;
  };
}

export interface AppSettings {
  osrm_endpoint: string;
  nominatim_endpoint: string;
  geocoding_provider: string;
  geocoding_api_key_configured: boolean;
  user_agent: string;
  max_exact_stops: number;
  fallback_speed_kmh: number;
  active_routing_provider: string;
  demo_region: string;
}

// Swiggy & Zomato Food Delivery Types
export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  is_veg: boolean;
  rating?: number;
  description: string;
  image: string;
  bestseller?: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  tagline: string;
  cuisines: string[];
  rating: number;
  rating_count: string;
  cost_for_two: number;
  prep_time_minutes: number;
  is_veg: boolean;
  address: string;
  locality: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
  image: string;
  badge?: string;
  discount?: string;
  distance_km?: number;
  estimated_delivery_mins?: number;
  delivery_fee?: number;
  menu: MenuItem[];
}

export interface FoodOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  is_veg: boolean;
}

export interface FoodOrderBill {
  item_total: number;
  delivery_fee: number;
  platform_fee: number;
  taxes: number;
  grand_total: number;
}

export interface DriverLocation {
  latitude: number;
  longitude: number;
  heading: number;
  speed_kmh: number;
  last_updated: number;
  is_real_device_connected: boolean;
}

export interface FoodOrder {
  id: string;
  created_at: string;
  status: 'placed' | 'preparing' | 'ready_for_pickup' | 'picked_up' | 'out_for_delivery' | 'delivered';
  status_title: string;
  status_message: string;
  delivery_otp: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  restaurant: {
    id: string;
    name: string;
    address: string;
    phone: string;
    image: string;
    latitude: number;
    longitude: number;
  };
  rider: {
    id: string;
    name: string;
    phone: string;
    vehicle: string;
    vehicle_type: string;
    rating: number;
    trips: number;
    avatar: string;
  };
  driver_location: DriverLocation;
  items: FoodOrderItem[];
  bill: FoodOrderBill;
  distance_km: number;
  estimated_delivery_mins: number;
  road_geometry: [number, number][]; // [lat, lon]
  timeline: {
    status: string;
    title: string;
    timestamp: string;
    completed: boolean;
  }[];
}

export interface DeviceInfo {
  lan_ip: string;
  frontend_port: number;
  backend_port: number;
  customer_url: string;
  driver_companion_url: string;
  kitchen_url: string;
  tracking_url_template: string;
  server_time: number;
  active_orders_count: number;
}

