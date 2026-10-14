import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Navigation, 
  Phone, 
  CheckCircle2, 
  Radio, 
  Power, 
  AlertCircle,
  QrCode
} from 'lucide-react';
import { api } from '../services/api';
import type { FoodOrder } from '../types';
import { DeviceConnectModal } from '../components/common/DeviceConnectModal';

export const DriverCompanion: React.FC = () => {
  const [searchParams] = useSearchParams();

  const [activeOrder, setActiveOrder] = useState<FoodOrder | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Real Device GPS streaming state
  const [gpsActive, setGpsActive] = useState(false);
  const [currentGps, setCurrentGps] = useState<{
    lat: number;
    lon: number;
    heading: number;
    speed: number;
    accuracy: number;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Simulation fallback state
  const [simulating, setSimulating] = useState(false);
  const simIndexRef = useRef(0);

  // OTP Verification state
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [deliverySuccess, setDeliverySuccess] = useState(false);

  // QR Modal
  const [qrOpen, setQrOpen] = useState(false);

  // Fetch orders
  const loadOrders = async () => {
    try {
      const res = await api.getFoodOrders();
      const requestedId = searchParams.get('orderId');
      if (requestedId) {
        const found = res.orders?.find((o) => o.id === requestedId);
        if (found) {
          setActiveOrder(found);
          return;
        }
      }
      if (res.orders && res.orders.length > 0) {
        setActiveOrder(res.orders[0]);
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 6000);
    return () => clearInterval(interval);
  }, [searchParams]);

  // Start Real Phone GPS Streaming
  const toggleGpsSharing = () => {
    if (gpsActive) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setGpsActive(false);
      setGpsError(null);
    } else {
      if (!('geolocation' in navigator)) {
        setGpsError('Geolocation is not supported by your browser/device.');
        return;
      }

      setGpsError(null);
      setGpsActive(true);
      setSimulating(false);

      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, heading, speed, accuracy } = pos.coords;
          setCurrentGps({
            lat: latitude,
            lon: longitude,
            heading: heading || 0,
            speed: speed ? Math.round(speed * 3.6) : 0,
            accuracy: Math.round(accuracy)
          });

          // Send real-time GPS coordinates to backend
          if (activeOrder) {
            api.updateDriverLocation(activeOrder.id, {
              latitude,
              longitude,
              heading: heading || 0,
              speed: speed ? speed * 3.6 : 0,
              is_real_device: true
            }).catch(() => {});
          }
        },
        (err) => {
          setGpsError(`GPS Error: ${err.message}. Please enable location permissions.`);
          setGpsActive(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 10000
        }
      );
      watchIdRef.current = id;
    }
  };

  // Cleanup GPS watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Road Simulation Loop
  useEffect(() => {
    if (!simulating || !activeOrder || !activeOrder.road_geometry || activeOrder.road_geometry.length === 0) return;

    const interval = setInterval(() => {
      const next = (simIndexRef.current + 1) % activeOrder.road_geometry.length;
      simIndexRef.current = next;
      const coords = activeOrder.road_geometry[next];
      if (coords) {
        api.updateDriverLocation(activeOrder.id, {
          latitude: coords[0],
          longitude: coords[1],
          heading: 45,
          speed: 28,
          is_real_device: false
        }).catch(() => {});
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [simulating, activeOrder]);

  // Open Native Google Maps App for Turn-by-Turn directions on phone
  const openNativeGoogleMaps = () => {
    if (!activeOrder) return;
    const dest = activeOrder.status === 'out_for_delivery'
      ? activeOrder.customer
      : activeOrder.restaurant;

    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest.latitude},${dest.longitude}&travelmode=driving`;
    window.open(url, '_blank');
  };

  // Status updates
  const handleUpdateStatus = async (status: string) => {
    if (!activeOrder) return;
    try {
      await api.updateFoodOrderStatus(activeOrder.id, status);
      await loadOrders();
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  // OTP Verification
  const handleVerifyOtp = async () => {
    if (!activeOrder || !otpInput.trim()) return;
    setOtpError(null);
    try {
      const res = await api.verifyFoodOrderOtp(activeOrder.id, otpInput.trim());
      if (res.success) {
        setDeliverySuccess(true);
        loadOrders();
      } else {
        setOtpError(res.error || 'Invalid OTP');
      }
    } catch (err: any) {
      setOtpError(err.message || 'OTP verification failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-between max-w-md mx-auto relative select-none shadow-2xl border-x border-gray-800 font-sans pb-8">
      {/* Driver Header */}
      <div className="bg-[#1C1C1E] border-b border-gray-800 p-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold text-lg">
              🛵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Ramesh Kumar</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-bold">
                  4.89 ★
                </span>
              </div>
              <p className="text-[11px] text-gray-400">Hero Splendor (MH-46-AZ-8921)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setQrOpen(true)}
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              title="Pair QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                isOnline ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-800 text-gray-400'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </button>
          </div>
        </div>

        {/* Shift Earnings Stats */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-800 text-center">
          <div className="bg-gray-900/80 p-2 rounded-xl border border-gray-800">
            <span className="text-[10px] text-gray-400 block">Today's Earnings</span>
            <span className="text-sm font-extrabold text-orange-400">₹640</span>
          </div>
          <div className="bg-gray-900/80 p-2 rounded-xl border border-gray-800">
            <span className="text-[10px] text-gray-400 block">Completed</span>
            <span className="text-sm font-extrabold text-emerald-400">9 Trips</span>
          </div>
          <div className="bg-gray-900/80 p-2 rounded-xl border border-gray-800">
            <span className="text-[10px] text-gray-400 block">Acceptance</span>
            <span className="text-sm font-extrabold text-blue-400">98%</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 space-y-4 flex-1">
        {/* Device GPS Transmission Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 border border-gray-700 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${gpsActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`}></span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
                {gpsActive ? 'Live Phone GPS Broadcasting' : 'Device GPS Inactive'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-400">HTML5 Geolocation</span>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            {gpsActive
              ? 'Your physical phone coordinates are streaming live to the customer order tracking map!'
              : 'Tap below to stream your real smartphone GPS location directly to the live delivery session.'}
          </p>

          {currentGps && gpsActive && (
            <div className="bg-black/50 p-3 rounded-xl border border-gray-800 font-mono text-[11px] grid grid-cols-2 gap-2 text-gray-300">
              <div>Lat: <span className="text-emerald-400 font-bold">{currentGps.lat.toFixed(5)}</span></div>
              <div>Lon: <span className="text-emerald-400 font-bold">{currentGps.lon.toFixed(5)}</span></div>
              <div>Speed: <span className="text-orange-400 font-bold">{currentGps.speed} km/h</span></div>
              <div>Accuracy: <span className="text-blue-400 font-bold">±{currentGps.accuracy}m</span></div>
            </div>
          )}

          {gpsError && (
            <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-[11px] text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {gpsError}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={toggleGpsSharing}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                gpsActive
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
              }`}
            >
              <Radio className={`w-4 h-4 ${gpsActive ? 'animate-spin' : ''}`} />
              {gpsActive ? 'Stop Phone GPS Sharing' : '📡 Share Real Phone GPS'}
            </button>

            <button
              onClick={() => {
                setSimulating(!simulating);
                if (!simulating) setGpsActive(false);
              }}
              className={`py-3 px-3.5 rounded-xl font-semibold text-xs border transition-colors ${
                simulating
                  ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
              }`}
              title="Simulate road drive without moving"
            >
              {simulating ? 'Sim: ON' : 'Simulate'}
            </button>
          </div>
        </div>

        {/* Active Order Dispatch Flash Card */}
        {activeOrder ? (
          <div className="bg-[#1C1C1E] rounded-3xl p-5 border border-gray-800 shadow-xl space-y-4">
            {/* Order Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div>
                <span className="text-[10px] font-bold text-orange-400 tracking-wider uppercase">Active Delivery</span>
                <h3 className="text-base font-extrabold text-white">Order #{activeOrder.id}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 block">Earning</span>
                <span className="text-base font-black text-emerald-400">₹{activeOrder.bill.delivery_fee + 35}</span>
              </div>
            </div>

            {/* Pickup & Dropoff Routing Flow */}
            <div className="space-y-3 relative pl-6 border-l-2 border-dashed border-gray-700 ml-3">
              {/* Pickup Point */}
              <div className="relative">
                <span className="absolute -left-[31px] top-0.5 w-5 h-5 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-[9px] text-red-400 font-bold">
                  🍳
                </span>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase">Pickup From</span>
                  <p className="text-xs font-bold text-white leading-tight">{activeOrder.restaurant.name}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{activeOrder.restaurant.address}</p>
                </div>
              </div>

              {/* Dropoff Point */}
              <div className="relative pt-2">
                <span className="absolute -left-[31px] top-2.5 w-5 h-5 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-[9px] text-emerald-400 font-bold">
                  🏠
                </span>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase">Dropoff To</span>
                  <p className="text-xs font-bold text-white leading-tight">{activeOrder.customer.name}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{activeOrder.customer.address}</p>
                </div>
              </div>
            </div>

            {/* Turn-by-Turn GPS Navigation Button (Open Native Google Maps) */}
            <button
              onClick={openNativeGoogleMaps}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-transform active:scale-98"
            >
              <Navigation className="w-4 h-4 fill-white" />
              Open Turn-by-Turn in Google Maps
            </button>

            {/* Driver Milestone Steps */}
            <div className="pt-2 space-y-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Delivery Milestones
              </span>

              {activeOrder.status === 'placed' && (
                <button
                  onClick={() => handleUpdateStatus('preparing')}
                  className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors"
                >
                  Accept Order & Head to Restaurant
                </button>
              )}

              {activeOrder.status === 'preparing' && (
                <button
                  onClick={() => handleUpdateStatus('ready_for_pickup')}
                  className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs transition-colors"
                >
                  Arrived at Restaurant
                </button>
              )}

              {activeOrder.status === 'ready_for_pickup' && (
                <button
                  onClick={() => handleUpdateStatus('out_for_delivery')}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-colors"
                >
                  Confirm Food Picked Up & Start Driving
                </button>
              )}

              {activeOrder.status === 'out_for_delivery' && (
                <div className="space-y-3 pt-1">
                  <div className="p-3 rounded-xl bg-gray-900 border border-gray-700">
                    <label className="text-[11px] font-bold text-gray-300 block mb-1.5">
                      Enter Customer 4-Digit Delivery OTP:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="e.g. 4829"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        className="flex-1 bg-black border border-gray-700 rounded-xl px-3 py-2 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-orange-500"
                      />
                      <button
                        onClick={handleVerifyOtp}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                      >
                        Verify & Complete
                      </button>
                    </div>
                    {otpError && (
                      <p className="text-[11px] text-red-400 mt-1 font-medium">{otpError}</p>
                    )}
                  </div>
                </div>
              )}

              {activeOrder.status === 'delivered' && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-700/80 text-center space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <span className="font-extrabold text-sm text-emerald-300 block">Order Successfully Delivered!</span>
                  <p className="text-xs text-gray-300">Earnings of ₹{activeOrder.bill.delivery_fee + 35} credited to your wallet.</p>
                </div>
              )}
            </div>

            {/* Customer Contact */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-800 text-xs">
              <span className="text-gray-400">Customer Helpline:</span>
              <a
                href={`tel:${activeOrder.customer.phone}`}
                className="flex items-center gap-1.5 text-orange-400 font-bold hover:underline"
              >
                <Phone className="w-3.5 h-3.5" />
                {activeOrder.customer.phone}
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-[#1C1C1E] rounded-3xl p-8 border border-gray-800 text-center space-y-3">
            <span className="text-3xl">🛵</span>
            <h3 className="font-bold text-base text-white">Waiting for New Orders</h3>
            <p className="text-xs text-gray-400">
              Stay online and keep GPS active. You will be matched with orders in your vicinity.
            </p>
          </div>
        )}
      </div>

      {/* Delivery Success Celebration Modal */}
      {deliverySuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-[#1C1C1E] rounded-3xl p-6 max-w-xs w-full text-center border border-gray-700 space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-black text-white">Delivery Completed!</h3>
            <p className="text-xs text-gray-300">
              Great job! OTP verified and delivery finalized. ₹65 has been added to your daily payout.
            </p>
            <button
              onClick={() => {
                setDeliverySuccess(false);
                setOtpInput('');
              }}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
            >
              Continue Driving
            </button>
          </div>
        </div>
      )}

      {/* QR Pairing Modal */}
      <DeviceConnectModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        activeOrderId={activeOrder?.id}
      />
    </div>
  );
};
