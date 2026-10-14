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
  PlayCircle
} from 'lucide-react';
import { api } from '../services/api';
import type { AnalyticsSummary } from '../types';
import { Badge } from '../components/common/Badge';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAnalyticsSummary();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
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

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Heading & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E8E8E8] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#282C3F] tracking-tight">Delivery Operations Dashboard</h1>
          <p className="text-sm text-[#686B78] mt-1 flex items-center gap-2">
            <span>{currentDate}</span>
            <span>•</span>
            <span className="text-[#FC8019] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FC8019]"></span>
              Navi Mumbai Hub Active
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#E8E8E8] text-[#282C3F] hover:bg-[#F7F7F7] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Order</span>
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
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
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
          <p className="text-[11px] text-[#686B78] mt-1">In database</p>
        </div>

        {/* Pending Deliveries */}
        <div className="bg-white p-4.5 rounded-xl border border-[#E8E8E8] shadow-xs">
          <div className="flex items-center justify-between text-[#686B78]">
            <span className="text-xs font-medium">Pending</span>
            <div className="p-1.5 rounded-lg bg-yellow-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-amber-600">{loading ? '...' : data?.pending_deliveries ?? 0}</span>
          </div>
          <p className="text-[11px] text-[#686B78] mt-1">Awaiting dispatch</p>
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
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    act.type === 'route_plan' ? 'bg-[#FC8019]' : 'bg-emerald-500'
                  }`} />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-[#282C3F]">{act.title}</p>
                    <p className="text-[#686B78] text-[11px] leading-tight">{act.description}</p>
                    {act.timestamp && (
                      <span className="text-[10px] text-gray-400 block pt-0.5">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
