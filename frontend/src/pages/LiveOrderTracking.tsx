import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Radio, 
  Smartphone, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { api } from '../services/api';
import type { FoodOrder } from '../types';
import { FoodDeliveryMap } from '../components/map/FoodDeliveryMap';
import { DeviceConnectModal } from '../components/common/DeviceConnectModal';

export const LiveOrderTracking: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<FoodOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);

  // Poll tracking details every 2.5 seconds for fluid live GPS updates
  const fetchTracking = async () => {
    if (!orderId) return;
    try {
      const res = await api.trackFoodOrder(orderId);
      setOrder(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Unable to load order tracking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 2500);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-gray-700">Connecting to Live Road Telemetry...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-gray-100 space-y-4">
          <span className="text-4xl">🔍</span>
          <h3 className="text-lg font-bold text-gray-900">Order Not Found</h3>
          <p className="text-xs text-gray-500">{error || 'This order does not exist or has expired.'}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => navigate('/swiggy')}
              className="px-4 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-xs"
            >
              Browse Restaurants
            </button>
            <button
              onClick={fetchTracking}
              className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isDelivered = order.status === 'delivered';

  return (
    <div className="min-h-screen bg-[#F4F4F6] text-gray-900 font-sans pb-12">
      {/* Top App Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/swiggy')}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-gray-900">Order #{order.id}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isDelivered ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-700'
                }`}>
                  {order.status_title}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate max-w-xs">{order.restaurant.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setQrOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#FC8019] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Connect Phone</span>
            </button>
            <Link
              to={`/driver?orderId=${order.id}`}
              className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
            >
              Driver View
            </Link>
          </div>
        </div>
      </header>

      {/* Main Tracking Body */}
      <div className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
        {/* Real Device GPS Status Alert */}
        {order.driver_location?.is_real_device_connected ? (
          <div className="bg-emerald-500 text-white px-4 py-2.5 rounded-2xl shadow-md flex items-center justify-between text-xs font-semibold animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
              <span>Connected to Delivery Partner's Physical Smartphone GPS in real time!</span>
            </div>
            <span className="font-mono text-[11px] bg-emerald-600/60 px-2 py-0.5 rounded-md">
              ±{Math.round(order.driver_location.speed_kmh || 0)} km/h
            </span>
          </div>
        ) : (
          <div className="bg-orange-50 border border-orange-200 text-[#282C3F] px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-orange-500 animate-pulse" />
              <span>Using OSRM Road Network Simulator. Want to use your real phone GPS?</span>
            </div>
            <button
              onClick={() => setQrOpen(true)}
              className="text-xs font-bold text-[#FC8019] hover:underline"
            >
              Scan QR to Connect &rarr;
            </button>
          </div>
        )}

        {/* Live Interactive Map with Real Road Geometry */}
        <FoodDeliveryMap
          restaurant={order.restaurant}
          customer={order.customer}
          riderPosition={order.driver_location}
          roadGeometry={order.road_geometry}
          heightClass="h-[440px]"
        />

        {/* ETA & Status Banner (Swiggy / Zomato style) */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {isDelivered ? 'Delivered' : 'Estimated Delivery'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-0.5">
                {isDelivered
                  ? 'Delivered with Success!'
                  : `Arriving in ${order.estimated_delivery_mins || 15} mins`}
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                {order.status_message}
              </p>
            </div>

            {/* OTP Box */}
            <div className="bg-orange-50/80 border-2 border-orange-200 rounded-2xl p-3.5 text-center sm:min-w-[170px] shadow-2xs">
              <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">
                DELIVERY OTP
              </span>
              <span className="text-3xl font-black text-[#FC8019] tracking-widest font-mono block my-0.5">
                {order.delivery_otp}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">Share only at doorstep</span>
            </div>
          </div>

          {/* Progress Timeline Stepper */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            {order.timeline.map((step, idx) => {
              const isPastOrCurrent = step.completed || order.status === step.status;
              return (
                <div key={idx} className="space-y-1.5 text-center">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isPastOrCurrent ? 'bg-[#FC8019]' : 'bg-gray-200'
                    }`}
                  />
                  <span
                    className={`text-[11px] font-bold block truncate ${
                      isPastOrCurrent ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </span>
                  {step.timestamp && (
                    <span className="text-[10px] text-gray-400 block font-mono">
                      {step.timestamp}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Delivery Partner Profile Card */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/70 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              <img
                src={order.rider.avatar}
                alt={order.rider.name}
                className="w-13 h-13 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-gray-900">{order.rider.name}</h4>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    ★ {order.rider.rating}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  {order.rider.vehicle} &bull; {order.rider.trips} deliveries
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold mt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Vaccinated & Sanitized &bull; Temperature Normal
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <a
                href={`tel:${order.rider.phone}`}
                className="py-2.5 px-4 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors flex-1 sm:flex-initial"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                Call Partner
              </a>
              <button
                onClick={() => alert(`Messaging ${order.rider.name}: "Hi, please ring bell once you reach."`)}
                className="py-2.5 px-3.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                title="Message Partner"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#FC8019]" />
              </button>
            </div>
          </div>

          {/* Delivery Address Details */}
          <div className="flex items-start gap-3 pt-2 text-xs text-gray-600 border-t border-gray-100">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-800 block">Delivering To:</span>
              <p className="text-gray-600">{order.customer.address}</p>
            </div>
          </div>
        </div>

        {/* Collapsible Order Summary */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <button
            onClick={() => setShowOrderSummary(!showOrderSummary)}
            className="w-full flex items-center justify-between text-xs font-bold text-gray-800"
          >
            <span>Order Summary ({order.items.length} items &bull; ₹{order.bill.grand_total})</span>
            {showOrderSummary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showOrderSummary && (
            <div className="pt-4 space-y-3 border-t border-gray-100 mt-3 text-xs">
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-gray-700">
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.is_veg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {item.name} &times; {item.quantity}
                    </span>
                    <span className="font-semibold text-gray-900">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-1 text-gray-600">
                <div className="flex justify-between">
                  <span>Item Total</span>
                  <span>₹{order.bill.item_total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>₹{order.bill.delivery_fee}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span>₹{order.bill.platform_fee}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes & Charges</span>
                  <span>₹{order.bill.taxes}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-gray-900 pt-2 border-t border-gray-200">
                  <span>Grand Total</span>
                  <span className="text-[#FC8019]">₹{order.bill.grand_total}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Pairing Modal */}
      <DeviceConnectModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        activeOrderId={order.id}
      />
    </div>
  );
};
