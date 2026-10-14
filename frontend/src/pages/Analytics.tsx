import React, { useEffect, useState } from 'react';
import { 
  AlertCircle,
  Table as TableIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { api } from '../services/api';
import type { RouteAnalyticsCharts, AnalyticsSummary } from '../types';

const COLORS = ['#FC8019', '#16803D', '#D64545', '#3B82F6', '#8B5CF6', '#F59E0B'];

export const Analytics: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [charts, setCharts] = useState<RouteAnalyticsCharts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const [sumRes, chartRes] = await Promise.all([
          api.getAnalyticsSummary(),
          api.getRouteAnalytics()
        ]);
        setSummary(sumRes);
        setCharts(chartRes);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch analytics.');
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#E8E8E8] pb-5">
        <h1 className="text-2xl font-bold text-[#282C3F] tracking-tight">Performance Analytics & KPIs</h1>
        <p className="text-sm text-[#686B78] mt-0.5">
          Authoritative metrics and distance savings computed directly from stored route records and OSRM cost matrices.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#E8E8E8] shadow-xs">
          <span className="text-xs font-semibold text-[#686B78] uppercase">Total Planned Road Distance</span>
          <div className="text-2xl font-bold text-[#282C3F] mt-2">
            {loading ? '...' : summary?.total_planned_distance?.text || '0 km'}
          </div>
          <p className="text-[11px] text-[#686B78] mt-1">Across all optimized routes</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-xs font-semibold text-[#16803D] uppercase">Total Distance Saved</span>
          <div className="text-2xl font-extrabold text-[#16803D] mt-2">
            {loading ? '...' : summary?.total_distance_saved?.text || '0 km'}
          </div>
          <p className="text-[11px] text-[#16803D] mt-1">
            {summary?.overall_savings_percent ? `${summary.overall_savings_percent}% reduction vs sequential baseline` : 'Via 2-Opt local search'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E8E8E8] shadow-xs">
          <span className="text-xs font-semibold text-[#686B78] uppercase">Average Route Duration</span>
          <div className="text-2xl font-bold text-[#282C3F] mt-2">
            {loading ? '...' : summary?.average_duration?.text || '0 min'}
          </div>
          <p className="text-[11px] text-[#686B78] mt-1">Calculated from OSRM matrices</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E8E8E8] shadow-xs">
          <span className="text-xs font-semibold text-[#686B78] uppercase">Orders Fulfilled</span>
          <div className="text-2xl font-bold text-[#282C3F] mt-2">
            {loading ? '...' : `${summary?.completed_deliveries ?? 0} / ${summary?.total_deliveries ?? 0}`}
          </div>
          <p className="text-[11px] text-[#686B78] mt-1">Active customer shipments</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deliveries by Status (Pie Chart) */}
        <div className="bg-white p-6 rounded-xl border border-[#E8E8E8] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-[#282C3F]">Delivery Orders Distribution by Status</h2>
            <span className="text-[10px] text-gray-400">Live Database</span>
          </div>

          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">Loading chart...</div>
            ) : !charts?.deliveries_by_status || charts.deliveries_by_status.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">No order data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.deliveries_by_status}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry: any) => `${entry.name} (${entry.value ?? entry.count ?? ''})`}
                  >
                    {charts.deliveries_by_status.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Priority Breakdown (Bar Chart) */}
        <div className="bg-white p-6 rounded-xl border border-[#E8E8E8] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-[#282C3F]">Deliveries by Priority Level</h2>
            <span className="text-[10px] text-gray-400">Urgent vs Normal vs Low</span>
          </div>

          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">Loading chart...</div>
            ) : !charts?.deliveries_by_priority || charts.deliveries_by_priority.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">No priority data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.deliveries_by_priority}>
                  <XAxis dataKey="name" stroke="#686B78" fontSize={11} />
                  <YAxis stroke="#686B78" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#FC8019" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Saved Route Distance Comparison (Bar Chart) */}
        <div className="bg-white p-6 rounded-xl border border-[#E8E8E8] shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-[#282C3F]">Road Distance by Saved Route (Baseline vs Optimized)</h2>
            <span className="text-[10px] text-gray-400">Kilometers (km)</span>
          </div>

          <div className="h-72 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">Loading chart...</div>
            ) : !charts?.distance_by_route || charts.distance_by_route.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                No route plans saved yet to compare. Generate routes in Route Planner first.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.distance_by_route}>
                  <XAxis dataKey="name" stroke="#686B78" fontSize={11} />
                  <YAxis stroke="#686B78" fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="baseline_km" name="Baseline (Sequential)" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="distance_km" name="Optimized (2-Opt)" fill="#FC8019" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saved_km" name="Distance Saved" fill="#16803D" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Tabular Equivalent for Accessibility */}
      <div className="bg-white rounded-xl border border-[#E8E8E8] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <TableIcon className="w-4 h-4 text-[#FC8019]" />
          <h2 className="text-sm font-bold text-[#282C3F]">Tabular Route Performance Summary (Accessibility Table)</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] text-[#686B78] border-b border-[#E8E8E8]">
                <th className="py-2.5 px-4 font-semibold">Route Plan Name</th>
                <th className="py-2.5 px-4 font-semibold">Stops</th>
                <th className="py-2.5 px-4 font-semibold">Baseline Dist (km)</th>
                <th className="py-2.5 px-4 font-semibold">Optimized Dist (km)</th>
                <th className="py-2.5 px-4 font-semibold">Saved (km)</th>
                <th className="py-2.5 px-4 font-semibold">Improvement %</th>
                <th className="py-2.5 px-4 font-semibold">Est. Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E8]">
              {charts?.distance_by_route && charts.distance_by_route.length > 0 ? (
                charts.distance_by_route.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50/70">
                    <td className="py-2.5 px-4 font-bold text-[#282C3F]">{r.name}</td>
                    <td className="py-2.5 px-4 text-[#686B78]">{r.stops} stops</td>
                    <td className="py-2.5 px-4 text-[#686B78]">{r.baseline_km ? `${r.baseline_km} km` : '—'}</td>
                    <td className="py-2.5 px-4 font-semibold text-[#282C3F]">{r.distance_km} km</td>
                    <td className="py-2.5 px-4 font-semibold text-[#16803D]">{r.saved_km ? `${r.saved_km} km` : '—'}</td>
                    <td className="py-2.5 px-4 font-bold text-[#16803D]">{r.savings_percent ? `${r.savings_percent}%` : '—'}</td>
                    <td className="py-2.5 px-4 text-[#686B78]">{r.duration_min} mins</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-400">
                    No routes saved yet to display tabular data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
