import React, { useEffect, useState } from 'react';
import { 
  Play, 
  BookOpen, 
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';

export const AlgorithmComparison: React.FC = () => {
  const [comparisonData, setComparisonData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<'distance' | 'duration'>('distance');

  const runComparison = async () => {
    try {
      setLoading(true);
      const res = await api.compareAlgorithms({
        start_node: 'A',
        target_node: 'G',
        weight_type: selectedObjective
      });
      setComparisonData(res);
    } catch (err: any) {
      alert(`Comparison failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runComparison();
  }, [selectedObjective]);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8E8E8] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#282C3F] tracking-tight">Algorithm Lab & PBL Viva Guide</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
              ACADEMIC BENCHMARK
            </span>
          </div>
          <p className="text-sm text-[#686B78] mt-0.5">
            Compare pathfinding (Dijkstra vs A*) and multi-stop tour optimization (Nearest Neighbor vs 2-Opt vs Exact Held-Karp).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedObjective}
            onChange={(e) => setSelectedObjective(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-lg border border-[#E8E8E8] bg-white font-semibold text-[#282C3F] focus:outline-none focus:border-[#FC8019]"
          >
            <option value="distance">Objective: Distance (meters)</option>
            <option value="duration">Objective: Travel Duration (seconds)</option>
          </select>

          <button
            onClick={runComparison}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-[#FC8019] text-white hover:bg-[#E37315] font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{loading ? 'Running Benchmark...' : 'Run Benchmark'}</span>
          </button>
        </div>
      </div>

      {/* Distinction Hero Banner: Pathfinding vs TSP */}
      <div className="p-6 rounded-2xl bg-linear-to-r from-orange-50 via-white to-orange-50/50 border border-orange-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-[#FC8019]">
          <BookOpen className="w-5 h-5" />
          <h2 className="text-base font-bold text-[#282C3F]">
            Fundamental Viva Concept: Pathfinding vs Stop-Order Optimization
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-[#686B78] leading-relaxed">
          <div className="p-4 rounded-xl bg-white border border-[#E8E8E8] space-y-2">
            <span className="font-bold text-sm text-[#282C3F] block">1. Pathfinding (Point-to-Point Routing)</span>
            <p>
              Given a starting intersection A and destination B, <strong>Dijkstra’s Algorithm</strong> and <strong>A* Search</strong> find the lowest-cost sequence of road segments through the street network graph.
            </p>
            <div className="pt-2 text-[11px] font-mono text-[#FC8019]">
              • Time Complexity: O(E + V log V) with Min-Heap priority queue
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E8E8E8] space-y-2">
            <span className="font-bold text-sm text-[#282C3F] block">2. Stop-Order Optimization (NP-Hard TSP)</span>
            <p>
              Given N delivery stops, finding the visit order that minimizes total road travel is the <strong>Traveling Salesperson Problem (TSP)</strong>. RouteWise AI uses an N×N road matrix with <strong>Nearest Neighbor</strong> and <strong>2-Opt local search</strong>.
            </p>
            <div className="pt-2 text-[11px] font-mono text-emerald-700">
              • Time Complexity: O(Iterations × N²) polynomial-time heuristic
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Stop TSP Heuristic Benchmark Table */}
      <div className="bg-white rounded-xl border border-[#E8E8E8] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-[#282C3F]">Multi-Stop TSP Optimization Benchmark</h2>
            <p className="text-xs text-[#686B78] mt-0.5">
              Tested on 5 realistic delivery locations starting from Central Hub
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-orange-100 text-[#FC8019]">
            Real OSRM Road Matrix
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] text-[#686B78] border-b border-[#E8E8E8]">
                <th className="py-3 px-4 font-semibold">Strategy / Algorithm</th>
                <th className="py-3 px-4 font-semibold">Classification</th>
                <th className="py-3 px-4 font-semibold">Time Complexity</th>
                <th className="py-3 px-4 font-semibold">Tour Order</th>
                <th className="py-3 px-4 font-semibold">Total Cost</th>
                <th className="py-3 px-4 font-semibold">Savings vs Baseline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E8]">
              {comparisonData?.tsp_comparison?.strategies?.map((strat: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50/70">
                  <td className="py-3 px-4 font-bold text-[#282C3F]">
                    {strat.name}
                  </td>
                  <td className="py-3 px-4 text-[#686B78]">{strat.type}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-gray-500">{strat.time_complexity}</td>
                  <td className="py-3 px-4 text-[11px] text-[#282C3F] max-w-xs truncate">
                    {strat.tour.join(' → ')}
                  </td>
                  <td className="py-3 px-4 font-bold text-[#282C3F]">{strat.formatted_cost}</td>
                  <td className="py-3 px-4">
                    {strat.improvement_vs_sequential_percent > 0 ? (
                      <span className="font-bold text-[#16803D]">
                        +{strat.improvement_vs_sequential_percent}% Saved
                      </span>
                    ) : (
                      <span className="text-gray-400">Baseline (0%)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pathfinding Comparison: Dijkstra vs A* */}
      <div className="bg-white rounded-xl border border-[#E8E8E8] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-[#282C3F]">Pathfinding Evaluation: Dijkstra vs A*</h2>
            <p className="text-xs text-[#686B78] mt-0.5">
              Evaluated on Mumbai South-Central Delivery Corridor Graph (Nodes A through G)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-[#E8E8E8] bg-[#FAFAFA] space-y-2 text-xs">
            <span className="font-bold text-sm text-[#282C3F]">Dijkstra's Algorithm</span>
            <p className="text-[#686B78]">
              Uninformed uniform-cost search. Explores in concentric contours without goal direction.
            </p>
            {comparisonData?.pathfinding_comparison?.dijkstra && (
              <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-1 text-[11px]">
                <div>Path: <strong>{comparisonData.pathfinding_comparison.dijkstra.path?.join(' → ')}</strong></div>
                <div>Total Distance: <strong>{(comparisonData.pathfinding_comparison.dijkstra.total_cost / 1000).toFixed(2)} km</strong></div>
                <div>Nodes Explored: <strong>{comparisonData.pathfinding_comparison.dijkstra.nodes_explored}</strong></div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/30 space-y-2 text-xs">
            <span className="font-bold text-sm text-[#FC8019]">A* Search (Admissible Heuristic)</span>
            <p className="text-[#686B78]">
              Informed search guided by Haversine spherical distance heuristic, evaluating fewer unnecessary nodes.
            </p>
            {comparisonData?.pathfinding_comparison?.astar && (
              <div className="p-3 bg-white rounded-lg border border-orange-200 space-y-1 text-[11px]">
                <div>Path: <strong>{comparisonData.pathfinding_comparison.astar.path?.join(' → ')}</strong></div>
                <div>Total Distance: <strong>{(comparisonData.pathfinding_comparison.astar.total_cost / 1000).toFixed(2)} km</strong></div>
                <div>Nodes Explored: <strong>{comparisonData.pathfinding_comparison.astar.nodes_explored}</strong></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* College PBL Viva Cheat Sheet Cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#FC8019]" />
          <h2 className="text-base font-bold text-[#282C3F]">PBL Viva Examination Q&A Cheatsheet</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-white p-4.5 rounded-xl border border-[#E8E8E8] shadow-xs space-y-2">
            <strong className="text-[#FC8019] block font-bold">
              Q: Why is Euclidean distance inaccurate for urban delivery planning?
            </strong>
            <p className="text-[#686B78] leading-relaxed">
              Straight-line Euclidean distance ignores physical urban barriers such as rivers, creeks, railway crossings, and one-way streets. Real delivery planning requires road-network distance matrices from services like OSRM.
            </p>
          </div>

          <div className="bg-white p-4.5 rounded-xl border border-[#E8E8E8] shadow-xs space-y-2">
            <strong className="text-[#FC8019] block font-bold">
              Q: How does the 2-Opt local search improvement work?
            </strong>
            <p className="text-[#686B78] leading-relaxed">
              2-Opt takes an initial tour from Nearest Neighbor and evaluates swapping two edges by reversing the tour sub-segment between them. If the swap reduces the total tour cost, the improvement is accepted, iteratively untangling criss-cross loops until a local optimum is reached.
            </p>
          </div>

          <div className="bg-white p-4.5 rounded-xl border border-[#E8E8E8] shadow-xs space-y-2">
            <strong className="text-[#FC8019] block font-bold">
              Q: Does real road routing automatically mean live traffic?
            </strong>
            <p className="text-[#686B78] leading-relaxed">
              No. Road routing calculates geometry and typical travel times from OpenStreetMap road speed limits. Live traffic prediction requires dynamic real-time traffic feed providers (e.g. TomTom, Google Maps Traffic). RouteWise AI uses static road network matrices for consistent, reproducible optimization.
            </p>
          </div>

          <div className="bg-white p-4.5 rounded-xl border border-[#E8E8E8] shadow-xs space-y-2">
            <strong className="text-[#FC8019] block font-bold">
              Q: Why is Nearest Neighbor alone not sufficient?
            </strong>
            <p className="text-[#686B78] leading-relaxed">
              Nearest Neighbor is a greedy heuristic that always visits the nearest unvisited node. Towards the end of the tour, it often leaves isolated distant nodes that force an expensive zigzag trip back to the depot. 2-Opt removes these severe late-stage detours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
