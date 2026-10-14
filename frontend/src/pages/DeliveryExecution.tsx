import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  ExternalLink, 
  Navigation,
  Phone
} from 'lucide-react';
import { api } from '../services/api';
import type { RoutePlan, RouteStop, LocationItem } from '../types';
import { DeliveryMap } from '../components/map/DeliveryMap';
import { Badge } from '../components/common/Badge';

export const DeliveryExecution: React.FC = () => {
  const location = useLocation();

  const [availableRoutes, setAvailableRoutes] = useState<RoutePlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [currentPlan, setCurrentPlan] = useState<RoutePlan | null>(null);

  // Active Stop Selection
  const [activeStopIndex, setActiveStopIndex] = useState<number>(0);

  // Failure Reason Modal
  const [failureStop, setFailureStop] = useState<RouteStop | null>(null);
  const [failureReason, setFailureReason] = useState('Customer address locked / unavailable');

  // Simulation State
  const [simulating, setSimulating] = useState(false);
  const [simCoordIndex, setSimCoordIndex] = useState(0);

  const loadRoutes = async () => {
    try {
      const res = await api.getRoutes();
      setAvailableRoutes(res.plans || []);

      const state = location.state as { planId?: string } | null;
      const initialId = state?.planId || (res.plans && res.plans.length > 0 ? res.plans[0].id : '');

      if (initialId) {
        setSelectedPlanId(initialId);
        loadPlanDetails(initialId);
      }
    } catch {
      // Ignored
    }
  };

  const loadPlanDetails = async (planId: string) => {
    try {
      const res = await api.getRouteById(planId);
      if (res.plan) {
        setCurrentPlan(res.plan);
        // Find first incomplete stop
        const stops: RouteStop[] = res.plan.stops || [];
        const nextIncomplete = stops.findIndex((s) => s.status !== 'delivered' && s.status !== 'failed');
        setActiveStopIndex(nextIncomplete >= 0 ? nextIncomplete : 0);
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const handleSelectPlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    setSimulating(false);
    setSimCoordIndex(0);
    loadPlanDetails(planId);
  };

  // Start route execution
  const handleStartRoute = async () => {
    if (!selectedPlanId) return;
    try {
      await api.startRoute(selectedPlanId);
      loadPlanDetails(selectedPlanId);
    } catch (err: any) {
      alert(`Error starting route: ${err.message}`);
    }
  };

  // Mark Stop Delivered
  const handleMarkDelivered = async (stop: RouteStop) => {
    if (!selectedPlanId) return;
    try {
      await api.updateStopStatus(selectedPlanId, stop.id, 'delivered');
      await loadPlanDetails(selectedPlanId);
    } catch (err: any) {
      alert(`Error updating stop: ${err.message}`);
    }
  };

  // Mark Stop Failed
  const handleMarkFailedSubmit = async () => {
    if (!selectedPlanId || !failureStop) return;
    try {
      await api.updateStopStatus(selectedPlanId, failureStop.id, 'failed', failureReason);
      setFailureStop(null);
      await loadPlanDetails(selectedPlanId);
    } catch (err: any) {
      alert(`Error updating stop: ${err.message}`);
    }
  };

  // Depot location representation
  const depotLocation: LocationItem = useMemo(() => {
    if (!currentPlan) {
      return {
        address: 'Central Depot',
        latitude: 19.0434,
        longitude: 73.0683,
        display_name: 'Central Depot'
      };
    }
    return {
      address: currentPlan.start_address,
      latitude: currentPlan.start_latitude,
      longitude: currentPlan.start_longitude,
      display_name: currentPlan.start_address
    };
  }, [currentPlan]);

  // Stops list for map
  const stopsList = useMemo(() => {
    if (!currentPlan?.stops) return [];
    return currentPlan.stops.map((s) => ({
      id: s.id,
      stop_order: s.stop_order,
      customer_label: s.delivery?.customer_label || `Stop ${s.stop_order}`,
      address: s.delivery?.address || '',
      latitude: s.delivery?.latitude || 0,
      longitude: s.delivery?.longitude || 0,
      status: s.status,
      priority: s.delivery?.priority,
      completed_at: s.completed_at
    }));
  }, [currentPlan]);

  const routeGeometry = useMemo(() => {
    return currentPlan?.route_geometry || [];
  }, [currentPlan]);

  // Vehicle Simulation Timer
  useEffect(() => {
    let timer: any = null;
    if (simulating && routeGeometry.length > 0) {
      timer = setInterval(() => {
        setSimCoordIndex((prev) => {
          if (prev >= routeGeometry.length - 1) {
            setSimulating(false);
            return 0;
          }
          return prev + 1;
        });
      }, 350);
    }
    return () => clearInterval(timer);
  }, [simulating, routeGeometry]);

  const vehiclePosition: [number, number] | null = useMemo(() => {
    if (routeGeometry.length > 0 && simCoordIndex < routeGeometry.length) {
      return routeGeometry[simCoordIndex];
    }
    return null;
  }, [routeGeometry, simCoordIndex]);

  // Progress metrics
  const completedStopsCount = useMemo(() => {
    if (!currentPlan?.stops) return 0;
    return currentPlan.stops.filter((s) => s.status === 'delivered').length;
  }, [currentPlan]);

  const failedStopsCount = useMemo(() => {
    if (!currentPlan?.stops) return 0;
    return currentPlan.stops.filter((s) => s.status === 'failed').length;
  }, [currentPlan]);

  const totalStopsCount = currentPlan?.stops?.length || 0;
  const progressPercent = totalStopsCount > 0 ? Math.round(((completedStopsCount + failedStopsCount) / totalStopsCount) * 100) : 0;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Plan Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8E8E8] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#282C3F] tracking-tight">Delivery Dispatch & Execution</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-[#16803D]">
              DRIVER COCKPIT
            </span>
          </div>
          <p className="text-sm text-[#686B78] mt-0.5">
            Step through deliveries, update actual arrival status, and provide live external navigation links.
          </p>
        </div>

        {/* Route Plan Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#686B78]">Select Route:</span>
          <select
            value={selectedPlanId}
            onChange={(e) => handleSelectPlanChange(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-[#E8E8E8] bg-white font-semibold text-[#282C3F] focus:outline-none focus:border-[#FC8019]"
          >
            {availableRoutes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({(r.total_distance_meters / 1000).toFixed(1)} km)
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentPlan ? (
        <div className="space-y-6">
          {/* Progress Bar & Status Ribbon */}
          <div className="bg-white rounded-xl border border-[#E8E8E8] p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[#282C3F]">{currentPlan.name}</h2>
                  <Badge variant={currentPlan.status === 'completed' ? 'green' : 'orange'}>
                    {currentPlan.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-[#686B78] mt-0.5">
                  Origin: <strong>{currentPlan.start_address}</strong> • Policy: {currentPlan.destination_policy === 'return_to_depot' ? 'Return to Depot' : 'Open Route'}
                </p>
              </div>

              {currentPlan.status === 'planned' && (
                <button
                  onClick={handleStartRoute}
                  className="px-4 py-2 rounded-lg bg-[#FC8019] text-white hover:bg-[#E37315] font-bold text-xs shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                >
                  Start Route Dispatch
                </button>
              )}
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[#686B78]">
                <span>
                  Delivery Progress: <strong>{completedStopsCount} delivered</strong>, {failedStopsCount} failed of {totalStopsCount} total
                </span>
                <span className="font-bold text-[#FC8019]">{progressPercent}% Completed</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden flex">
                <div
                  className="bg-[#16803D] h-full transition-all duration-500"
                  style={{ width: `${totalStopsCount ? (completedStopsCount / totalStopsCount) * 100 : 0}%` }}
                />
                <div
                  className="bg-[#D64545] h-full transition-all duration-500"
                  style={{ width: `${totalStopsCount ? (failedStopsCount / totalStopsCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Dual Pane: Left Stop Sequence (5 cols) & Right Map + Simulation (7 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Stops Column */}
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-bold text-[#686B78] uppercase tracking-wider px-1">
                Stop Sequence & Actions
              </div>

              <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {currentPlan.stops && currentPlan.stops.map((stop, idx) => {
                  const isDone = stop.status === 'delivered';
                  const isFailed = stop.status === 'failed';
                  const isActive = idx === activeStopIndex;
                  const d = stop.delivery;

                  const googleMapsUrl = d
                    ? `https://www.google.com/maps/dir/?api=1&destination=${d.latitude},${d.longitude}`
                    : '#';

                  return (
                    <div
                      key={stop.id}
                      onClick={() => setActiveStopIndex(idx)}
                      className={`p-4 rounded-xl border text-xs space-y-3 transition-all cursor-pointer ${
                        isActive
                          ? 'border-[#FC8019] bg-orange-50/40 shadow-xs'
                          : isDone
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : isFailed
                          ? 'border-red-200 bg-red-50/30'
                          : 'border-[#E8E8E8] bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${
                            isDone ? 'bg-[#16803D]' : isFailed ? 'bg-[#D64545]' : 'bg-[#282C3F]'
                          }`}>
                            {stop.stop_order}
                          </span>
                          <strong className="text-sm text-[#282C3F]">{d?.customer_label}</strong>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isDone
                            ? 'bg-emerald-100 text-[#16803D]'
                            : isFailed
                            ? 'bg-red-100 text-[#D64545]'
                            : 'bg-orange-100 text-[#FC8019]'
                        }`}>
                          {stop.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-1 text-[#686B78]">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#FC8019] shrink-0" />
                          <span>{d?.address}</span>
                        </p>
                        {d?.contact && (
                          <p className="flex items-center gap-1.5 pl-5 text-[11px]">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{d.contact}</span>
                          </p>
                        )}
                        {stop.failure_reason && (
                          <div className="p-2 rounded bg-red-100/70 text-red-800 text-[11px] font-medium">
                            Failure Reason: {stop.failure_reason}
                          </div>
                        )}
                      </div>

                      {/* Leg stats and navigation */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px]">
                        <span className="font-semibold text-[#282C3F]">
                          Leg: {stop.leg_distance_meters ? `${(stop.leg_distance_meters / 1000).toFixed(2)} km` : '—'}
                        </span>

                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#FC8019] hover:underline font-semibold flex items-center gap-1"
                          title="Open Google Maps Directions for Driver"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Google Maps Nav</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Action buttons if stop is not yet delivered or failed */}
                      {!isDone && !isFailed && (
                        <div className="pt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkDelivered(stop);
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-[#16803D] hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Delivered</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFailureStop(stop);
                            }}
                            className="flex-1 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Failed</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Map Column with Simulation Controls */}
            <div className="lg:col-span-7 space-y-4">
              {/* Simulation Controller Toolbar */}
              <div className="bg-white p-3.5 rounded-xl border border-[#E8E8E8] shadow-xs flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FC8019] animate-pulse"></span>
                  <span className="font-bold text-[#282C3F]">Road Simulation Controller</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSimulating(!simulating)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                      simulating
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        : 'bg-[#FC8019] text-white hover:bg-[#E37315]'
                    }`}
                  >
                    {simulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{simulating ? 'Pause Vehicle' : 'Simulate Drive'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSimulating(false);
                      setSimCoordIndex(0);
                    }}
                    className="p-1.5 rounded-lg border border-[#E8E8E8] hover:bg-gray-50 text-gray-500 cursor-pointer"
                    title="Reset vehicle to depot"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <DeliveryMap
                startLocation={depotLocation}
                stops={stopsList}
                routeGeometry={routeGeometry}
                vehiclePosition={vehiclePosition}
                heightClass="h-[520px]"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E8E8] p-12 text-center text-[#686B78] text-xs">
          No saved route plans found. Go to Route Planner to create and save your first delivery plan.
        </div>
      )}

      {/* Failure Reason Modal */}
      {failureStop && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E8E8E8] shadow-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-[#282C3F]">Record Delivery Failure</h3>
            <p className="text-xs text-[#686B78]">
              Specify the reason why <strong>{failureStop.delivery?.customer_label}</strong> could not be fulfilled:
            </p>

            <select
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
            >
              <option value="Customer address locked / unavailable">Customer address locked / unavailable</option>
              <option value="Customer phone switched off">Customer phone switched off</option>
              <option value="Wrong address / pin code mismatch">Wrong address / pin code mismatch</option>
              <option value="Customer refused delivery">Customer refused delivery</option>
              <option value="Road impassable or under construction">Road impassable or under construction</option>
            </select>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFailureStop(null)}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#E8E8E8] text-[#282C3F] hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMarkFailedSubmit}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Confirm Failure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
