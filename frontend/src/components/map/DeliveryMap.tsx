import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { LocationItem, OrderedStop } from '../../types';
import { Maximize2, Navigation } from 'lucide-react';

// Custom Leaflet DivIcons
const createHubIcon = () =>
  L.divIcon({
    className: 'custom-hub-pin',
    html: `<div style="background-color:#FC8019; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:10px; font-weight:800; box-shadow:0 3px 8px rgba(0,0,0,0.3); border:2.5px solid white; letter-spacing:0.5px;">DEPOT</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });

const createStopIcon = (stopNumber: number, isCompleted = false, isSelected = false, isFailed = false) => {
  let bgColor = '#282C3F';
  if (isCompleted) bgColor = '#16803D';
  else if (isFailed) bgColor = '#D64545';
  else if (isSelected) bgColor = '#FC8019';

  const ringStyle = isSelected ? 'border:3px solid #FC8019; box-shadow:0 0 0 3px rgba(252,128,25,0.4);' : 'border:2px solid white;';

  return L.divIcon({
    className: 'custom-delivery-pin',
    html: `<div style="background-color:${bgColor}; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:12px; font-weight:700; box-shadow:0 2px 6px rgba(0,0,0,0.3); ${ringStyle}">${stopNumber}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });
};

const createVehicleIcon = () =>
  L.divIcon({
    className: 'custom-vehicle-pin',
    html: `<div style="background-color:#FC8019; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; box-shadow:0 0 14px #FC8019; border:2.5px solid white;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

// Component to handle map clicks
const MapClickHandler: React.FC<{ onMapClick?: (lat: number, lon: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

// Component to auto-fit map bounds
const BoundsFitter: React.FC<{ coords: [number, number][]; trigger: number }> = ({ coords, trigger }) => {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords.map((c) => [c[0], c[1]]));
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });
    }
  }, [trigger, coords, map]);
  return null;
};

interface DeliveryMapProps {
  startLocation: LocationItem;
  stops: (OrderedStop | LocationItem)[];
  routeGeometry?: [number, number][]; // [lat, lon]
  vehiclePosition?: [number, number] | null; // [lat, lon]
  selectedStopId?: string | null;
  onSelectStop?: (stopId: string) => void;
  onMapClick?: (lat: number, lon: number) => void;
  heightClass?: string;
  isRealRoadGeometry?: boolean;
}

export const DeliveryMap: React.FC<DeliveryMapProps> = ({
  startLocation,
  stops,
  routeGeometry = [],
  vehiclePosition = null,
  selectedStopId = null,
  onSelectStop,
  onMapClick,
  heightClass = 'h-full min-h-[500px]',
  isRealRoadGeometry = true
}) => {
  const [fitTrigger, setFitTrigger] = React.useState(0);

  const allPoints: [number, number][] = useMemo(() => {
    const pts: [number, number][] = [
      [startLocation.latitude, startLocation.longitude]
    ];
    stops.forEach((s) => pts.push([s.latitude, s.longitude]));
    return pts;
  }, [startLocation, stops]);

  const hubIcon = useMemo(() => createHubIcon(), []);
  const vehicleIcon = useMemo(() => createVehicleIcon(), []);

  return (
    <div className={`relative w-full ${heightClass} rounded-xl overflow-hidden border border-[#E8E8E8] shadow-xs`}>
      <MapContainer
        center={[startLocation.latitude, startLocation.longitude]}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onMapClick={onMapClick} />
        <BoundsFitter coords={allPoints} trigger={fitTrigger} />

        {/* Start / Hub Depot Marker */}
        <Marker
          position={[startLocation.latitude, startLocation.longitude]}
          icon={hubIcon}
        >
          <Popup>
            <div className="text-xs space-y-1">
              <span className="font-bold text-[#FC8019] block text-sm">Central Depot (Warehouse)</span>
              <p className="text-[#282C3F] font-medium">{startLocation.display_name || startLocation.address}</p>
              <div className="text-[10px] text-gray-500 font-mono mt-1 pt-1 border-t border-gray-100">
                Coords: {startLocation.latitude.toFixed(4)}, {startLocation.longitude.toFixed(4)}
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Delivery Destination Markers */}
        {stops.map((stop, index) => {
          const stopNum = 'stop_order' in stop && stop.stop_order ? stop.stop_order : index + 1;
          const isDone = ('status' in stop && stop.status === 'delivered') || ('completed_at' in stop && !!stop.completed_at);
          const isFailed = 'status' in stop && stop.status === 'failed';
          const isSelected = !!selectedStopId && stop.id === selectedStopId;
          const icon = createStopIcon(stopNum, isDone, isSelected, isFailed);

          return (
            <Marker
              key={stop.id || `stop-${index}`}
              position={[stop.latitude, stop.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (onSelectStop && stop.id) {
                    onSelectStop(stop.id);
                  }
                }
              }}
            >
              <Popup>
                <div className="text-xs space-y-1.5 min-w-[190px]">
                  <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-1">
                    <span className="font-bold text-[#282C3F]">Stop #{stopNum}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isDone
                        ? 'bg-emerald-100 text-[#16803D]'
                        : isFailed
                        ? 'bg-red-100 text-[#D64545]'
                        : 'bg-orange-100 text-[#FC8019]'
                    }`}>
                      {isDone ? 'Delivered' : isFailed ? 'Failed' : (stop.priority?.toUpperCase() || 'NORMAL')}
                    </span>
                  </div>
                  <p className="font-bold text-[#282C3F] text-xs">{stop.customer_label || stop.display_name}</p>
                  <p className="text-[#686B78] text-[11px] leading-tight">{stop.address}</p>
                  
                  {'leg_distance_meters' in stop && stop.leg_distance_meters !== undefined && (
                    <div className="text-[11px] text-[#282C3F] bg-gray-50 p-1.5 rounded flex justify-between">
                      <span>Leg: <strong>{(stop.leg_distance_meters / 1000).toFixed(2)} km</strong></span>
                      {'leg_duration_seconds' in stop && stop.leg_duration_seconds !== undefined && (
                        <span>~{Math.round(stop.leg_duration_seconds / 60)} min</span>
                      )}
                    </div>
                  )}

                  {'formatted_arrival' in stop && stop.formatted_arrival && (
                    <div className="text-[11px] font-semibold text-[#16803D] pt-0.5">
                      Est. Arrival: {stop.formatted_arrival}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Road Polyline */}
        {routeGeometry.length > 0 && (
          <Polyline
            positions={routeGeometry}
            pathOptions={{
              color: '#FC8019',
              weight: 4.5,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

        {/* Live Simulation Moving Vehicle Marker */}
        {vehiclePosition && (
          <Marker position={vehiclePosition} icon={vehicleIcon} zIndexOffset={1000}>
            <Popup>
              <div className="text-xs font-semibold text-[#FC8019] flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" />
                <span>Active Delivery Vehicle</span>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Floating Map Controls & Fit Bounds */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => setFitTrigger((prev) => prev + 1)}
          title="Fit all markers in view"
          className="bg-white hover:bg-gray-50 text-[#282C3F] px-2.5 py-1.5 rounded-lg shadow-md border border-[#E8E8E8] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5 text-[#FC8019]" />
          <span>Fit Bounds</span>
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-xs p-2.5 rounded-lg border border-[#E8E8E8] shadow-sm text-xs space-y-1.5 pointer-events-auto">
        <div className="font-bold text-[#282C3F] text-[10px] tracking-wide uppercase border-b border-gray-100 pb-1 flex items-center justify-between gap-3">
          <span>Map Legend</span>
          <span className="text-[9px] text-[#FC8019] font-semibold">{isRealRoadGeometry ? 'OSRM Road Network' : 'Road Approximation'}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#686B78]">
          <span className="w-3.5 h-3.5 rounded-full bg-[#FC8019] inline-block"></span>
          <span>Depot (Warehouse Origin)</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#686B78]">
          <span className="w-3.5 h-3.5 rounded-full bg-[#282C3F] text-white flex items-center justify-center text-[9px] font-bold">#</span>
          <span>Delivery Stop (Click to select)</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#686B78]">
          <span className="w-3.5 h-3.5 rounded-full bg-[#16803D] inline-block"></span>
          <span>Delivered Stop</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#686B78]">
          <span className="w-4 h-1 bg-[#FC8019] inline-block rounded"></span>
          <span>Optimized Road Geometry</span>
        </div>
        {vehiclePosition && (
          <div className="flex items-center gap-2 text-[11px] text-[#FC8019] font-medium pt-0.5 border-t border-gray-100">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FC8019] animate-ping inline-block"></span>
            <span>Delivery Vehicle Position</span>
          </div>
        )}
      </div>
    </div>
  );
};
