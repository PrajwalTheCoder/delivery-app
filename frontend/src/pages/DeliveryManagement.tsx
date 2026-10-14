import React, { useEffect, useState } from 'react';
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
  X
} from 'lucide-react';
import { api } from '../services/api';
import type { Delivery, PriorityLevel, DeliveryStatus } from '../types';
import { Badge } from '../components/common/Badge';

export const DeliveryManagement: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Modal State
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

  useEffect(() => {
    loadDeliveries();
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDeliveries();
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
    setGeoQuery(d.address);
    setGeoResults([]);
    setShowModal(true);
  };

  const handleGeocodeSearch = async () => {
    if (!geoQuery.trim()) return;
    try {
      setGeoSearching(true);
      const res = await api.searchAddress(geoQuery, 4);
      setGeoResults(res.results || []);
    } catch (err: any) {
      alert(`Geocoding failed: ${err.message}`);
    } finally {
      setGeoSearching(false);
    }
  };

  const handleSelectGeocodeResult = (item: any) => {
    setFormData((prev) => ({
      ...prev,
      address: item.display_name || item.address,
      latitude: item.latitude.toString(),
      longitude: item.longitude.toString(),
      geocoding_confidence: item.confidence || 'verified'
    }));
    setGeoResults([]);
  };

  const handleSaveDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_label || !formData.address || !formData.latitude || !formData.longitude) {
      alert('Please provide Customer Name, Address, and valid Latitude & Longitude.');
      return;
    }

    try {
      const payload = {
        customer_label: formData.customer_label,
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        contact: formData.contact || null,
        description: formData.description || null,
        priority: formData.priority,
        package_weight_kg: parseFloat(formData.package_weight_kg || '1.0'),
        time_window_start: formData.time_window_start || null,
        time_window_end: formData.time_window_end || null,
        service_duration_minutes: parseInt(formData.service_duration_minutes || '10'),
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

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E8E8] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#282C3F] tracking-tight">Delivery Orders Management</h1>
          <p className="text-sm text-[#686B78] mt-0.5">
            Create, verify geocodes, and manage customer shipments for route planning.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-lg bg-[#FC8019] text-white hover:bg-[#E37315] font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Delivery Order</span>
        </button>
      </div>

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
                    <p className="text-xs text-gray-400 mt-0.5">Click "Add Delivery Order" to create your first shipment.</p>
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

      {/* Delete Confirmation Modal */}
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

            <form onSubmit={handleSaveDelivery} className="space-y-4">
              {/* Geocoding Search Assistance */}
              <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-100 space-y-2">
                <label className="block text-xs font-bold text-[#FC8019]">
                  Search Indian Address & Auto-Geocode Coordinates
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={geoQuery}
                    onChange={(e) => setGeoQuery(e.target.value)}
                    placeholder="e.g. Sector 17 Vashi, or Utsav Chowk Kharghar"
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#E8E8E8] bg-white focus:outline-none focus:border-[#FC8019]"
                  />
                  <button
                    type="button"
                    onClick={handleGeocodeSearch}
                    disabled={geoSearching}
                    className="px-3 py-1.5 rounded-lg bg-[#FC8019] text-white text-xs font-bold hover:bg-[#E37315] cursor-pointer disabled:opacity-50"
                  >
                    {geoSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {geoResults.length > 0 && (
                  <div className="bg-white rounded-lg border border-orange-200 divide-y divide-gray-100 mt-2 max-h-40 overflow-y-auto shadow-sm">
                    {geoResults.map((res, i) => (
                      <div
                        key={i}
                        onClick={() => handleSelectGeocodeResult(res)}
                        className="p-2 hover:bg-orange-50 cursor-pointer text-xs space-y-0.5 transition-colors"
                      >
                        <div className="font-semibold text-[#282C3F] truncate">{res.display_name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          Lat: {res.latitude.toFixed(4)}, Lon: {res.longitude.toFixed(4)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#282C3F] mb-1">Customer / Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customer_label}
                    onChange={(e) => setFormData({ ...formData, customer_label: e.target.value })}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#282C3F] mb-1">Phone Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="+91 98201 12345"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#282C3F] mb-1">Full Street Address *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street name, landmark, locality, PIN code"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#282C3F] mb-1">Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="e.g. 19.0434"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#282C3F] mb-1">Longitude *</label>
                  <input
                    type="number"
                    step="any"
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
