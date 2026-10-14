import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  Route, 
  TrendingUp, 
  Plus, 
  Sparkles, 
  ArrowRight, 
  MapPin, 
  Activity,
  AlertCircle,
  Percent,
  Trash2,
  PlayCircle,
  Smartphone,
  Radio,
  Navigation,
  RefreshCw,
  ChefHat,
  ExternalLink,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import { api } from '../services/api';
import type { AnalyticsSummary, FoodOrder } from '../types';
import { Badge } from '../components/common/Badge';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [orderFilter, setOrderFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const loadDashboard = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await api.getAnalyticsSummary();
      setData(res);
      setLastRefreshed(new Date());
    } catch (err: any) {
      if (!silent) {
        setError(err.message || 'Failed to load dashboard metrics.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // Silent live poll every 3 seconds to sync real orders from mobile devices
    const interval = setInterval(() => {
      loadDashboard(true);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSeedDemo = async () => {
    try {
      setSeeding(true);
      await api.seedDemoDeliveries();
      await loadDashboard();
    } catch (err: any) {
      alert(`Error loading demo data: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleClearDemo = async () => {
    if (!confirm('Clear seeded demo deliveries? Custom records will not be deleted.')) return;
    try {
      setClearing(true);
      await api.clearDemoDeliveries();
      await loadDashboard();
    } catch (err: any) {
      alert(`Error clearing demo data: ${err.message}`);
    } finally {
      setClearing(false);
    }
  };

  const handleQuickVerifyOtp = async (order: FoodOrder) => {
    try {
      setVerifyingId(order.id);
      const res = await api.verifyFoodOrderOtp(order.id, order.delivery_otp);
      if (res.success) {
        await loadDashboard(true);
      } else {
        alert(res.error || 'Failed to verify OTP');
      }
    } catch (err: any) {
      alert(`Verification error: ${err.message}`);
    } finally {
      setVerifyingId(null);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const liveOrders: FoodOrder[] = data?.live_food_orders || [];

  const filteredOrders = liveOrders.filter((order) => {
    if (orderFilter === 'active') return order.status !== 'delivered';
    if (orderFilter === 'completed') return order.status === 'delivered';
    return true;
  });

  const activeCount = liveOrders.filter(o => o.status !== 'delivered').length;
  const completedCount = liveOrders.filter(o => o.status === 'delivered').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
            <Navigation className="w-3 h-3 text-blue-600" />
            Out for Delivery
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <ChefHat className="w-3 h-3 text-amber-600" />
            Cooking in Kitchen
          </span>
        );
      case 'ready_for_pickup':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Package className="w-3 h-3 text-indigo-600" />
            Ready for Pickup
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Delivered
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-[#FC8019] border border-orange-200">
            <ShoppingBag className="w-3 h-3 text-[#FC8019]" />
            Order Placed
          </span>
        );
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Heading & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E8E8E8] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-[#282C3F] tracking-tight">Delivery Operations Dashboard</h1>
            <span className="bg-orange-50 text-[#FC8019] border border-orange-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Radio className="w-3 h-3 animate-ping" />
              LIVE TELEMETRY
            </span>
          </div>
          <p className="text-sm text-[#686B78] mt-1 flex items-center gap-2">
            <span>{currentDate}</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync Active (Refreshed {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadDashboard()}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#E8E8E8] bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Refresh now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleSeedDemo}
            disabled={seeding}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#FC8019] text-[#FC8019] hover:bg-orange-50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Populate authentic Navi Mumbai delivery records"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{seeding ? 'Seeding...' : 'Load Navi Mumbai Demo'}</span>
          </button>

          <button
            onClick={handleClearDemo}
            disabled={clearing}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#E8E8E8] text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Reset demo records"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Demo</span>
          </button>

          <button
            onClick={() => navigate('/deliveries')}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#E8E8E8] text-[#282C3F] bg-white hover:bg-[#F7F7F7] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Orders List</span>
          </button>

          <button
            onClick={() => navigate('/route-planner')}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-[#FC8019] text-white hover:bg-[#E37315] shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Route className="w-3.5 h-3.5" />
            <span>Plan Route</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadDashboard()}
            className="px-3 py-1 bg-white border border-red-300 rounded text-xs font-bold text-red-700 hover:bg-red-50 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Deliveries */}
        <div className="bg-white p-4.5 rounded-xl border border-[#E8E8E8] shadow-xs">
          <div className="flex items-center justify-between text-[#686B78]">
            <span className="text-xs font-medium">Total Orders</span>
            <div className="p-1.5 rounded-lg bg-orange-50 text-[#FC8019]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-[#282C3F]">{loading ? '...' : data?.total_deliveries ?? 0}</span>
          </div>
          <p className="text-[11px] text-[#686B78] mt-1 flex items-center justify-between">
            <span>Database + Mobile</span>
            {liveOrders.length > 0 && (
              <span className="text-[#FC8019] font-bold">({liveOrders.length} Mobile)</span>
            )}
          </p>
        </div>

        {/* Pending Deliveries */}
        <div className="bg-white p-4.5 rounded-xl border border-[#E8E8E8] shadow-xs">
          <div className="flex items-center justify-between text-[#686B78]">
            <span className="text-xs font-medium">Pending & Prep</span>
            <div className="p-1.5 rounded-lg bg-yellow-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-amber-600">{loading ? '...' : data?.pending_deliveries ?? 0}</span>
          </div>
          <p className="text-[11px] text-[#686B78] mt-1">Awaiting dispatch/prep</p>
        </div>

        {/* Completed Deliveries */}
        <div className="bg-white p-4.5 rounded-xl border border-[#E8E8E8] shadow-xs">
          <div className="flex items-center justify-between text-[#686B78]">
            <span className="text-xs font-medium">Completed</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-[#16803D]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-[#16803D]">{loading ? '...' : data?.completed_deliveries ?? 0}</span>
          </div>
          <p className="text-[11px] text-[#686B78] mt-1">Delivered successfully</p>
        </div>

        {/* Planned Distance */}
        <div className="bg-white p-4.5 rounded-xl border border-[#E8E8E8] shadow-xs">
          <div className="flex items-center justify-between text-[#686B78]">
            <span className="text-xs font-medium">Total Distance</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl font-bold text-[#282C3F]">
              {loading ? '...' : data?.total_planned_distance?.text ?? '0 km'}
            </span>
          </div>
          <p className="text-[11px] text-[#686B78] mt-1">Road network travel</p>
        </div>

        {/* Distance Saved */}
        <div className="bg-white p-4.5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-medium">Distance Saved</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-[#16803D]">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl font-bold text-[#16803D]">
              {loading ? '...' : data?.total_distance_saved?.text ?? '0 km'}
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">
            {data?.overall_savings_percent ? `${data.overall_savings_percent}% reduction` : 'Via 2-Opt solver'}
          </p>
        </div>

        {/* Average Duration */}
        <div className="bg-white p-4.5 rounded-xl border border-[#E8E8E8] shadow-xs">
          <div className="flex items-center justify-between text-[#686B78]">
            <span className="text-xs font-medium">Avg Duration</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl font-bold text-[#282C3F]">
              {loading ? '...' : data?.average_duration?.text ?? '0 min'}
            </span>
          </div>
          <p className="text-[11px] text-[#686B78] mt-1">Per route plan</p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ⚡ LIVE MOBILE ORDERS FEED (Real-time from Smartphone APK) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-orange-200/80 shadow-md overflow-hidden">
        {/* Feed Header */}
        <div className="bg-gradient-to-r from-orange-500 via-[#FC8019] to-amber-500 p-5 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight">Live Mobile & Food Orders Feed</h2>
                  <span className="bg-white/25 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs">
                    <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-300" />
                    LIVE SYNC
                  </span>
                </div>
                <p className="text-xs text-orange-100 mt-0.5">
                  Real-time orders placed from Android smartphones, kitchen stations, and customer apps.
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center bg-black/15 p-1 rounded-xl backdrop-blur-md self-start sm:self-auto">
              <button
                onClick={() => setOrderFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  orderFilter === 'all'
                    ? 'bg-white text-[#FC8019] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                All Orders ({liveOrders.length})
              </button>
              <button
                onClick={() => setOrderFilter('active')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  orderFilter === 'active'
                    ? 'bg-white text-[#FC8019] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Active / En Route ({activeCount})
              </button>
              <button
                onClick={() => setOrderFilter('completed')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  orderFilter === 'completed'
                    ? 'bg-white text-[#FC8019] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Completed ({completedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Feed List Content */}
        <div className="p-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FC8019] mx-auto mb-3">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-[#282C3F]">No orders found for this filter</h3>
              <p className="text-xs text-[#686B78] mt-1 max-w-sm mx-auto">
                Orders placed from your Android mobile app will appear here instantly with live rider telemetry and OTP.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <button
                  onClick={() => navigate('/swiggy')}
                  className="px-4 py-2 bg-[#FC8019] text-white rounded-lg text-xs font-bold hover:bg-[#E37315] cursor-pointer shadow-xs"
                >
                  Place Test Order
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className={`p-5 rounded-xl border transition-all hover:shadow-md ${
                    order.status === 'delivered'
                      ? 'border-emerald-200 bg-emerald-50/15'
                      : order.status === 'out_for_delivery'
                      ? 'border-blue-200 bg-blue-50/20 ring-1 ring-blue-300'
                      : 'border-[#E8E8E8] bg-white'
                  }`}
                >
                  {/* Order Top Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-[#282C3F] bg-gray-100 px-2 py-0.5 rounded">
                        #{order.id}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-gray-500">
                        {order.created_at || 'Just now'}
                      </span>
                      <span className="text-[10px] bg-purple-100 text-purple-700 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Smartphone className="w-2.5 h-2.5" /> Mobile App
                      </span>
                    </div>
                  </div>

                  {/* Order Details Body */}
                  <div className="mt-3.5 space-y-3">
                    {/* Restaurant & Customer */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Restaurant</span>
                        <p className="font-extrabold text-[#282C3F] truncate">{order.restaurant?.name || 'Restaurant'}</p>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">{order.restaurant?.address || 'Kitchen Hub'}</p>
                      </div>

                      <div className="bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Customer</span>
                        <p className="font-extrabold text-[#282C3F] truncate">{order.customer?.name || 'Customer'}</p>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">{order.customer?.address || 'Delivery Address'}</p>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="bg-orange-50/40 p-2.5 rounded-lg border border-orange-100/60">
                      <span className="text-[10px] uppercase font-bold text-orange-700 block mb-1">
                        Dishes Ordered ({order.items?.length || 0})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {order.items?.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-orange-200/60 rounded text-[11px] font-semibold text-gray-800"
                          >
                            <span className="text-[#FC8019] font-bold">{item.quantity}x</span>
                            <span>{item.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Key Metrics Strip: OTP, Bill, ETA */}
                    <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg text-xs">
                      {/* OTP Badge */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 font-medium">OTP:</span>
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-black tracking-wider text-xs border border-amber-300">
                          {order.delivery_otp || 'N/A'}
                        </span>
                      </div>

                      {/* Total Amount */}
                      <div>
                        <span className="text-gray-500 font-medium mr-1">Bill:</span>
                        <span className="font-black text-[#282C3F]">
                          ₹{(order.bill?.grand_total || order.items?.reduce((sum, i) => sum + (i.price * i.quantity), 0) || 0).toLocaleString()}
                        </span>
                      </div>

                      {/* Distance & ETA */}
                      <div className="text-right">
                        <span className="text-gray-500 font-medium mr-1">ETA:</span>
                        <span className="font-bold text-[#FC8019]">
                          {order.estimated_delivery_mins || 15} mins ({order.distance_km || 2.4} km)
                        </span>
                      </div>
                    </div>

                    {/* Rider Info if assigned */}
                    {order.rider && (
                      <div className="flex items-center justify-between text-[11px] text-gray-600 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Navigation className="w-3.5 h-3.5 text-[#FC8019]" />
                          <span>Rider: <strong className="text-gray-800">{order.rider.name}</strong> ({order.rider.vehicle})</span>
                        </div>
                        {order.driver_location?.is_real_device_connected && (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                            Live Phone GPS
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Order Actions */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/track/${order.id}`)}
                        className="px-3 py-1.5 bg-[#FC8019] text-white hover:bg-[#E37315] rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Track Live Map</span>
                      </button>

                      <button
                        onClick={() => navigate('/kitchen')}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                        title="Open Kitchen Terminal"
                      >
                        <ChefHat className="w-3.5 h-3.5 text-red-500" />
                        <span>Kitchen</span>
                      </button>

                      <button
                        onClick={() => navigate(`/driver?orderId=${order.id}`)}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                        title="Open Driver Companion"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                        <span>Driver</span>
                      </button>
                    </div>

                    {/* Quick Complete / Verify OTP action if not delivered */}
                    {order.status !== 'delivered' && (
                      <button
                        onClick={() => handleQuickVerifyOtp(order)}
                        disabled={verifyingId === order.id}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs ml-auto"
                        title={`Verify customer OTP (${order.delivery_otp}) and complete delivery`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{verifyingId === order.id ? 'Verifying...' : 'Verify OTP & Complete'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Split: Recent Plans & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Route Plans (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E8E8E8] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8E8E8]">
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-[#FC8019]" />
              <h2 className="text-base font-bold text-[#282C3F]">Recent Optimized Plans</h2>
            </div>
            <button
              onClick={() => navigate('/history')}
              className="text-xs font-medium text-[#FC8019] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All Routes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-[#686B78]">Loading stored routes...</div>
          ) : !data?.recent_plans || data.recent_plans.length === 0 ? (
            <div className="py-12 text-center">
              <Route className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#282C3F]">No route plans generated yet</p>
              <p className="text-xs text-[#686B78] mt-1 max-w-sm mx-auto">
                Load the Navi Mumbai demo data or add custom delivery destinations to generate your first optimal tour.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={handleSeedDemo}
                  disabled={seeding}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#FC8019] text-[#FC8019] hover:bg-orange-50 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                  Load Demo Data
                </button>
                <button
                  onClick={() => navigate('/route-planner')}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-[#FC8019] text-white hover:bg-[#E37315] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Route</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recent_plans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-4 rounded-lg border border-[#E8E8E8] hover:border-orange-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-[#282C3F]">{plan.name}</span>
                      <Badge variant="orange">{plan.algorithm}</Badge>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        plan.status === 'completed'
                          ? 'bg-emerald-100 text-[#16803D]'
                          : plan.status === 'in_transit'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {plan.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-[#686B78] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="truncate max-w-md">Depot: {plan.start_address}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs shrink-0">
                    <div className="text-right">
                      <div className="font-bold text-[#282C3F]">
                        {(plan.total_distance_meters / 1000).toFixed(2)} km
                      </div>
                      <div className="text-emerald-700 font-medium text-[11px]">
                        Saved {(plan.distance_saved_meters / 1000).toFixed(2)} km ({plan.savings_percentage}%)
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => navigate('/route-planner', { state: { loadPlanId: plan.id } })}
                        className="px-3 py-1.5 rounded-lg border border-[#E8E8E8] text-[#282C3F] hover:bg-orange-50 hover:text-[#FC8019] font-medium text-xs transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => navigate('/execution', { state: { planId: plan.id } })}
                        className="p-1.5 rounded-lg bg-orange-100 text-[#FC8019] hover:bg-[#FC8019] hover:text-white transition-colors cursor-pointer"
                        title="Execute this route"
                      >
                        <PlayCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity List (1 Col) */}
        <div className="bg-white rounded-xl border border-[#E8E8E8] p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E8E8E8]">
            <Activity className="w-4 h-4 text-[#FC8019]" />
            <h2 className="text-base font-bold text-[#282C3F]">Event & Audit Trail</h2>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-[#686B78]">Loading audit trail...</div>
          ) : !data?.recent_activities || data.recent_activities.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#686B78]">
              No events recorded yet.
            </div>
          ) : (
            <div className="space-y-3.5">
              {data.recent_activities.map((act, idx) => (
                <div key={idx} className="flex gap-3 text-xs">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                    act.type === 'food_order' 
                      ? 'bg-purple-500 ring-2 ring-purple-100' 
                      : act.type === 'route_plan' 
                      ? 'bg-[#FC8019]' 
                      : 'bg-emerald-500'
                  }`} />
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-semibold text-[#282C3F] truncate">{act.title}</p>
                      {act.order_id && (
                        <button
                          onClick={() => navigate(`/track/${act.order_id}`)}
                          className="text-[10px] text-[#FC8019] hover:underline font-bold shrink-0 flex items-center gap-0.5"
                        >
                          <span>Track</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[#686B78] text-[11px] leading-tight break-words">{act.description}</p>
                    {act.timestamp && (
                      <span className="text-[10px] text-gray-400 block pt-0.5">
                        {act.timestamp}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
