import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  MapPin, 
  Clock, 
  Weight, 
  Phone, 
  AlertCircle,
  X,
  Smartphone,
  Navigation,
  ChefHat,
  CheckCircle2,
  ShieldCheck,
  ShoppingBag,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import type { Delivery, PriorityLevel, DeliveryStatus, FoodOrder } from '../types';
import { Badge } from '../components/common/Badge';

export const DeliveryManagement: React.FC = () => {
  const navigate = useNavigate();

  // Tab State: 'food' for real mobile phone orders, 'fleet' for B2B logistics
  const [activeTab, setActiveTab] = useState<'food' | 'fleet'>('food');

  // Fleet Deliveries State
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Food Orders State
  const [foodOrders, setFoodOrders] = useState<FoodOrder[]>([]);
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodStatusFilter, setFoodStatusFilter] = useState<string>('all');
  const [foodSearch, setFoodSearch] = useState<string>('');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Search & Filter for Fleet
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Modal State for Fleet
  const [showModal, setShowModal] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    customer_label: '',
    address: '',
    latitude: '',
    longitude: '',
    contact: '',
    description: '',
    priority: 'normal' as PriorityLevel,
    package_weight_kg: '1.5',
    time_window_start: '10:00',
    time_window_end: '14:00',
    service_duration_minutes: '10',
    notes: '',
    geocoding_confidence: 'high'
  });

  // Geocode Search State inside Modal
  const [geoQuery, setGeoQuery] = useState('');
  const [geoResults, setGeoResults] = useState<any[]>([]);
  const [geoSearching, setGeoSearching] = useState(false);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDeliveries({
        status: statusFilter,
        priority: priorityFilter,
        search
      });
      setDeliveries(res.deliveries || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch deliveries.');
    } finally {
      setLoading(false);
    }
  };

  const loadFoodOrders = async (silent = false) => {
    try {
      if (!silent) setFoodLoading(true);
      const res = await api.getFoodOrders();
      setFoodOrders(res.orders || []);
    } catch {
      // Ignored in silent polling
    } finally {
      if (!silent) setFoodLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    loadFoodOrders();
    const interval = setInterval(() => {
      loadFoodOrders(true);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'fleet') {
      loadDeliveries();
    }
  };

  const handleVerifyOtp = async (order: FoodOrder) => {
    try {
      setVerifyingId(order.id);
      const res = await api.verifyFoodOrderOtp(order.id, order.delivery_otp);
      if (res.success) {
        await loadFoodOrders();
      } else {
        alert(res.error || 'Failed to verify OTP');
      }
    } catch (err: any) {
      alert(`Verification error: ${err.message}`);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleOpenCreate = () => {
    setEditingDelivery(null);
    setFormData({
      customer_label: '',
      address: '',
      latitude: '',
      longitude: '',
      contact: '',
      description: '',
      priority: 'normal',
      package_weight_kg: '1.5',
      time_window_start: '10:00',
      time_window_end: '14:00',
      service_duration_minutes: '10',
      notes: '',
      geocoding_confidence: 'high'
    });
    setGeoQuery('');
    setGeoResults([]);
    setShowModal(true);
  };

  const handleOpenEdit = (d: Delivery) => {
    setEditingDelivery(d);
    setFormData({
      customer_label: d.customer_label,
      address: d.address,
      latitude: d.latitude.toString(),
      longitude: d.longitude.toString(),
      contact: d.contact || '',
      description: d.description || '',
      priority: d.priority,
      package_weight_kg: (d.package_weight_kg || 1.0).toString(),
      time_window_start: d.time_window_start || '',
      time_window_end: d.time_window_end || '',
      service_duration_minutes: (d.service_duration_minutes || 10).toString(),
      notes: d.notes || '',
      geocoding_confidence: d.geocoding_confidence || 'verified'
    });
    setGeoQuery('');
    setGeoResults([]);
    setShowModal(true);
  };

  const handleSearchAddress = async () => {
    if (!geoQuery.trim()) return;
    try {
      setGeoSearching(true);
      const res = await api.searchAddress(geoQuery);
      setGeoResults(res.results || []);
    } catch (err: any) {
      alert(`Geocoding error: ${err.message}`);
    } finally {
      setGeoSearching(false);
    }
  };

  const handleSelectAddress = (res: any) => {
    setFormData({
      ...formData,
      address: res.display_name,
      latitude: res.latitude.toString(),
      longitude: res.longitude.toString(),
      geocoding_confidence: res.confidence || 'high'
    });
    setGeoResults([]);
    setGeoQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        customer_label: formData.customer_label,
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        contact: formData.contact || null,
        description: formData.description || null,
        priority: formData.priority,
        package_weight_kg: parseFloat(formData.package_weight_kg) || 1.0,
        time_window_start: formData.time_window_start || null,
        time_window_end: formData.time_window_end || null,
        service_duration_minutes: parseInt(formData.service_duration_minutes) || 10,
        notes: formData.notes || null,
        geocoding_confidence: formData.geocoding_confidence
      };

      if (editingDelivery) {
        await api.updateDelivery(editingDelivery.id, payload);
      } else {
        await api.createDelivery(payload);
      }

      setShowModal(false);
      loadDeliveries();
    } catch (err: any) {
      alert(`Error saving delivery: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteDelivery(id);
      setDeleteConfirmId(null);
      loadDeliveries();
    } catch (err: any) {
      alert(`Error deleting delivery: ${err.message}`);
    }
  };

  const priorityColor = (p: PriorityLevel) => {
    switch (p) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'normal': return 'blue';
      case 'low': return 'gray';
    }
  };

  const statusBadge = (s: DeliveryStatus) => {
    switch (s) {
      case 'delivered': return <Badge variant="green">Delivered</Badge>;
      case 'in_transit': return <Badge variant="blue">In Transit</Badge>;
      case 'planned': return <Badge variant="orange">Planned</Badge>;
      case 'failed': return <Badge variant="red">Failed</Badge>;
      case 'cancelled': return <Badge variant="gray">Cancelled</Badge>;
      default: return <Badge variant="gray">Pending</Badge>;
    }
  };

  const getFoodStatusBadge = (status: string) => {
    switch (status) {
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Navigation className="w-3 h-3 text-blue-600 animate-spin" />
            Out for Delivery
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <ChefHat className="w-3 h-3 text-amber-600" />
            Cooking
          </span>
        );
      case 'ready_for_pickup':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Package className="w-3 h-3 text-indigo-600" />
            Ready
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Delivered
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-[#FC8019] border border-orange-200">
            <ShoppingBag className="w-3 h-3 text-[#FC8019]" />
            Placed
          </span>
        );
    }
  };

  const filteredFoodOrders = foodOrders.filter((order) => {
    if (foodStatusFilter !== 'all' && order.status !== foodStatusFilter) return false;
    if (foodSearch.trim()) {
      const q = foodSearch.toLowerCase();
      const matchId = order.id.toLowerCase().includes(q);
      const matchCustomer = order.customer?.name?.toLowerCase().includes(q);
      const matchRest = order.restaurant?.name?.toLowerCase().includes(q);
      const matchItem = order.items?.some(i => i.name.toLowerCase().includes(q));
      if (!matchId && !matchCustomer && !matchRest && !matchItem) return false;
    }
    return true;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E8E8] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#282C3F] tracking-tight">Delivery Orders Management</h1>
          <p className="text-sm text-[#686B78] mt-0.5">
            Real-time synchronization across mobile phone orders, cloud kitchens, and fleet logistics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'food' ? (
            <button
              onClick={() => navigate('/swiggy')}
              className="px-4 py-2.5 rounded-lg bg-[#FC8019] text-white hover:bg-[#E37315] font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Food Order</span>
            </button>
          ) : (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-lg bg-[#FC8019] text-white hover:bg-[#E37315] font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Shipment</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-[#E8E8E8]">
        <button
          onClick={() => setActiveTab('food')}
          className={`pb-3 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'food'
              ? 'border-[#FC8019] text-[#FC8019]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Live Mobile Food Orders</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
            activeTab === 'food' ? 'bg-orange-100 text-[#FC8019]' : 'bg-gray-100 text-gray-600'
          }`}>
            {foodOrders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('fleet')}
          className={`pb-3 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'fleet'
              ? 'border-[#FC8019] text-[#FC8019]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Fleet Logistics Deliveries</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
            activeTab === 'fleet' ? 'bg-orange-100 text-[#FC8019]' : 'bg-gray-100 text-gray-600'
          }`}>
            {deliveries.length}
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: LIVE MOBILE FOOD ORDERS VIEW                            */}
      {/* ============================================================== */}
      {activeTab === 'food' && (
        <div className="space-y-4">
          {/* Search & Filter Bar for Food */}
          <div className="bg-white p-4 rounded-xl border border-[#E8E8E8] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                  placeholder="Search by order ID (#RW-...), customer, restaurant, dish..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-[#686B78]">
                <Filter className="w-3.5 h-3.5" />
                <span>Status:</span>
                <select
                  value={foodStatusFilter}
                  onChange={(e) => setFoodStatusFilter(e.target.value)}
                  className="py-1 px-2 text-xs rounded-md border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                >
                  <option value="all">All Food Statuses</option>
                  <option value="placed">Placed</option>
                  <option value="preparing">Cooking</option>
                  <option value="ready_for_pickup">Ready for Pickup</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>

              <button
                onClick={() => loadFoodOrders()}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 cursor-pointer"
                title="Refresh food orders"
              >
                <RefreshCw className={`w-4 h-4 ${foodLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Food Orders Table */}
          <div className="bg-white rounded-xl border border-[#E8E8E8] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8F9FA] text-[#686B78] border-b border-[#E8E8E8]">
                    <th className="py-3 px-4 font-semibold">Order ID & Source</th>
                    <th className="py-3 px-4 font-semibold">Customer & Delivery Location</th>
                    <th className="py-3 px-4 font-semibold">Restaurant / Kitchen</th>
                    <th className="py-3 px-4 font-semibold">Ordered Dishes</th>
                    <th className="py-3 px-4 font-semibold">Bill & OTP</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E8]">
                  {foodLoading && foodOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#686B78]">
                        Loading mobile food orders...
                      </td>
                    </tr>
                  ) : filteredFoodOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#686B78]">
                        <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-semibold text-sm text-[#282C3F]">No food orders match your filter</p>
                        <p className="text-xs text-gray-400 mt-0.5">Orders placed from the phone app appear here automatically.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredFoodOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-[#282C3F]">
                          <div className="font-extrabold text-[#282C3F]">#{order.id}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.2 rounded flex items-center gap-1">
                              <Smartphone className="w-2.5 h-2.5" /> Mobile App
                            </span>
                            <span className="text-[10px] text-gray-400">{order.created_at || 'Just now'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-[#282C3F]">{order.customer?.name || 'Customer'}</div>
                          <div className="text-[11px] text-[#686B78] truncate mt-0.5">{order.customer?.address || 'Kharghar'}</div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#FC8019]" />
                            <span>{order.customer?.latitude?.toFixed(4)}, {order.customer?.longitude?.toFixed(4)}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#282C3F]">{order.restaurant?.name || 'Kitchen Hub'}</div>
                          <div className="text-[11px] text-gray-500 truncate">{order.restaurant?.locality || 'Navi Mumbai'}</div>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {order.items?.map((it, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium"
                              >
                                {it.quantity}x {it.name}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-[#282C3F]">
                            ₹{(order.bill?.grand_total || order.items?.reduce((s, i) => s + (i.price * i.quantity), 0) || 0).toLocaleString()}
                          </div>
                          <div className="mt-1">
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-black text-[11px] border border-amber-300">
                              OTP: {order.delivery_otp || 'N/A'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {getFoodStatusBadge(order.status)}
                          {order.rider && (
                            <div className="text-[10px] text-gray-500 mt-1">
                              Rider: {order.rider.name}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/track/${order.id}`)}
                              className="px-2.5 py-1.5 bg-[#FC8019] text-white hover:bg-[#E37315] rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="Track Live Map"
                            >
                              <Navigation className="w-3 h-3" />
                              <span>Track</span>
                            </button>

                            {order.status !== 'delivered' && (
                              <button
                                onClick={() => handleVerifyOtp(order)}
                                disabled={verifyingId === order.id}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title={`Verify OTP (${order.delivery_otp}) and complete`}
                              >
                                <ShieldCheck className="w-3 h-3" />
                                <span>Verify OTP</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: FLEET LOGISTICS DELIVERIES VIEW                         */}
      {/* ============================================================== */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-[#E8E8E8] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by customer, address, notes..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#282C3F] text-white hover:bg-black transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-[#686B78]">
                <Filter className="w-3.5 h-3.5" />
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="py-1 px-2 text-xs rounded-md border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="planned">Planned</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#686B78]">
                <span>Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="py-1 px-2 text-xs rounded-md border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Deliveries Table */}
          <div className="bg-white rounded-xl border border-[#E8E8E8] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8F9FA] text-[#686B78] border-b border-[#E8E8E8]">
                    <th className="py-3 px-4 font-semibold">Customer & Recipient</th>
                    <th className="py-3 px-4 font-semibold">Address & Coordinates</th>
                    <th className="py-3 px-4 font-semibold">Priority</th>
                    <th className="py-3 px-4 font-semibold">Time Window</th>
                    <th className="py-3 px-4 font-semibold">Package Weight</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E8]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#686B78]">
                        Loading delivery orders...
                      </td>
                    </tr>
                  ) : deliveries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#686B78]">
                        <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-semibold text-sm text-[#282C3F]">No delivery orders found</p>
                        <p className="text-xs text-gray-400 mt-0.5">Click "Add Shipment" to create your first shipment.</p>
                      </td>
                    </tr>
                  ) : (
                    deliveries.map((del) => (
                      <tr key={del.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4 font-medium text-[#282C3F]">
                          <div className="font-bold text-[#282C3F]">{del.customer_label}</div>
                          {del.contact && (
                            <div className="text-[11px] text-[#686B78] flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span>{del.contact}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <div className="text-[#282C3F] truncate">{del.address}</div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#FC8019]" />
                            <span>{del.latitude.toFixed(4)}, {del.longitude.toFixed(4)}</span>
                            {del.geocoding_confidence && (
                              <span className="text-[9px] bg-green-50 text-green-700 px-1 py-0.2 rounded border border-green-200">
                                {del.geocoding_confidence}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <Badge variant={priorityColor(del.priority)}>{del.priority.toUpperCase()}</Badge>
                        </td>

                        <td className="py-3 px-4 text-[#686B78]">
                          {del.time_window_start && del.time_window_end ? (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span>{del.time_window_start} - {del.time_window_end}</span>
                            </span>
                          ) : (
                            <span className="text-gray-400">Anytime</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-[#282C3F]">
                          <span className="flex items-center gap-1">
                            <Weight className="w-3 h-3 text-gray-400" />
                            <span>{del.package_weight_kg ? `${del.package_weight_kg} kg` : '1.0 kg'}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {statusBadge(del.status)}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(del)}
                              className="p-1.5 rounded hover:bg-gray-100 text-[#686B78] hover:text-[#282C3F] transition-colors cursor-pointer"
                              title="Edit order"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(del.id)}
                              className="p-1.5 rounded hover:bg-red-50 text-[#686B78] hover:text-red-600 transition-colors cursor-pointer"
                              title="Delete order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Fleet */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E8E8E8] shadow-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-[#282C3F]">Confirm Deletion</h3>
            <p className="text-xs text-[#686B78]">
              Are you sure you want to delete this delivery order? This action will permanently remove it from the database.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#E8E8E8] text-[#282C3F] hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal with Real Geocoding Search */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E8E8E8] shadow-xl p-6 max-w-xl w-full my-8 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E8E8E8] pb-3">
              <h2 className="text-lg font-bold text-[#282C3F]">
                {editingDelivery ? 'Edit Delivery Order' : 'New Delivery Order'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#282C3F] mb-1">Customer / Consignee Label *</label>
                <input
                  type="text"
                  required
                  value={formData.customer_label}
                  onChange={(e) => setFormData({ ...formData, customer_label: e.target.value })}
                  placeholder="e.g. Ramesh Patel (Flat 302)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#282C3F] mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="+91 98200 12345"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#282C3F] mb-1">Order Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Electronics, Grocery, etc."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                  />
                </div>
              </div>

              {/* Real Geocoding Search Assistant */}
              <div className="p-3 rounded-xl bg-orange-50/50 border border-orange-100 space-y-2">
                <label className="block text-xs font-bold text-[#FC8019]">
                  Live Address Search (OpenStreetMap Nominatim)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={geoQuery}
                    onChange={(e) => setGeoQuery(e.target.value)}
                    placeholder="Search landmark, sector, Navi Mumbai address..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                  />
                  <button
                    type="button"
                    onClick={handleSearchAddress}
                    disabled={geoSearching}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#FC8019] text-white hover:bg-[#E37315] disabled:opacity-50 cursor-pointer"
                  >
                    {geoSearching ? 'Searching...' : 'Find GPS'}
                  </button>
                </div>

                {geoResults.length > 0 && (
                  <div className="mt-2 max-h-36 overflow-y-auto space-y-1 bg-white p-2 rounded-lg border border-[#E8E8E8]">
                    {geoResults.map((r, i) => (
                      <div
                        key={i}
                        onClick={() => handleSelectAddress(r)}
                        className="p-1.5 hover:bg-orange-50 rounded text-[11px] text-[#282C3F] cursor-pointer flex items-center justify-between"
                      >
                        <span className="truncate pr-2">{r.display_name}</span>
                        <span className="text-[10px] text-gray-400 shrink-0 font-mono">
                          {r.latitude.toFixed(3)}, {r.longitude.toFixed(3)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#282C3F] mb-1">Delivery Address *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full street address in Navi Mumbai..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#282C3F] mb-1">Latitude *</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="e.g. 19.0345"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#282C3F] mb-1">Longitude *</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="e.g. 73.0683"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#282C3F] mb-1">Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as PriorityLevel })}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#282C3F] mb-1">Package Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.package_weight_kg}
                    onChange={(e) => setFormData({ ...formData, package_weight_kg: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#282C3F] mb-1">Service Time (min)</label>
                  <input
                    type="number"
                    value={formData.service_duration_minutes}
                    onChange={(e) => setFormData({ ...formData, service_duration_minutes: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#282C3F] mb-1">Time Window Start</label>
                  <input
                    type="time"
                    value={formData.time_window_start}
                    onChange={(e) => setFormData({ ...formData, time_window_start: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#282C3F] mb-1">Time Window End</label>
                  <input
                    type="time"
                    value={formData.time_window_end}
                    onChange={(e) => setFormData({ ...formData, time_window_end: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#282C3F] mb-1">Delivery Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Gate instructions, landmark details, fragile items..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E8E8E8]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#E8E8E8] text-[#282C3F] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-[#FC8019] text-white hover:bg-[#E37315] shadow-xs cursor-pointer"
                >
                  {editingDelivery ? 'Update Order' : 'Save Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
