const RAW_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || '';
const API_BASE = RAW_BASE ? `${RAW_BASE.replace(/\/$/, '')}/api/v1` : '/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });

  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      if (contentType.includes('application/json')) {
        const errData = await res.json();
        if (errData.error) errorMsg = errData.error;
        else if (errData.message) errorMsg = errData.message;
      } else {
        const text = await res.text();
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          errorMsg = `Server returned an HTML error page (HTTP ${res.status}). Verify backend is reachable at http://127.0.0.1:5050.`;
        }
      }
    } catch {
      // Ignored
    }
    throw new Error(errorMsg);
  }

  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      throw new Error(`API returned HTML instead of JSON. Ensure you are accessing the dashboard at http://localhost:5173.`);
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Invalid response format from server.`);
    }
  }

  return res.json();
}

export const api = {
  // Health
  getHealth: () => fetchJson<{ status: string; service: string; database: string }>(`${API_BASE}/health`),

  // Deliveries
  getDeliveries: (params?: { status?: string; priority?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status && params.status !== 'all') qs.set('status', params.status);
    if (params?.priority && params.priority !== 'all') qs.set('priority', params.priority);
    if (params?.search) qs.set('search', params.search);
    return fetchJson<{ count: number; deliveries: any[] }>(`${API_BASE}/deliveries?${qs.toString()}`);
  },
  createDelivery: (data: any) => fetchJson<{ message: string; delivery: any }>(`${API_BASE}/deliveries`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateDelivery: (id: string, data: any) => fetchJson<{ message: string; delivery: any }>(`${API_BASE}/deliveries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  deleteDelivery: (id: string) => fetchJson<{ message: string }>(`${API_BASE}/deliveries/${id}`, {
    method: 'DELETE'
  }),
  seedDemoDeliveries: () => fetchJson<{ message: string; created_count: number; deliveries: any[] }>(`${API_BASE}/deliveries/seed-demo`, {
    method: 'POST'
  }),
  clearDemoDeliveries: () => fetchJson<{ message: string; removed_count: number }>(`${API_BASE}/deliveries/clear-demo`, {
    method: 'POST'
  }),

  // Geocoding
  searchAddress: (query: string, limit = 5) => fetchJson<{ query: string; count: number; results: any[] }>(
    `${API_BASE}/geocoding/search?q=${encodeURIComponent(query)}&limit=${limit}`
  ),
  reverseGeocode: (lat: number, lon: number) => fetchJson<{ result: any }>(
    `${API_BASE}/geocoding/reverse?lat=${lat}&lon=${lon}`
  ),

  // Route Planning & Optimization
  previewRoute: (data: any) => fetchJson<any>(`${API_BASE}/routes/preview`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  optimizeRoute: (data: any) => fetchJson<any>(`${API_BASE}/routes/optimize`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getRoutes: () => fetchJson<{ count: number; plans: any[] }>(`${API_BASE}/routes`),
  getRouteById: (id: string) => fetchJson<{ plan: any }>(`${API_BASE}/routes/${id}`),
  deleteRoute: (id: string) => fetchJson<{ message: string }>(`${API_BASE}/routes/${id}`, {
    method: 'DELETE'
  }),
  duplicateRoute: (id: string) => fetchJson<{ message: string; plan: any }>(`${API_BASE}/routes/${id}/duplicate`, {
    method: 'POST'
  }),
  startRoute: (planId: string) => fetchJson<{ message: string; plan: any }>(`${API_BASE}/routes/${planId}/start`, {
    method: 'POST'
  }),
  updateStopStatus: (planId: string, stopId: string, status: string, reason?: string) => fetchJson<any>(
    `${API_BASE}/routes/${planId}/stops/${stopId}/status`,
    {
      method: 'POST',
      body: JSON.stringify({ status, reason })
    }
  ),
  updateRouteStatus: (planId: string, status: string) => fetchJson<any>(`${API_BASE}/routes/${planId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  getExportUrl: (planId: string, format = 'csv') => `${API_BASE}/routes/${planId}/export?format=${format}`,

  // Algorithms
  getSampleGraphs: () => fetchJson<{ sample_graphs: any[] }>(`${API_BASE}/algorithms/sample-graphs`),
  runShortestPath: (data: any) => fetchJson<any>(`${API_BASE}/algorithms/shortest-path`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  compareAlgorithms: (data: any) => fetchJson<any>(`${API_BASE}/algorithms/compare`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Analytics
  getAnalyticsSummary: () => fetchJson<any>(`${API_BASE}/dashboard`),
  getRouteAnalytics: () => fetchJson<any>(`${API_BASE}/analytics`),

  // Settings
  getSettings: () => fetchJson<any>(`${API_BASE}/settings`),
  updateSettings: (data: any) => fetchJson<any>(`${API_BASE}/settings`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Swiggy & Zomato Real-Time Delivery API
  getFoodRestaurants: (params?: { lat?: number; lon?: number; q?: string; category?: string }) => {
    const qs = new URLSearchParams();
    if (params?.lat !== undefined) qs.set('lat', params.lat.toString());
    if (params?.lon !== undefined) qs.set('lon', params.lon.toString());
    if (params?.q) qs.set('q', params.q);
    if (params?.category && params.category !== 'all') qs.set('category', params.category);
    return fetchJson<{ count: number; restaurants: any[] }>(`${API_BASE}/food/restaurants?${qs.toString()}`);
  },
  getFoodRestaurantById: (id: string) => fetchJson<{ restaurant: any }>(`${API_BASE}/food/restaurants/${id}`),
  createFoodOrder: (data: any) => fetchJson<{ message: string; order: any }>(`${API_BASE}/food/orders`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getFoodOrders: () => fetchJson<{ count: number; orders: any[] }>(`${API_BASE}/food/orders`),
  getFoodOrderById: (id: string) => fetchJson<{ order: any }>(`${API_BASE}/food/orders/${id}`),
  trackFoodOrder: (id: string) => fetchJson<any>(`${API_BASE}/food/orders/${id}/track`),
  updateFoodOrderStatus: (id: string, status: string) => fetchJson<any>(`${API_BASE}/food/orders/${id}/status`, {
    method: 'POST',
    body: JSON.stringify({ status })
  }),
  updateDriverLocation: (id: string, data: { latitude: number; longitude: number; heading?: number; speed?: number; is_real_device?: boolean }) =>
    fetchJson<any>(`${API_BASE}/food/orders/${id}/driver-location`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  verifyFoodOrderOtp: (id: string, otp: string) => fetchJson<{ success: boolean; message?: string; error?: string; order?: any }>(
    `${API_BASE}/food/orders/${id}/verify-otp`,
    {
      method: 'POST',
      body: JSON.stringify({ otp })
    }
  ),
  getFoodDeviceInfo: () => fetchJson<any>(`${API_BASE}/food/device-info`),
  seedDemoFoodOrder: () => fetchJson<{ message: string; orders: any[] }>(`${API_BASE}/food/seed-demo`, {
    method: 'POST'
  })
};

