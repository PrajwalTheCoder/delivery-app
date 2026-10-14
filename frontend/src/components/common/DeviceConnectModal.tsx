import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Smartphone, 
  Wifi, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  Navigation, 
  ChefHat, 
  ShieldCheck,
  Radio,
  Download
} from 'lucide-react';
import { api } from '../../services/api';
import type { DeviceInfo } from '../../types';

interface DeviceConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeOrderId?: string;
}

export const DeviceConnectModal: React.FC<DeviceConnectModalProps> = ({
  isOpen,
  onClose,
  activeOrderId
}) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'apk' | 'driver' | 'customer' | 'kitchen'>('apk');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getFoodDeviceInfo()
        .then((info) => setDeviceInfo(info))
        .catch(() => {
          // Fallback to window host
          const host = window.location.hostname || '127.0.0.1';
          const port = window.location.port || '5173';
          setDeviceInfo({
            lan_ip: host,
            frontend_port: Number(port),
            backend_port: 5050,
            customer_url: `http://${host}:${port}/swiggy`,
            driver_companion_url: `http://${host}:${port}/driver`,
            kitchen_url: `http://${host}:${port}/kitchen`,
            tracking_url_template: `http://${host}:${port}/track/{orderId}`,
            server_time: Date.now() / 1000,
            active_orders_count: 1
          });
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentUrl = (() => {
    if (!deviceInfo) return window.location.href;
    const baseHost = deviceInfo.lan_ip || window.location.hostname;
    const port = deviceInfo.frontend_port || 5173;

    if (activeTab === 'apk') {
      return `http://${baseHost}:${port}/RouteWise_RealTimeEngine.apk`;
    } else if (activeTab === 'driver') {
      const orderParam = activeOrderId ? `?orderId=${activeOrderId}` : '';
      return `http://${baseHost}:${port}/driver${orderParam}`;
    } else if (activeTab === 'customer') {
      if (activeOrderId) {
        return `http://${baseHost}:${port}/track/${activeOrderId}`;
      }
      return `http://${baseHost}:${port}/swiggy`;
    } else {
      return `http://${baseHost}:${port}/kitchen`;
    }
  })();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenNewWindow = () => {
    window.open(currentUrl, '_blank', 'width=420,height=800,menubar=no,toolbar=no');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">Connect Mobile Device</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> LIVE SYNC
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Download the Android APK or connect your real phone to RouteWise
              </p>
            </div>
          </div>

          {/* Role Tabs */}
          <div className="flex bg-white/10 p-1 rounded-xl mt-5 gap-1 flex-wrap">
            <button
              onClick={() => setActiveTab('apk')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'apk'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              Download APK
            </button>
            <button
              onClick={() => setActiveTab('driver')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'driver'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              Driver Phone
            </button>
            <button
              onClick={() => setActiveTab('customer')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'customer'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Customer
            </button>
            <button
              onClick={() => setActiveTab('kitchen')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'kitchen'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              Kitchen
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* QR Code Card */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-orange-50/50 border border-orange-100">
            <div className="bg-white p-3.5 rounded-2xl shadow-md border border-gray-200 shrink-0">
              <QRCodeSVG
                value={currentUrl}
                size={168}
                level="M"
                includeMargin={false}
              />
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-gray-200 text-xs font-bold text-gray-700 shadow-2xs">
                <Wifi className="w-3.5 h-3.5 text-orange-500" />
                LAN IP: <span className="font-mono text-orange-600">{deviceInfo?.lan_ip || 'Detecting...'}</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900">
                {activeTab === 'apk' && 'Download Android APK (177 MB)'}
                {activeTab === 'driver' && 'Open Driver App on Phone'}
                {activeTab === 'customer' && 'Live Track on Phone'}
                {activeTab === 'kitchen' && 'Kitchen Order Tablet'}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {activeTab === 'apk' && 'Scan with any phone camera or tap download to get the RouteWise APK directly onto your Android device.'}
                {activeTab === 'driver' && 'Connect your real phone GPS. As you move or walk, your physical coordinates update the customer map in real time!'}
                {activeTab === 'customer' && 'Experience live Swiggy / Zomato order tracking directly on your mobile browser.'}
                {activeTab === 'kitchen' && 'Receive incoming order sound chimes and mark food ready for rider pickup.'}
              </p>
            </div>
          </div>

          {/* Direct Download Button for APK */}
          {activeTab === 'apk' && (
            <a
              href="/RouteWise_RealTimeEngine.apk"
              download="RouteWise_RealTimeEngine.apk"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>Direct Download RouteWise APK (177 MB)</span>
            </a>
          )}

          {/* Quick URL Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 block">
              {activeTab === 'apk' ? 'APK Direct Download Link:' : 'Direct URL for Phone Browser:'}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-gray-800 truncate select-all">
                {currentUrl}
              </div>
              <button
                onClick={handleCopy}
                className="px-3.5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* How It Works Guide */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2.5 text-xs text-gray-600">
            <div className="font-bold text-gray-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {activeTab === 'apk' ? 'How to Install on Friends\' Android Devices:' : 'How Real Device Connection Works:'}
            </div>
            {activeTab === 'apk' ? (
              <ol className="list-decimal pl-5 space-y-1.5">
                <li>Connect your friend's phone to the same Wi-Fi or hotspot as your computer.</li>
                <li>Scan the QR code above or open the link in Chrome on their Android phone.</li>
                <li>Tap <strong>"Download anyway"</strong> when Android prompts about downloading an APK.</li>
                <li>Open the downloaded file and tap <strong>"Install"</strong> (allow Unknown Sources if prompted).</li>
              </ol>
            ) : (
              <ol className="list-decimal pl-5 space-y-1.5">
                <li>Ensure your smartphone is on the same Wi-Fi network as this computer.</li>
                <li>Scan the QR code with your iPhone or Android camera to open the web app.</li>
                <li>Tap <strong>"📡 Share Device GPS"</strong> to stream your phone's real latitude & longitude into the active delivery order!</li>
                <li>The customer's live tracking map on your computer will move with your phone in real time.</li>
              </ol>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            {activeTab !== 'apk' && (
              <button
                onClick={handleOpenNewWindow}
                className="flex-1 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                Open Mobile Simulator Window
              </button>
            )}
            <button
              onClick={onClose}
              className="py-3 px-5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer w-full"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
