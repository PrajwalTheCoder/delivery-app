import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Compass,
  LayoutDashboard, 
  Route, 
  Package, 
  PlayCircle,
  GitCompare, 
  BarChart3, 
  History, 
  Settings as SettingsIcon,
  Navigation,
  UtensilsCrossed,
  Smartphone,
  ChefHat,
  Radio,
  QrCode
} from 'lucide-react';
import { api } from '../../services/api';
import { DeviceConnectModal } from '../common/DeviceConnectModal';

export const Sidebar: React.FC = () => {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.getHealth();
        setBackendOnline(true);
      } catch {
        setBackendOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const foodNavItems = [
    { path: '/swiggy', label: 'Swiggy & Zomato Food', icon: UtensilsCrossed, highlight: 'LIVE', badgeColor: 'bg-emerald-500' },
    { path: '/driver', label: 'Driver Phone App', icon: Smartphone, highlight: 'GPS', badgeColor: 'bg-blue-600' },
    { path: '/kitchen', label: 'Kitchen Terminal', icon: ChefHat },
  ];

  const opsNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/route-planner', label: 'Route Planner (TSP)', icon: Route, highlight: 'AI' },
    { path: '/deliveries', label: 'Delivery Orders', icon: Package },
    { path: '/execution', label: 'Dispatch & Execution', icon: PlayCircle },
    { path: '/history', label: 'Saved Routes', icon: History },
    { path: '/analytics', label: 'Analytics & KPIs', icon: BarChart3 },
    { path: '/algorithms', label: 'Algorithm Lab', icon: GitCompare },
    { path: '/tour', label: 'Product Tour', icon: Compass },
    { path: '/settings', label: 'Settings & Providers', icon: SettingsIcon },
  ];

  return (
    <>
      <aside className="w-64 bg-white border-r border-[#E8E8E8] flex flex-col h-screen sticky top-0 shrink-0 select-none z-30">
        {/* Brand Header */}
        <div className="p-5 border-b border-[#E8E8E8] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FC8019] to-[#E23744] flex items-center justify-center text-white shadow-xs">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-[#282C3F] tracking-tight">RouteWise</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-[#FC8019]">AI</span>
              </div>
              <p className="text-[11px] text-[#686B78] font-medium leading-none mt-0.5">Swiggy & Zomato Engine</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
          {/* Swiggy & Zomato Ecosystem */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold text-orange-600 uppercase tracking-wider flex items-center justify-between">
              <span>Swiggy & Zomato</span>
              <span className="flex items-center gap-1 text-[9px] text-emerald-600">
                <Radio className="w-2.5 h-2.5 animate-pulse" /> Real Data
              </span>
            </div>
            {foodNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-orange-50 text-[#FC8019] border border-orange-200/60 shadow-2xs'
                        : 'text-[#282C3F] hover:bg-[#F7F7F7] hover:text-[#FC8019]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {item.highlight && (
                    <span className={`ml-auto text-[9px] font-extrabold px-1.5 py-0.2 rounded text-white ${item.badgeColor || 'bg-[#FC8019]'}`}>
                      {item.highlight}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Quick Connect Phone Button */}
          <div className="px-1">
            <button
              onClick={() => setQrOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <QrCode className="w-3.5 h-3.5 text-orange-400" />
              <span>Connect Mobile Phone</span>
            </button>
          </div>

          {/* Core Operations & Fleet Routing */}
          <div className="space-y-1 pt-1 border-t border-gray-100">
            <div className="px-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Fleet & Route Planning
            </div>
            {opsNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-orange-50 text-[#FC8019] font-semibold border border-orange-200/50'
                        : 'text-[#282C3F] hover:bg-[#F7F7F7] hover:text-[#FC8019]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {item.highlight && (
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-100 text-[#FC8019]">
                      {item.highlight}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Demonstration Region Info */}
        <div className="px-3.5 py-2.5 mx-3 mb-2 rounded-xl bg-orange-50/70 border border-orange-100 text-[11px] text-[#686B78]">
          <span className="font-semibold text-[#FC8019] block">Metro Benchmark</span>
          <span className="text-[#282C3F]">Navi Mumbai &bull; Mumbai MMR</span>
        </div>

        {/* Backend Status Footer */}
        <div className="p-3.5 border-t border-[#E8E8E8] bg-[#F7F7F7]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#686B78] font-medium text-[11px]">Backend API</span>
            <div className="flex items-center gap-1.5">
              {backendOnline === true ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-emerald-700 font-semibold text-[11px]">Online</span>
                </>
              ) : backendOnline === false ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span className="text-red-700 font-semibold text-[11px]">Offline</span>
                </>
              ) : (
                <span className="text-gray-400 text-[11px]">Checking...</span>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Cross-Device QR Modal */}
      <DeviceConnectModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
      />
    </>
  );
};
