import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Navigation, 
  ShoppingBag, 
  Star, 
  Clock, 
  Plus, 
  Minus, 
  X, 
  Smartphone, 
  Sparkles,
  Compass
} from 'lucide-react';
import { api } from '../services/api';
import type { Restaurant, MenuItem } from '../types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { DeviceConnectModal } from '../components/common/DeviceConnectModal';

const createRestaurantPinIcon = (name: string) =>
  L.divIcon({
    className: 'custom-rest-pin',
    html: `
      <div style="background-color:#E23744; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:16px; box-shadow:0 3px 8px rgba(226,55,68,0.5); border:2.5px solid white;" title="${name}">
        🍳
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });

const createCustomerPinIcon = () =>
  L.divIcon({
    className: 'custom-cust-pin',
    html: `
      <div style="background-color:#16803D; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:18px; box-shadow:0 3px 8px rgba(22,128,61,0.5); border:2.5px solid white; animation:pulse 2s infinite;">
        📍
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });

export const SwiggyFoodApp: React.FC = () => {
  const navigate = useNavigate();

  // Location State
  const [customerLocation, setCustomerLocation] = useState({
    address: 'Utsav Chowk, Sector 7, Kharghar, Navi Mumbai 410210',
    latitude: 19.0345,
    longitude: 73.0678,
    isDeviceGps: false
  });
  const [locatingGps, setLocatingGps] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);

  // Map Toggle
  const [showMap, setShowMap] = useState(false);

  // Active Menu Modal
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // Cart State
  const [cartItems, setCartItems] = useState<{ item: MenuItem; quantity: number; restaurant: Restaurant }[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [ordering, setOrdering] = useState(false);

  // QR Modal
  const [qrOpen, setQrOpen] = useState(false);

  // Load restaurants
  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const res = await api.getFoodRestaurants({
        lat: customerLocation.latitude,
        lon: customerLocation.longitude,
        q: searchQuery,
        category: selectedCategory
      });
      setRestaurants(res.restaurants || []);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [customerLocation.latitude, customerLocation.longitude, selectedCategory]);

  // Handle Search submit / debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRestaurants();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Detect Device GPS Location
  const handleDetectDeviceGps = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let detectedAddress = `Current GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;

        try {
          const rev = await api.reverseGeocode(latitude, longitude);
          if (rev?.result?.display_name) {
            detectedAddress = rev.result.display_name;
          }
        } catch {
          // Fallback
        }

        setCustomerLocation({
          address: detectedAddress,
          latitude,
          longitude,
          isDeviceGps: true
        });
        setLocatingGps(false);
      },
      (err) => {
        alert(`Location detection failed: ${err.message}`);
        setLocatingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Cart Management
  const addToCart = (item: MenuItem, restaurant: Restaurant) => {
    setCartItems((prev) => {
      // If adding from a different restaurant, reset cart
      if (prev.length > 0 && prev[0].restaurant.id !== restaurant.id) {
        if (!confirm(`Your cart contains items from ${prev[0].restaurant.name}. Reset cart to order from ${restaurant.name}?`)) {
          return prev;
        }
        return [{ item, quantity: 1, restaurant }];
      }

      const existingIndex = prev.findIndex((ci) => ci.item.id === item.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prev, { item, quantity: 1, restaurant }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.item.id === itemId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter((ci) => ci.item.id !== itemId);
      }
      return prev.map((ci) => ci.item.id === itemId ? { ...ci, quantity: ci.quantity - 1 } : ci);
    });
  };

  const getCartQuantity = (itemId: string) => {
    return cartItems.find((ci) => ci.item.id === itemId)?.quantity || 0;
  };

  const totalCartCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const cartSubtotal = cartItems.reduce((acc, curr) => acc + curr.item.price * curr.quantity, 0);
  const activeRestaurant = cartItems.length > 0 ? cartItems[0].restaurant : null;
  const deliveryFee = activeRestaurant?.delivery_fee || 25;
  const grandTotal = cartSubtotal + deliveryFee + 6 + Math.round(cartSubtotal * 0.05);

  // Place Order
  const handlePlaceOrder = async () => {
    if (cartItems.length === 0 || !activeRestaurant) return;
    setOrdering(true);

    try {
      const orderPayload = {
        restaurant_id: activeRestaurant.id,
        customer_name: 'Aditya Gupta',
        customer_phone: '+91 98205 11920',
        customer_address: customerLocation.address,
        customer_latitude: customerLocation.latitude,
        customer_longitude: customerLocation.longitude,
        items: cartItems.map((ci) => ({
          id: ci.item.id,
          name: ci.item.name,
          price: ci.item.price,
          quantity: ci.quantity,
          is_veg: ci.item.is_veg
        }))
      };

      const res = await api.createFoodOrder(orderPayload);
      if (res.order) {
        setCartItems([]);
        setCartOpen(false);
        navigate(`/track/${res.order.id}`);
      }
    } catch (err: any) {
      alert(`Order placement failed: ${err.message}`);
    } finally {
      setOrdering(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Cuisines', emoji: '✨' },
    { id: 'biryani', label: 'Biryani', emoji: '🍚' },
    { id: 'pizza', label: 'Pizzas', emoji: '🍕' },
    { id: 'burgers', label: 'Burgers', emoji: '🍔' },
    { id: 'momos', label: 'Momos', emoji: '🥟' },
    { id: 'snacks', label: 'Chai & Snacks', emoji: '☕' },
    { id: 'veg', label: 'Pure Veg', emoji: '🥦' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#282C3F] font-sans pb-24">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand & Location Detection */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FC8019] to-[#E23744] flex items-center justify-center text-white font-black text-xl shadow-md">
                🛵
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg text-gray-900 tracking-tight">Swiggy & Zomato</span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-orange-100 text-[#FC8019]">
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">Real-Time Food Delivery Engine</p>
              </div>
            </div>

            {/* Location Selector */}
            <div className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-1.5 transition-colors">
              <MapPin className="w-4 h-4 text-[#FC8019] shrink-0" />
              <div className="text-left max-w-xs truncate">
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Deliver To</span>
                <span className="text-xs font-bold text-gray-800 truncate block">
                  {customerLocation.address.split(',')[0]}
                </span>
              </div>
              <button
                onClick={handleDetectDeviceGps}
                disabled={locatingGps}
                className="ml-1 text-[11px] font-bold text-[#FC8019] hover:underline flex items-center gap-1 shrink-0"
                title="Detect device GPS"
              >
                <Compass className={`w-3.5 h-3.5 ${locatingGps ? 'animate-spin' : ''}`} />
                {locatingGps ? 'Locating...' : 'Use GPS'}
              </button>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQrOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Smartphone className="w-4 h-4 text-orange-400" />
              <span>Connect Phone</span>
            </button>

            <button
              onClick={() => setShowMap(!showMap)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                showMap
                  ? 'bg-orange-50 border-orange-200 text-[#FC8019]'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative px-4 py-2 rounded-xl bg-[#FC8019] hover:bg-[#e07214] text-white text-xs font-bold flex items-center gap-2 shadow-md transition-transform active:scale-98"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              {totalCartCount > 0 && (
                <span className="bg-white text-[#FC8019] font-black text-[11px] px-1.5 py-0.2 rounded-full">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar & Categories */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 pt-1 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search for restaurants, biryani, pizza, burgers, or dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100/80 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-[#FC8019] rounded-2xl pl-11 pr-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`py-1.5 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-2xs ${
                  selectedCategory === cat.id
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        {/* Real Map View (Collapsible) */}
        {showMap && (
          <div className="rounded-3xl overflow-hidden border border-gray-200 shadow-md h-[340px] relative">
            <MapContainer
              center={[customerLocation.latitude, customerLocation.longitude]}
              zoom={13}
              scrollWheelZoom={false}
              className="w-full h-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Customer Pin */}
              <Marker
                position={[customerLocation.latitude, customerLocation.longitude]}
                icon={createCustomerPinIcon()}
              >
                <Popup>
                  <div className="text-xs">
                    <strong className="text-[#16803D] block">Your Location</strong>
                    <span>{customerLocation.address}</span>
                  </div>
                </Popup>
              </Marker>

              {/* Restaurant Pins */}
              {restaurants.map((rest) => (
                <Marker
                  key={rest.id}
                  position={[rest.latitude, rest.longitude]}
                  icon={createRestaurantPinIcon(rest.name)}
                  eventHandlers={{
                    click: () => setSelectedRestaurant(rest),
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-1">
                      <strong className="text-[#E23744] block font-bold">{rest.name}</strong>
                      <p className="text-gray-600">{rest.cuisines.join(', ')}</p>
                      <span className="text-[10px] text-emerald-700 font-bold block">
                        ★ {rest.rating} &bull; {rest.estimated_delivery_mins}m &bull; {rest.distance_km}km
                      </span>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-md border border-gray-200 text-xs font-bold text-gray-800">
              📍 Showing {restaurants.length} nearby food hubs around your pin
            </div>
          </div>
        )}

        {/* Section Title */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Top Restaurants & Cloud Kitchens
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Real road-calculated ETAs from your location ({customerLocation.address.split(',')[0]})
            </p>
          </div>
          <span className="text-xs font-bold text-gray-500 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
            {restaurants.length} Places Found
          </span>
        </div>

        {/* Restaurant Cards Grid */}
        {loading ? (
          <div className="col-span-full py-16 text-center">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-bold text-gray-500">Searching real restaurants & calculating road ETAs...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((rest) => (
              <div
                key={rest.id}
                onClick={() => setSelectedRestaurant(rest)}
                className="bg-white rounded-3xl overflow-hidden border border-gray-200/90 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col group"
              >
              {/* Image Banner */}
              <div className="relative h-48 overflow-hidden bg-gray-100">
                <img
                  src={rest.image}
                  alt={rest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                {/* Offer Ribbon */}
                {rest.discount && (
                  <div className="absolute bottom-3 left-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-[11px] px-3 py-1 rounded-lg shadow-md uppercase tracking-wider">
                    {rest.discount}
                  </div>
                )}

                {/* Badge Tag */}
                {rest.badge && (
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-gray-900 font-bold text-[10px] px-2.5 py-0.5 rounded-md shadow-sm">
                    {rest.badge}
                  </div>
                )}

                {/* Distance & ETA Floating Pill */}
                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-md text-gray-900 text-xs font-extrabold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#FC8019]" />
                  <span>{rest.estimated_delivery_mins || 20}m</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500 font-medium">{rest.distance_km}km</span>
                </div>
              </div>

              {/* Details Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-extrabold text-base text-gray-900 group-hover:text-[#FC8019] transition-colors truncate">
                      {rest.name}
                    </h3>
                    <div className="flex items-center gap-1 bg-emerald-600 text-white font-extrabold text-xs px-2 py-0.5 rounded-lg shadow-2xs shrink-0">
                      <span>{rest.rating}</span>
                      <Star className="w-3 h-3 fill-white" />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {rest.cuisines.join(', ')}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    {rest.locality}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">₹{rest.cost_for_two} for two</span>
                  <span className="text-[#FC8019] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Explore Menu &rarr;
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </main>

      {/* Restaurant Menu Modal */}
      {selectedRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white relative shrink-0">
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4">
                <img
                  src={selectedRestaurant.image}
                  alt={selectedRestaurant.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-lg shrink-0"
                />
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white">{selectedRestaurant.name}</h3>
                  <p className="text-xs text-gray-300">{selectedRestaurant.cuisines.join(', ')}</p>
                  <p className="text-[11px] text-gray-400">{selectedRestaurant.address}</p>
                  <div className="flex items-center gap-3 pt-1 text-xs">
                    <span className="bg-emerald-500 text-white font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                      ★ {selectedRestaurant.rating}
                    </span>
                    <span className="text-gray-300 font-medium">
                      ⏱️ {selectedRestaurant.estimated_delivery_mins} mins delivery
                    </span>
                    <span className="text-gray-300 font-medium">
                      📍 {selectedRestaurant.distance_km} km away
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items List */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h4 className="font-extrabold text-sm text-gray-900 uppercase tracking-wider">
                  Menu ({selectedRestaurant.menu.length} Dishes)
                </h4>
                <span className="text-xs text-gray-400">All prices in INR (₹)</span>
              </div>

              <div className="space-y-4">
                {selectedRestaurant.menu.map((dish) => {
                  const qty = getCartQuantity(dish.id);
                  return (
                    <div
                      key={dish.id}
                      className="p-4 rounded-2xl border border-gray-200/80 hover:border-orange-200 bg-white shadow-2xs hover:shadow-md transition-all flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-3.5 h-3.5 rounded-xs border-2 flex items-center justify-center p-0.5 ${
                              dish.is_veg
                                ? 'border-emerald-600'
                                : 'border-red-600'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                dish.is_veg ? 'bg-emerald-600' : 'bg-red-600'
                              }`}
                            />
                          </span>
                          {dish.bestseller && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.2 rounded-full uppercase tracking-wider">
                              ★ Bestseller
                            </span>
                          )}
                        </div>

                        <h5 className="font-extrabold text-sm text-gray-900">{dish.name}</h5>
                        <p className="text-xs font-bold text-gray-800">₹{dish.price}</p>
                        <p className="text-xs text-gray-500 leading-relaxed max-w-md line-clamp-2">
                          {dish.description}
                        </p>
                      </div>

                      <div className="relative shrink-0 flex flex-col items-center">
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-24 h-24 rounded-2xl object-cover border border-gray-100 shadow-sm"
                        />
                        <div className="mt-2">
                          {qty > 0 ? (
                            <div className="flex items-center gap-2 bg-orange-50 border border-[#FC8019] rounded-xl px-2 py-1 text-xs font-bold text-[#FC8019] shadow-xs">
                              <button
                                onClick={() => removeFromCart(dish.id)}
                                className="p-0.5 hover:bg-orange-100 rounded"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-4 text-center font-black">{qty}</span>
                              <button
                                onClick={() => addToCart(dish.id as any, selectedRestaurant)}
                                className="p-0.5 hover:bg-orange-100 rounded"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(dish, selectedRestaurant)}
                              className="px-5 py-1.5 rounded-xl bg-white hover:bg-orange-50 border-2 border-[#FC8019] text-[#FC8019] font-extrabold text-xs shadow-xs transition-colors hover:shadow-md"
                            >
                              ADD +
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Modal Bar */}
            {totalCartCount > 0 && (
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 block">
                    {totalCartCount} item(s) selected
                  </span>
                  <span className="text-base font-extrabold text-gray-900">
                    Subtotal: ₹{cartSubtotal}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedRestaurant(null);
                    setCartOpen(true);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#FC8019] hover:bg-[#e07214] text-white font-bold text-xs shadow-md flex items-center gap-2"
                >
                  View Cart & Checkout &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cart & Checkout Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white max-w-md w-full h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-[#FC8019]" />
                <h3 className="font-extrabold text-base text-gray-900">Your Food Cart</h3>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            {cartItems.length > 0 ? (
              <div className="p-5 overflow-y-auto flex-1 space-y-6">
                {/* Restaurant Info */}
                {activeRestaurant && (
                  <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-100 flex items-center gap-3">
                    <img
                      src={activeRestaurant.image}
                      alt={activeRestaurant.name}
                      className="w-12 h-12 rounded-xl object-cover shadow-xs"
                    />
                    <div className="truncate">
                      <h4 className="font-extrabold text-sm text-gray-900 truncate">
                        {activeRestaurant.name}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">{activeRestaurant.address}</p>
                    </div>
                  </div>
                )}

                {/* Items */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                    Dishes Selected
                  </span>
                  {cartItems.map((ci) => (
                    <div
                      key={ci.item.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/70"
                    >
                      <div className="space-y-0.5 truncate pr-2">
                        <span className="text-xs font-bold text-gray-900 block truncate">
                          {ci.item.name}
                        </span>
                        <span className="text-xs text-gray-500">₹{ci.item.price} each</span>
                      </div>

                      <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold">
                        <button
                          onClick={() => removeFromCart(ci.item.id)}
                          className="hover:text-red-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-4 text-center">{ci.quantity}</span>
                        <button
                          onClick={() => addToCart(ci.item, ci.restaurant)}
                          className="hover:text-emerald-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery Address */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#FC8019]" />
                      Delivery Location
                    </span>
                    <button
                      onClick={handleDetectDeviceGps}
                      className="text-[11px] font-bold text-[#FC8019] hover:underline"
                    >
                      Refresh GPS
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {customerLocation.address}
                  </p>
                </div>

                {/* Bill Breakdown */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2 text-xs">
                  <span className="font-extrabold text-gray-900 block pb-1 border-b border-gray-200">
                    Bill Details
                  </span>
                  <div className="flex justify-between text-gray-600">
                    <span>Item Total</span>
                    <span>₹{cartSubtotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee ({activeRestaurant?.distance_km} km road)</span>
                    <span>₹{deliveryFee}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Platform Fee</span>
                    <span>₹6</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST and Restaurant Charges</span>
                    <span>₹{Math.round(cartSubtotal * 0.05)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-gray-900 pt-2 border-t border-gray-200">
                    <span>To Pay</span>
                    <span className="text-[#FC8019]">₹{grandTotal}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                <ShoppingBag className="w-12 h-12 text-gray-300" />
                <h4 className="font-bold text-gray-800">Your Cart is Empty</h4>
                <p className="text-xs text-gray-500">
                  Select delicious dishes from real restaurants nearby to get started!
                </p>
              </div>
            )}

            {/* Checkout Action Button */}
            {cartItems.length > 0 && (
              <div className="p-5 border-t border-gray-200 bg-white">
                <button
                  onClick={handlePlaceOrder}
                  disabled={ordering}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#FC8019] hover:bg-[#e07214] text-white font-extrabold text-sm shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition-transform active:scale-98 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {ordering ? 'Confirming with Kitchen...' : `Place Order (₹${grandTotal}) & Track Live`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Pairing Modal */}
      <DeviceConnectModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
      />
    </div>
  );
};
