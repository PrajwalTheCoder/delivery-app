import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Sparkles, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Printer, 
  Compass, 
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import { DeliveryMap } from '../components/map/DeliveryMap';
import type { 
  LocationItem, 
  Delivery, 
  OptimizationResponse, 
  DestinationPolicy, 
  OptimizationObjective, 
  OptimizationAlgorithm 
} from '../types';

// Default Navi Mumbai Central Depot for authentic college PBL demonstration
const DEFAULT_DEPOT: LocationItem = {
  id: 'depot-kharghar-hub',
  display_name: 'RouteWise Central Depot — Sector 12, Kharghar, Navi Mumbai 410210',
  address: 'Central Distribution Hub, Sector 12, Kharghar, Navi Mumbai, Maharashtra 410210',
  latitude: 19.0434,
  longitude: 73.0683,
  type: 'warehouse'
};

export const RoutePlanner: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Route Setup State
  const [depot, setDepot] = useState<LocationItem>(DEFAULT_DEPOT);
  const [stops, setStops] = useState<LocationItem[]>([]);
  const [destinationPolicy, setDestinationPolicy] = useState<DestinationPolicy>('return_to_depot');
  const [objective, setObjective] = useState<OptimizationObjective>('distance');
  const [algorithm, setAlgorithm] = useState<OptimizationAlgorithm>('nearest_neighbor_2opt');
  const [enforcePriorities, setEnforcePriorities] = useState(true);
  const [planName, setPlanName] = useState(`Navi Mumbai Route - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);

  // Available Deliveries in Database
  const [availableDeliveries, setAvailableDeliveries] = useState<Delivery[]>([]);
  const [showAddDrawer, setShowAddDrawer] = useState(false);

  // Address Search for Direct Adding
  const [addressSearch, setAddressSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // Interactive Map & Selection State
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);

  // Optimization Result State
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResponse | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  // Load available deliveries from database
  const loadDeliveries = async () => {
    try {
      const res = await api.getDeliveries();
      setAvailableDeliveries(res.deliveries || []);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  // Check if routed with a loadPlanId in state
  useEffect(() => {
    const state = location.state as { loadPlanId?: string } | null;
    if (state?.loadPlanId) {
      api.getRouteById(state.loadPlanId).then((res) => {
        if (res.plan) {
          const p = res.plan;
          setPlanName(p.name);
          setDepot({
            address: p.start_address,
            latitude: p.start_latitude,
            longitude: p.start_longitude,
            display_name: p.start_address
          });
          setDestinationPolicy(p.destination_policy || 'return_to_depot');
          setAlgorithm(p.algorithm || 'nearest_neighbor_2opt');
          if (p.stops && p.stops.length > 0) {
            const loadedStops = p.stops.map((s: any) => ({
              id: s.delivery_id || s.id,
              customer_label: s.delivery?.customer_label || `Stop ${s.stop_order}`,
              address: s.delivery?.address || '',
              latitude: s.delivery?.latitude || 0,
              longitude: s.delivery?.longitude || 0,
              priority: s.delivery?.priority || 'normal',
              stop_order: s.stop_order,
              leg_distance_meters: s.leg_distance_meters,
              leg_duration_seconds: s.leg_duration_seconds,
              status: s.status
            }));
            setStops(loadedStops);
            if (p.route_geometry && p.route_geometry.length > 0) {
              setRouteGeometry(p.route_geometry);
            }
          }
        }
      }).catch(() => {});
    }
  }, [location.state]);

  // Geolocation handling
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const rev = await api.reverseGeocode(lat, lon);
          setDepot({
            id: 'depot-gps',
            address: rev.result?.address || `Current Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
            display_name: rev.result?.display_name || 'My Current Location',
            latitude: lat,
            longitude: lon,
            type: 'warehouse'
          });
        } catch {
          setDepot({
            id: 'depot-gps',
            address: `Current Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
            display_name: 'Current Location',
            latitude: lat,
            longitude: lon,
            type: 'warehouse'
          });
        }
      },
      (err) => {
        alert(`Location permission denied or unavailable: ${err.message}`);
      }
    );
  };

  // Add stop from stored delivery
  const handleAddStopFromDelivery = (d: Delivery) => {
    if (stops.some((s) => s.id === d.id)) return;
    const newStop: LocationItem = {
      id: d.id,
      customer_label: d.customer_label,
      address: d.address,
      latitude: d.latitude,
      longitude: d.longitude,
      priority: d.priority,
      contact: d.contact,
      package_weight_kg: d.package_weight_kg,
      time_window_start: d.time_window_start,
      time_window_end: d.time_window_end,
      notes: d.notes
    };
    setStops((prev) => [...prev, newStop]);
    setOptimizationResult(null);
  };

  // Add all pending deliveries in 1 click
  const handleAddAllPending = () => {
    const pending = availableDeliveries.filter(
      (d) => d.status === 'pending' && !stops.some((s) => s.id === d.id)
    );
    const newStops = pending.map((d) => ({
      id: d.id,
      customer_label: d.customer_label,
      address: d.address,
      latitude: d.latitude,
      longitude: d.longitude,
      priority: d.priority,
      contact: d.contact,
      package_weight_kg: d.package_weight_kg,
      time_window_start: d.time_window_start,
      time_window_end: d.time_window_end,
      notes: d.notes
    }));
    setStops((prev) => [...prev, ...newStops]);
    setOptimizationResult(null);
  };

  // Geocoding Search
  const handleAddressSearch = async () => {
    if (!addressSearch.trim()) return;
    try {
      setIsSearchingAddress(true);
      const res = await api.searchAddress(addressSearch, 4);
      setSearchResults(res.results || []);
    } catch (err: any) {
      alert(`Address search failed: ${err.message}`);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleSelectSearchResult = (item: any) => {
    const newStop: LocationItem = {
      id: `custom-${Date.now()}`,
      customer_label: item.address?.split(',')[0] || item.display_name?.split(',')[0] || 'Custom Stop',
      address: item.display_name || item.address,
      latitude: item.latitude,
      longitude: item.longitude,
      priority: 'normal',
      confidence: item.confidence
    };
    setStops((prev) => [...prev, newStop]);
    setSearchResults([]);
    setAddressSearch('');
    setOptimizationResult(null);
  };

  // Move stops up or down
  const moveStop = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= stops.length) return;
    const updated = [...stops];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setStops(updated);
    setOptimizationResult(null);
  };

  const removeStop = (index: number) => {
    setStops((prev) => prev.filter((_, i) => i !== index));
    setOptimizationResult(null);
  };

  // Preview Baseline Road Route
  const handlePreviewBaseline = async () => {
    if (stops.length === 0) {
      alert('Please add at least one delivery stop before previewing.');
      return;
    }
    try {
      setIsPreviewing(true);
      setErrorMessage(null);
      const res = await api.previewRoute({
        start: depot,
        stops,
        destination_policy: destinationPolicy
      });
      setRouteGeometry(res.route_geometry || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Baseline road preview failed.');
    } finally {
      setIsPreviewing(false);
    }
  };

  // Optimize Route
  const handleOptimizeRoute = async () => {
    if (stops.length === 0) {
      alert('Please add at least one delivery stop to optimize.');
      return;
    }
    try {
      setIsOptimizing(true);
      setErrorMessage(null);
      setSavedSuccessMessage(null);

      const payload = {
        name: planName,
        start: depot,
        stops,
        destination_policy: destinationPolicy,
        objective,
        algorithm,
        enforce_priorities: enforcePriorities,
        save_plan: true
      };

      const res: OptimizationResponse = await api.optimizeRoute(payload);
      setOptimizationResult(res);
      setRouteGeometry(res.route_geometry || []);
      setSavedSuccessMessage(`Route plan saved with ID: ${res.route_plan_id?.substring(0, 8)}...`);
      loadDeliveries();
    } catch (err: any) {
      setErrorMessage(err.message || 'Optimization failed.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handlePrintManifest = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8E8E8] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#282C3F] tracking-tight">Interactive Route Planner</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-[#FC8019]">
              CORE SOLVER
            </span>
          </div>
          <p className="text-xs text-[#686B78] mt-1">
            Build delivery routes using actual Indian road networks, compare sequential orders vs 2-opt solutions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setDepot(DEFAULT_DEPOT);
              handleAddAllPending();
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#FC8019] text-[#FC8019] hover:bg-orange-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Navi Mumbai Scenario</span>
          </button>

          <button
            onClick={() => {
              setStops([]);
              setOptimizationResult(null);
              setRouteGeometry([]);
            }}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#E8E8E8] text-gray-500 hover:bg-gray-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {savedSuccessMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16803D]" />
            <span>{savedSuccessMessage}</span>
          </div>
          {optimizationResult?.route_plan_id && (
            <button
              onClick={() => navigate('/execution', { state: { planId: optimizationResult.route_plan_id } })}
              className="px-2.5 py-1 text-xs font-bold rounded bg-[#16803D] text-white hover:bg-emerald-800 transition-colors cursor-pointer"
            >
              Start Route Execution →
            </button>
          )}
        </div>
      )}

      {/* Main Dual-Pane Layout: Left Config/Stops (5 cols) & Right Map (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration & Delivery Stops (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Warehouse / Depot Configuration Card */}
          <div className="bg-white rounded-xl border border-[#E8E8E8] p-4.5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FC8019]"></span>
                <h3 className="font-bold text-xs text-[#282C3F] uppercase tracking-wide">Depot / Warehouse Origin</h3>
              </div>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="text-[11px] font-semibold text-[#FC8019] hover:underline flex items-center gap-1 cursor-pointer"
                title="Use browser GPS location"
              >
                <Compass className="w-3 h-3" />
                <span>My Location</span>
              </button>
            </div>

            <div className="space-y-1">
              <div className="font-semibold text-xs text-[#282C3F] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FC8019] shrink-0" />
                <span className="truncate">{depot.display_name || depot.address}</span>
              </div>
              <div className="text-[11px] text-[#686B78] font-mono pl-5">
                {depot.latitude.toFixed(4)}, {depot.longitude.toFixed(4)}
              </div>
            </div>
          </div>

          {/* Route Optimization Settings */}
          <div className="bg-white rounded-xl border border-[#E8E8E8] p-4.5 shadow-xs space-y-3.5">
            <div className="font-bold text-xs text-[#282C3F] uppercase tracking-wide border-b border-gray-100 pb-2 flex items-center justify-between">
              <span>Optimization Settings</span>
              <span className="text-[10px] text-gray-400 font-normal">Deterministic Heuristic</span>
            </div>

            {/* Plan Name */}
            <div>
              <label className="block text-[11px] font-semibold text-[#686B78] mb-1">Route Plan Name</label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
              />
            </div>

            {/* Destination Policy: Return to Depot vs Open Route */}
            <div>
              <label className="block text-[11px] font-semibold text-[#686B78] mb-1.5">Destination Policy</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDestinationPolicy('return_to_depot')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all text-left ${
                    destinationPolicy === 'return_to_depot'
                      ? 'bg-orange-50/80 border-[#FC8019] text-[#FC8019]'
                      : 'border-[#E8E8E8] text-[#282C3F] hover:bg-gray-50'
                  }`}
                >
                  <div className="font-bold">Return to Depot</div>
                  <div className="text-[10px] text-gray-500 font-normal mt-0.5">Closed loop route</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDestinationPolicy('open_route')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all text-left ${
                    destinationPolicy === 'open_route'
                      ? 'bg-orange-50/80 border-[#FC8019] text-[#FC8019]'
                      : 'border-[#E8E8E8] text-[#282C3F] hover:bg-gray-50'
                  }`}
                >
                  <div className="font-bold">Open Route</div>
                  <div className="text-[10px] text-gray-500 font-normal mt-0.5">End at last delivery</div>
                </button>
              </div>
            </div>

            {/* Algorithm & Objective */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#686B78] mb-1">Algorithm Strategy</label>
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value as OptimizationAlgorithm)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                >
                  <option value="nearest_neighbor_2opt">Nearest Neighbor + 2-Opt</option>
                  <option value="nearest_neighbor">Nearest Neighbor (Greedy)</option>
                  <option value="exact_tsp">Exact Held-Karp (N ≤ 9)</option>
                  <option value="original">Original Sequence (Baseline)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#686B78] mb-1">Objective Cost</label>
                <select
                  value={objective}
                  onChange={(e) => setObjective(e.target.value as OptimizationObjective)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                >
                  <option value="distance">Shortest Distance (km)</option>
                  <option value="duration">Fastest Duration (min)</option>
                </select>
              </div>
            </div>

            {/* Priority Enforcement Toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-[#282C3F] font-medium">Prioritize Urgent & High Orders First</span>
              <input
                type="checkbox"
                checked={enforcePriorities}
                onChange={(e) => setEnforcePriorities(e.target.checked)}
                className="w-4 h-4 accent-[#FC8019] cursor-pointer"
              />
            </div>
          </div>

          {/* Delivery Stops Section */}
          <div className="bg-white rounded-xl border border-[#E8E8E8] p-4.5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-[#282C3F] uppercase tracking-wide">
                  Delivery Stops ({stops.length})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddAllPending}
                  className="text-[11px] font-semibold text-[#FC8019] hover:underline cursor-pointer"
                >
                  Add Pending
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddDrawer(!showAddDrawer)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-orange-50 text-[#FC8019] hover:bg-orange-100 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Stop</span>
                </button>
              </div>
            </div>

            {/* Add Stop Drawer / Search Input */}
            {showAddDrawer && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2.5">
                <div className="text-[11px] font-bold text-[#282C3F]">Direct Geocoding Address Search</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={addressSearch}
                    onChange={(e) => setAddressSearch(e.target.value)}
                    placeholder="Search Indian location (e.g. Vashi, Belapur, Seawoods)..."
                    className="flex-1 px-2.5 py-1 text-xs rounded border border-gray-300 bg-white focus:outline-none focus:border-[#FC8019]"
                  />
                  <button
                    type="button"
                    onClick={handleAddressSearch}
                    disabled={isSearchingAddress}
                    className="px-3 py-1 bg-[#282C3F] text-white text-xs font-semibold rounded hover:bg-black cursor-pointer disabled:opacity-50"
                  >
                    {isSearchingAddress ? '...' : 'Search'}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="bg-white rounded border border-gray-200 divide-y divide-gray-100 max-h-36 overflow-y-auto">
                    {searchResults.map((res, i) => (
                      <div
                        key={i}
                        onClick={() => handleSelectSearchResult(res)}
                        className="p-1.5 hover:bg-orange-50 text-xs cursor-pointer truncate"
                      >
                        <span className="font-semibold text-[#282C3F]">{res.display_name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stored deliveries quick add list */}
                {availableDeliveries.length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                      Or pick from database orders:
                    </span>
                    <div className="max-h-28 overflow-y-auto space-y-1">
                      {availableDeliveries.slice(0, 5).map((d) => (
                        <div
                          key={d.id}
                          onClick={() => handleAddStopFromDelivery(d)}
                          className="flex items-center justify-between p-1 rounded hover:bg-orange-50 cursor-pointer text-[11px]"
                        >
                          <span className="font-medium text-[#282C3F] truncate">{d.customer_label}</span>
                          <span className="text-[10px] text-[#FC8019] shrink-0 font-semibold">+ Add</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* List of Ordered Stops */}
            {stops.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#686B78]">
                <MapPin className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
                <p className="font-semibold text-[#282C3F]">No stops in this plan</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Click "Load Navi Mumbai Scenario" or add stops above.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {stops.map((stop, index) => {
                  const isSelected = selectedStopId === stop.id;
                  return (
                    <div
                      key={stop.id || index}
                      onClick={() => setSelectedStopId(stop.id || null)}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#FC8019] bg-orange-50/60 shadow-xs'
                          : 'border-[#E8E8E8] hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-[#282C3F] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          {index + 1}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-[#282C3F] truncate">
                            {stop.customer_label || stop.display_name}
                          </div>
                          <div className="text-[10px] text-[#686B78] truncate">{stop.address}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveStop(index, 'up');
                          }}
                          disabled={index === 0}
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveStop(index, 'down');
                          }}
                          disabled={index === stops.length - 1}
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeStop(index);
                          }}
                          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action Buttons: Preview Baseline & Optimize Route */}
            <div className="pt-2 border-t border-[#E8E8E8] flex gap-2">
              <button
                type="button"
                onClick={handlePreviewBaseline}
                disabled={isPreviewing || stops.length === 0}
                className="flex-1 py-2.5 rounded-lg border border-[#E8E8E8] text-[#282C3F] hover:bg-gray-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{isPreviewing ? 'Calculating...' : 'Preview Baseline Route'}</span>
              </button>

              <button
                type="button"
                onClick={handleOptimizeRoute}
                disabled={isOptimizing || stops.length === 0}
                className="flex-1 py-2.5 rounded-lg bg-[#FC8019] hover:bg-[#E37315] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isOptimizing ? 'Optimizing 2-Opt...' : 'Optimize Route'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Leaflet Map (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <DeliveryMap
            startLocation={depot}
            stops={stops}
            routeGeometry={routeGeometry}
            selectedStopId={selectedStopId}
            onSelectStop={(id) => setSelectedStopId(id)}
            heightClass="h-[520px]"
            isRealRoadGeometry={optimizationResult?.is_real_road_geometry ?? true}
          />

          {/* Results Comparison Card (Rendered prominently when optimization runs!) */}
          {optimizationResult && (
            <div className="bg-white rounded-xl border border-orange-200 p-5 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-[#16803D]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#282C3F]">Optimization Results</h3>
                    <p className="text-[11px] text-[#686B78]">
                      Algorithm: <strong className="text-[#282C3F]">{optimizationResult.algorithm}</strong> • Solved in {optimizationResult.execution_time_ms} ms
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {optimizationResult.route_plan_id && (
                    <a
                      href={api.getExportUrl(optimizationResult.route_plan_id, 'csv')}
                      className="px-2.5 py-1.5 rounded-lg border border-[#E8E8E8] text-xs font-semibold text-[#282C3F] hover:bg-gray-50 flex items-center gap-1 cursor-pointer"
                      title="Download Manifest CSV"
                    >
                      <Download className="w-3.5 h-3.5 text-[#FC8019]" />
                      <span>Export CSV</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={handlePrintManifest}
                    className="px-2.5 py-1.5 rounded-lg border border-[#E8E8E8] text-xs font-semibold text-[#282C3F] hover:bg-gray-50 flex items-center gap-1 cursor-pointer"
                    title="Print route summary"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* Side-by-Side Savings Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">Baseline Road Distance</span>
                  <div className="text-base font-bold text-[#282C3F] mt-0.5">
                    {optimizationResult.baseline_distance?.text || '—'}
                  </div>
                  <span className="text-[10px] text-gray-400">Sequential stop order</span>
                </div>

                <div className="p-3 rounded-lg bg-orange-50/70 border border-orange-200">
                  <span className="text-[10px] font-bold text-[#FC8019] uppercase block">Optimized Road Distance</span>
                  <div className="text-base font-bold text-[#282C3F] mt-0.5">
                    {optimizationResult.total_distance.text}
                  </div>
                  <span className="text-[10px] text-gray-500">
                    Est. Duration: {optimizationResult.estimated_duration.text}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200">
                  <span className="text-[10px] font-bold text-[#16803D] uppercase block">Distance Saved</span>
                  <div className="text-base font-extrabold text-[#16803D] mt-0.5">
                    {optimizationResult.distance_saved?.text || '0 km'} ({optimizationResult.savings_percentage ?? 0}%)
                  </div>
                  <span className="text-[10px] text-emerald-700">Authoritative road savings</span>
                </div>
              </div>

              {/* Ordered Stop Manifest Table */}
              <div className="border border-[#E8E8E8] rounded-lg overflow-hidden text-xs">
                <div className="bg-[#F8F9FA] px-3 py-2 font-bold text-[#282C3F] border-b border-[#E8E8E8] flex justify-between">
                  <span>Optimized Tour Manifest</span>
                  <span className="font-normal text-[#686B78] text-[11px]">
                    {optimizationResult.destination_policy === 'return_to_depot' ? 'Closed Loop (Returns to Depot)' : 'Open Tour (Finishes at Last Stop)'}
                  </span>
                </div>
                <div className="divide-y divide-[#E8E8E8] max-h-48 overflow-y-auto">
                  {optimizationResult.ordered_stops.map((stop) => (
                    <div
                      key={stop.stop_order}
                      onClick={() => setSelectedStopId(stop.id || null)}
                      className="px-3 py-2 flex items-center justify-between hover:bg-orange-50/40 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#FC8019] text-white flex items-center justify-center text-[10px] font-bold">
                          {stop.stop_order}
                        </span>
                        <div>
                          <strong className="text-[#282C3F]">{stop.customer_label || stop.display_name}</strong>
                          <div className="text-[10px] text-[#686B78] truncate max-w-xs">{stop.address}</div>
                        </div>
                      </div>

                      <div className="text-right text-[11px]">
                        <span className="font-bold text-[#282C3F]">
                          {(stop.leg_distance_meters ? stop.leg_distance_meters / 1000 : 0).toFixed(2)} km
                        </span>
                        <div className="text-[#16803D] text-[10px]">
                          ETA: +{stop.formatted_arrival || '0 min'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
