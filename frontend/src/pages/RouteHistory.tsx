import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History, 
  Route, 
  MapPin, 
  Trash2, 
  Copy, 
  Play, 
  Download, 
  AlertCircle,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import type { RoutePlan } from '../types';
import { Badge } from '../components/common/Badge';

export const RouteHistory: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<RoutePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<RoutePlan | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getRoutes();
      setPlans(res.plans || []);
      if (res.plans && res.plans.length > 0 && !selectedPlan) {
        setSelectedPlan(res.plans[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch saved route history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteRoute(id);
      setDeleteConfirmId(null);
      if (selectedPlan?.id === id) {
        setSelectedPlan(null);
      }
      loadPlans();
    } catch (err: any) {
      alert(`Error deleting route plan: ${err.message}`);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await api.duplicateRoute(id);
      loadPlans();
      if (res.plan) {
        navigate('/route-planner', { state: { loadPlanId: res.plan.id } });
      }
    } catch (err: any) {
      alert(`Error duplicating route plan: ${err.message}`);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E8E8] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#282C3F] tracking-tight">Saved Routes & Historical Plans</h1>
          <p className="text-sm text-[#686B78] mt-0.5">
            Audit trail of calculated multi-stop delivery tours stored permanently in the database.
          </p>
        </div>

        <button
          onClick={() => navigate('/route-planner')}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-[#FC8019] text-white hover:bg-[#E37315] shadow-xs transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Route className="w-4 h-4" />
          <span>New Route Plan</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Split: Left Route List (5 cols) & Right Detail View (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#686B78] px-1">
            Historical Records ({plans.length})
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-[#686B78] bg-white rounded-xl border border-[#E8E8E8]">
              Loading route history...
            </div>
          ) : plans.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-xl border border-[#E8E8E8] p-6">
              <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#282C3F]">No routes saved yet</p>
              <p className="text-xs text-[#686B78] mt-1">Generate and save a route in the Route Planner workspace.</p>
              <button
                onClick={() => navigate('/route-planner')}
                className="mt-4 px-4 py-2 rounded-lg bg-[#FC8019] text-white text-xs font-bold hover:bg-[#E37315]"
              >
                Go to Planner
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {plans.map((p) => {
                const isSelected = selectedPlan?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p)}
                    className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#FC8019] bg-orange-50/50 shadow-xs'
                        : 'border-[#E8E8E8] bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-sm text-[#282C3F] truncate">{p.name}</strong>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        p.status === 'completed'
                          ? 'bg-emerald-100 text-[#16803D]'
                          : p.status === 'in_transit'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {p.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-[#686B78] text-[11px] flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#FC8019] shrink-0" />
                      <span className="truncate">{p.start_address}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[11px]">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#282C3F]">
                          {(p.total_distance_meters / 1000).toFixed(2)} km
                        </span>
                        <span className="text-emerald-700 font-semibold">
                          Saved {p.savings_percentage}%
                        </span>
                      </div>
                      <span className="text-gray-400">
                        {p.stops ? `${p.stops.length} stops` : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Detail Inspection */}
        <div className="lg:col-span-7">
          {selectedPlan ? (
            <div className="bg-white rounded-xl border border-[#E8E8E8] p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E8E8] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#282C3F]">{selectedPlan.name}</h2>
                    <Badge variant="orange">{selectedPlan.algorithm}</Badge>
                  </div>
                  <p className="text-xs text-[#686B78] mt-1 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>Created: {new Date(selectedPlan.created_at).toLocaleString()}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDuplicate(selectedPlan.id)}
                    className="p-2 rounded-lg border border-[#E8E8E8] text-[#282C3F] hover:bg-gray-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Duplicate to new route"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#FC8019]" />
                    <span>Duplicate</span>
                  </button>

                  <a
                    href={api.getExportUrl(selectedPlan.id, 'csv')}
                    className="p-2 rounded-lg border border-[#E8E8E8] text-[#282C3F] hover:bg-gray-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Export CSV Manifest"
                  >
                    <Download className="w-3.5 h-3.5 text-[#FC8019]" />
                    <span>CSV</span>
                  </a>

                  <button
                    onClick={() => navigate('/execution', { state: { planId: selectedPlan.id } })}
                    className="px-3 py-2 rounded-lg bg-[#FC8019] text-white hover:bg-[#E37315] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Start delivery execution"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Execute</span>
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(selectedPlan.id)}
                    className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs cursor-pointer"
                    title="Delete route"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Metrics Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Total Road Dist</span>
                  <strong className="text-sm text-[#282C3F]">
                    {(selectedPlan.total_distance_meters / 1000).toFixed(2)} km
                  </strong>
                </div>

                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Est. Duration</span>
                  <strong className="text-sm text-[#282C3F]">
                    {Math.round(selectedPlan.estimated_duration_seconds / 60)} mins
                  </strong>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Distance Saved</span>
                  <strong className="text-sm text-[#16803D]">
                    {(selectedPlan.distance_saved_meters / 1000).toFixed(2)} km
                  </strong>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Savings %</span>
                  <strong className="text-sm text-[#16803D]">
                    {selectedPlan.savings_percentage}%
                  </strong>
                </div>
              </div>

              {/* Depot & Destination Policy */}
              <div className="p-3.5 rounded-lg border border-[#E8E8E8] bg-gray-50/50 space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#282C3F]">Depot / Origin:</span>
                  <span className="text-[#686B78]">{selectedPlan.start_address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#282C3F]">Policy:</span>
                  <span className="text-[#686B78]">
                    {selectedPlan.destination_policy === 'return_to_depot' ? 'Return to Depot (Closed Loop)' : 'Open Tour (End at Last Delivery)'}
                  </span>
                </div>
              </div>

              {/* Stop Manifest */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#282C3F] uppercase tracking-wide">
                  Optimized Stop Sequence ({selectedPlan.stops?.length ?? 0} stops)
                </div>

                <div className="border border-[#E8E8E8] rounded-lg divide-y divide-[#E8E8E8] max-h-60 overflow-y-auto text-xs">
                  {selectedPlan.stops && selectedPlan.stops.length > 0 ? (
                    selectedPlan.stops.map((stop) => (
                      <div key={stop.id} className="p-3 flex items-center justify-between hover:bg-gray-50/80">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#282C3F] text-white flex items-center justify-center text-[10px] font-bold">
                            {stop.stop_order}
                          </span>
                          <div>
                            <div className="font-bold text-[#282C3F]">{stop.delivery?.customer_label}</div>
                            <div className="text-[11px] text-[#686B78]">{stop.delivery?.address}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            stop.status === 'delivered'
                              ? 'bg-emerald-100 text-[#16803D]'
                              : stop.status === 'failed'
                              ? 'bg-red-100 text-[#D64545]'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {stop.status.toUpperCase()}
                          </span>
                          {stop.leg_distance_meters && (
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              {(stop.leg_distance_meters / 1000).toFixed(2)} km
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-400">No stops recorded.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E8E8E8] p-12 text-center text-[#686B78] text-xs">
              Select a route plan from the left list to inspect details.
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E8E8E8] shadow-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-[#282C3F]">Confirm Route Deletion</h3>
            <p className="text-xs text-[#686B78]">
              Are you sure you want to delete this route plan? This will remove the route sequence and associated metrics snapshots.
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
                Delete Route
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
