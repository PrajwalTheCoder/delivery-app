import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom Map Marker Icons for Swiggy / Zomato experience
const createRestaurantMarkerIcon = (name: string) =>
  L.divIcon({
    className: 'custom-restaurant-pin',
    html: `
      <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
        <div style="background-color:#E23744; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:18px; box-shadow:0 4px 12px rgba(226,55,68,0.4); border:3px solid white;">
          🍳
        </div>
        <div style="background:#282C3F; color:white; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; margin-top:2px; white-space:nowrap; box-shadow:0 2px 4px rgba(0,0,0,0.3); max-width:120px; overflow:hidden; text-overflow:ellipsis;">
          ${name}
        </div>
      </div>
    `,
    iconSize: [38, 54],
    iconAnchor: [19, 27],
    popupAnchor: [0, -28],
  });

const createCustomerMarkerIcon = (address: string) =>
  L.divIcon({
    className: 'custom-customer-pin',
    html: `
      <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
        <div style="background-color:#16803D; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:18px; box-shadow:0 4px 12px rgba(22,128,61,0.4); border:3px solid white; animation:pulse 2s infinite;">
          🏠
        </div>
        <div style="background:#16803D; color:white; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; margin-top:2px; white-space:nowrap; box-shadow:0 2px 4px rgba(0,0,0,0.3); max-width:110px; overflow:hidden; text-overflow:ellipsis;" title="${address}">
          ${address.split(',')[0] || 'You (Delivery)'}
        </div>
      </div>
    `,
    iconSize: [38, 54],
    iconAnchor: [19, 27],
    popupAnchor: [0, -28],
  });

const createRiderMarkerIcon = (heading = 0, isRealDevice = false) =>
  L.divIcon({
    className: 'custom-rider-pin',
    html: `
      <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
        <div style="background-color:#FC8019; width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:22px; box-shadow:0 0 16px rgba(252,128,25,0.7); border:3px solid white; transform: rotate(${heading}deg); transition: transform 0.3s ease;">
          🛵
        </div>
        <div style="background:${isRealDevice ? '#059669' : '#FC8019'}; color:white; font-size:9px; font-weight:800; padding:2px 6px; border-radius:999px; margin-top:2px; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.3); display:flex; align-items:center; gap:3px;">
          ${isRealDevice ? '🟢 PHONE GPS' : '⚡ LIVE RIDER'}
        </div>
      </div>
    `,
    iconSize: [44, 62],
    iconAnchor: [22, 31],
    popupAnchor: [0, -32],
  });

// Auto-fit bounds component
const MapBoundsFitter: React.FC<{ coords: [number, number][]; trigger: any }> = ({ coords, trigger }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      const bounds = L.latLngBounds(coords.map((c) => [c[0], c[1]]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [trigger, coords, map]);
  return null;
};

interface FoodDeliveryMapProps {
  restaurant: {
    name: string;
    latitude: number;
    longitude: number;
    address?: string;
  };
  customer: {
    name?: string;
    latitude: number;
    longitude: number;
    address?: string;
  };
  riderPosition?: {
    latitude: number;
    longitude: number;
    heading?: number;
    is_real_device_connected?: boolean;
  } | null;
  roadGeometry?: [number, number][]; // [lat, lon]
  heightClass?: string;
  interactive?: boolean;
  onMapClick?: (lat: number, lon: number) => void;
}

export const FoodDeliveryMap: React.FC<FoodDeliveryMapProps> = ({
  restaurant,
  customer,
  riderPosition = null,
  roadGeometry = [],
  heightClass = 'h-[460px]'
}) => {
  const restIcon = useMemo(() => createRestaurantMarkerIcon(restaurant.name), [restaurant.name]);
  const custIcon = useMemo(() => createCustomerMarkerIcon(customer.address || 'Delivery Address'), [customer.address]);
  const riderIcon = useMemo(
    () => createRiderMarkerIcon(riderPosition?.heading || 0, riderPosition?.is_real_device_connected || false),
    [riderPosition?.heading, riderPosition?.is_real_device_connected]
  );

  const allKeyPoints: [number, number][] = useMemo(() => {
    const pts: [number, number][] = [
      [restaurant.latitude, restaurant.longitude],
      [customer.latitude, customer.longitude]
    ];
    if (riderPosition) {
      pts.push([riderPosition.latitude, riderPosition.longitude]);
    }
    return pts;
  }, [restaurant, customer, riderPosition]);

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-gray-200 shadow-md`}>
      <MapContainer
        center={[customer.latitude, customer.longitude]}
        zoom={14}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsFitter coords={allKeyPoints} trigger={`${restaurant.latitude}-${customer.latitude}-${riderPosition?.latitude}`} />

        {/* Restaurant Pin */}
        <Marker position={[restaurant.latitude, restaurant.longitude]} icon={restIcon}>
          <Popup>
            <div className="text-xs space-y-1">
              <span className="font-bold text-[#E23744] block text-sm">🍳 {restaurant.name}</span>
              <p className="text-gray-700 font-medium">{restaurant.address || 'Pickup Restaurant'}</p>
              <div className="text-[10px] text-gray-500 font-mono">
                Coords: {restaurant.latitude.toFixed(4)}, {restaurant.longitude.toFixed(4)}
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Customer Pin */}
        <Marker position={[customer.latitude, customer.longitude]} icon={custIcon}>
          <Popup>
            <div className="text-xs space-y-1">
              <span className="font-bold text-[#16803D] block text-sm">🏠 Delivery Destination</span>
              <p className="text-gray-700 font-medium">{customer.address || 'Customer Location'}</p>
              <div className="text-[10px] text-gray-500 font-mono">
                Coords: {customer.latitude.toFixed(4)}, {customer.longitude.toFixed(4)}
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Live Delivery Rider Pin */}
        {riderPosition && (
          <Marker position={[riderPosition.latitude, riderPosition.longitude]} icon={riderIcon}>
            <Popup>
              <div className="text-xs space-y-1">
                <span className="font-bold text-[#FC8019] block text-sm">🛵 Delivery Partner</span>
                <p className="text-gray-700 font-medium">
                  {riderPosition.is_real_device_connected ? 'Transmitting from Physical Smartphone GPS' : 'Live Road Navigation'}
                </p>
                <div className="text-[10px] text-gray-500 font-mono">
                  Coords: {riderPosition.latitude.toFixed(4)}, {riderPosition.longitude.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Real OSRM Road Polyline */}
        {roadGeometry.length > 1 && (
          <>
            {/* Outline Glow */}
            <Polyline
              positions={roadGeometry}
              pathOptions={{
                color: '#FC8019',
                weight: 6,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            {/* Inner accent line */}
            <Polyline
              positions={roadGeometry}
              pathOptions={{
                color: '#FFFFFF',
                weight: 2,
                opacity: 0.9,
                dashArray: '6, 8',
                lineCap: 'round'
              }}
            />
          </>
        )}
      </MapContainer>

      {/* Floating Info Overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-gray-200/80 flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-gray-800">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          OSRM Road Network
        </div>
        <span className="text-gray-300">|</span>
        <div className="text-gray-600 font-medium">
          {roadGeometry.length > 0 ? `${roadGeometry.length} Road Waypoints` : 'Calculating route...'}
        </div>
      </div>
    </div>
  );
};
