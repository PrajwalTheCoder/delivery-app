import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChefHat, 
  Radio, 
  QrCode, 
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import type { FoodOrder } from '../types';
import { DeviceConnectModal } from '../components/common/DeviceConnectModal';

export const KitchenMerchant: React.FC = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [qrOpen, setQrOpen] = useState(false);

  const loadOrders = async () => {
    try {
      const res = await api.getFoodOrders();
      setOrders(res.orders || []);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await api.updateFoodOrderStatus(orderId, status);
      await loadOrders();
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === 'active') {
      return order.status !== 'delivered';
    } else if (filter === 'completed') {
      return order.status === 'delivered';
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-gray-900 font-sans pb-16">
      {/* Merchant Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 font-bold text-xl">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base text-gray-900">Kitchen Display System (KDS)</h1>
                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> LIVE ORDERS
                </span>
              </div>
              <p className="text-xs text-gray-500">Merchant Terminal &bull; Cloud Kitchen Command</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setQrOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <QrCode className="w-4 h-4 text-orange-500" />
              <span>Connect Tablet</span>
            </button>
            <button
              onClick={loadOrders}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
              title="Refresh Orders"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('active')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shadow-2xs ${
              filter === 'active'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            🔥 Active Kitchen Orders ({orders.filter((o) => o.status !== 'delivered').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shadow-2xs ${
              filter === 'completed'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            ✅ Completed ({orders.filter((o) => o.status === 'delivered').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shadow-2xs ${
              filter === 'all'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            All Orders ({orders.length})
          </button>
        </div>

        {/* Orders Card Grid */}
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => {
              const isDelivered = order.status === 'delivered';

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-gray-400 block">
                          ID: #{order.id}
                        </span>
                        <h3 className="font-extrabold text-sm text-gray-900">{order.restaurant.name}</h3>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        order.status === 'placed'
                          ? 'bg-orange-100 text-orange-700'
                          : order.status === 'preparing'
                          ? 'bg-amber-100 text-amber-800'
                          : order.status === 'ready_for_pickup'
                          ? 'bg-blue-100 text-blue-800'
                          : isDelivered
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {order.status_title}
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div className="text-xs text-gray-600 space-y-0.5">
                      <p className="font-bold text-gray-900">{order.customer.name}</p>
                      <p className="truncate text-[11px] text-gray-500">{order.customer.address}</p>
                    </div>

                    {/* Dishes to Prepare */}
                    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Dishes to Cook:
                      </span>
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-800 flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {item.quantity} &times; {item.name}
                          </span>
                          <span className="text-gray-500 font-mono">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Assigned Rider */}
                    <div className="flex items-center gap-2.5 text-xs text-gray-600 pt-1">
                      <img
                        src={order.rider.avatar}
                        alt={order.rider.name}
                        className="w-7 h-7 rounded-full object-cover border border-gray-200"
                      />
                      <span className="truncate">
                        Rider: <strong>{order.rider.name}</strong> ({order.rider.vehicle})
                      </span>
                    </div>
                  </div>

                  {/* Kitchen Action Controls */}
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    {order.status === 'placed' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition-colors"
                      >
                        Accept & Start Cooking (15m)
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'ready_for_pickup')}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
                      >
                        Mark Food Ready for Pickup
                      </button>
                    )}

                    {order.status === 'ready_for_pickup' && (
                      <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs text-center font-bold">
                        Food packed! Awaiting rider collection.
                      </div>
                    )}

                    {order.status === 'out_for_delivery' && (
                      <button
                        onClick={() => navigate(`/track/${order.id}`)}
                        className="w-full py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Track Rider on Road</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isDelivered && (
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center">
                        Delivered successfully &bull; Paid ₹{order.bill.grand_total}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 space-y-3">
            <ChefHat className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-bold text-gray-800">No Orders in this View</h3>
            <p className="text-xs text-gray-500">New customer orders will appear here automatically.</p>
          </div>
        )}
      </main>

      {/* QR Pairing Modal */}
      <DeviceConnectModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
      />
    </div>
  );
};
