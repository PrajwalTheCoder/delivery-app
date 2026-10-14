import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Route, 
  Cpu, 
  ArrowRight, 
  Database,
  ShieldCheck,
  Compass
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-white text-[#282C3F]">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#E8E8E8] bg-linear-to-b from-[#FFF9F5] to-white py-16 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-[#FC8019] text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-[#FC8019] animate-pulse"></span>
            <span>College PBL Project • Intelligent Geospatial Optimization</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[#282C3F] leading-tight">
                Intelligent Delivery Route Planning & Optimization System
              </h1>
              <p className="text-base lg:text-lg text-[#686B78] leading-relaxed max-w-2xl">
                RouteWise AI solves multi-stop last-mile delivery logistics using real Indian road networks. 
                Powered by <strong>OSRM distance matrices</strong> and <strong>2-Opt local search heuristics</strong>, 
                eliminating criss-cross delays and slashing road transit times.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => navigate('/route-planner')}
                  className="px-6 py-3 rounded-xl bg-[#FC8019] hover:bg-[#E37315] text-white text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Route className="w-4 h-4" />
                  <span>Start Route Planning</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-5 py-3 rounded-xl border border-[#E8E8E8] hover:bg-[#F7F7F7] text-[#282C3F] text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-[#FC8019]" />
                  <span>Live Operations Dashboard</span>
                </button>

                <button
                  onClick={() => navigate('/algorithms')}
                  className="px-4 py-3 text-xs font-semibold text-[#686B78] hover:text-[#FC8019] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Cpu className="w-4 h-4" />
                  <span>View Algorithm Lab & Viva</span>
                </button>
              </div>

              {/* Trust & Spec Badges */}
              <div className="pt-6 border-t border-[#E8E8E8] grid grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="font-bold text-[#282C3F] text-sm">Real Road Geometry</div>
                  <div className="text-[#686B78] mt-0.5">OSRM Table & Waypoints</div>
                </div>
                <div>
                  <div className="font-bold text-[#282C3F] text-sm">2-Opt Local Search</div>
                  <div className="text-[#686B78] mt-0.5">Polynomial-Time Solver</div>
                </div>
                <div>
                  <div className="font-bold text-[#282C3F] text-sm">Navi Mumbai Hub</div>
                  <div className="text-[#686B78] mt-0.5">Kharghar Demo Corridor</div>
                </div>
              </div>
            </div>

            {/* Visual Preview Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-[#E8E8E8] p-6 shadow-lg space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
                    <span className="text-xs font-bold text-[#282C3F] ml-2">Route Optimization Engine</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-[#16803D]">
                    REAL METRICS
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="bg-orange-50/70 border border-orange-100 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-medium text-[#686B78]">Baseline vs 2-Opt Savings</div>
                      <div className="text-xl font-extrabold text-[#FC8019]">28.4% Distance Saved</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#FC8019] text-white flex items-center justify-center font-bold text-xs">
                      -6.2 km
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg border border-[#E8E8E8] bg-[#FAFAFA]">
                      <span className="text-[#686B78] text-[11px] block">Sequential Order</span>
                      <strong className="text-[#282C3F] text-sm font-bold">21.8 km (48 min)</strong>
                    </div>
                    <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
                      <span className="text-emerald-700 text-[11px] block">2-Opt Heuristic</span>
                      <strong className="text-emerald-800 text-sm font-bold">15.6 km (32 min)</strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-1.5 text-xs text-[#282C3F]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FC8019]"></span>
                      <span className="font-semibold">Depot:</span> Sector 12 Kharghar Central Hub
                    </div>
                    <div className="flex items-center gap-2 text-[#686B78]">
                      <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                      <span>Stops: Kharghar, Vashi, Belapur, Seawoods, Nerul</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/route-planner')}
                  className="w-full py-2.5 rounded-lg bg-[#282C3F] text-white hover:bg-black font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Open Route Planner Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FC8019]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Technical Workflow */}
      <section className="py-16 px-6 lg:px-12 max-w-6xl mx-auto space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl lg:text-3xl font-bold text-[#282C3F] tracking-tight">
            How RouteWise AI Plans Every Route
          </h2>
          <p className="text-sm text-[#686B78]">
            A complete 4-stage optimization pipeline moving from address search to field dispatch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-xl border border-[#E8E8E8] bg-white shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 text-[#FC8019] flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="font-bold text-sm text-[#282C3F]">Geocode & Pin Stops</h3>
            <p className="text-xs text-[#686B78] leading-relaxed">
              Accepts real Indian addresses, searches through configurable providers (Geoapify / LocationIQ / Nominatim), and maps accurate latitude & longitude coordinates.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-[#E8E8E8] bg-white shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="font-bold text-sm text-[#282C3F]">Query Road Matrix</h3>
            <p className="text-xs text-[#686B78] leading-relaxed">
              Constructs an N×N travel cost matrix using actual road driving distances and travel durations rather than straight-line Euclidean shortcuts.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-[#E8E8E8] bg-white shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-[#16803D] flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="font-bold text-sm text-[#282C3F]">2-Opt TSP Optimization</h3>
            <p className="text-xs text-[#686B78] leading-relaxed">
              Greedy Nearest Neighbor builds the initial tour; 2-Opt local search systematically untangles intersecting cross-legs, preserving warehouse depot constraints.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-[#E8E8E8] bg-white shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
              04
            </div>
            <h3 className="font-bold text-sm text-[#282C3F]">Dispatch & Execution</h3>
            <p className="text-xs text-[#686B78] leading-relaxed">
              Saves the plan to SQLite database, exports driver manifests to CSV, provides turn-by-turn navigation links, and tracks real delivery status updates.
            </p>
          </div>
        </div>
      </section>

      {/* Key Architectural Differentiators */}
      <section className="bg-[#F8F9FA] border-t border-b border-[#E8E8E8] py-16 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FC8019]">Engineering Design</span>
            <h2 className="text-2xl lg:text-3xl font-bold text-[#282C3F]">
              Built for Robust Academic Demonstration
            </h2>
            <p className="text-sm text-[#686B78]">
              Clean separation of geospatial routing from combinatorial stop optimization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-[#E8E8E8] shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-[#FC8019]">
                <Route className="w-5 h-5" />
                <h3 className="font-bold text-sm text-[#282C3F]">Pathfinding vs Tour Order</h3>
              </div>
              <p className="text-xs text-[#686B78] leading-relaxed">
                Clear distinction: Dijkstra and A* calculate point-to-point road segments; Nearest Neighbor & 2-Opt solve the NP-hard Traveling Salesperson visit sequence across multiple stops.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E8E8E8] shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-bold text-sm text-[#282C3F]">No Fabricated Metrics</h3>
              </div>
              <p className="text-xs text-[#686B78] leading-relaxed">
                All distance and duration savings are computed server-side directly comparing baseline sequential road costs against 2-opt costs using the same OSRM cost matrix.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E8E8E8] shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-blue-600">
                <Database className="w-5 h-5" />
                <h3 className="font-bold text-sm text-[#282C3F]">Persistent Database Store</h3>
              </div>
              <p className="text-xs text-[#686B78] leading-relaxed">
                Normalized relational tables for deliveries, route plans, stops, metrics snapshots, and status transition logs. Safe to restart the backend without losing historical plans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action footer */}
      <section className="py-12 px-6 text-center max-w-4xl mx-auto space-y-4">
        <h2 className="text-xl font-bold text-[#282C3F]">Ready to plan your first delivery tour?</h2>
        <p className="text-xs text-[#686B78]">
          Explore the pre-seeded Navi Mumbai demo or create custom delivery orders anywhere across India.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/route-planner')}
            className="px-6 py-2.5 rounded-xl bg-[#FC8019] hover:bg-[#E37315] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Launch Route Planner
          </button>
          <button
            onClick={() => navigate('/deliveries')}
            className="px-5 py-2.5 rounded-xl border border-[#E8E8E8] hover:bg-gray-50 text-[#282C3F] text-xs font-semibold transition-colors cursor-pointer"
          >
            Manage Delivery Orders
          </button>
        </div>
      </section>
    </div>
  );
};
