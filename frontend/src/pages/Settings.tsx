import React, { useEffect, useState } from 'react';
import { 
  Save, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  Globe, 
  Key
} from 'lucide-react';
import { api } from '../services/api';

export const Settings: React.FC = () => {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form State
  const [osrmEndpoint, setOsrmEndpoint] = useState('');
  const [nominatimEndpoint, setNominatimEndpoint] = useState('');
  const [geocodingProvider, setGeocodingProvider] = useState('nominatim');
  const [geocodingApiKey, setGeocodingApiKey] = useState('');
  const [fallbackSpeed, setFallbackSpeed] = useState('30.0');
  const [maxExactStops, setMaxExactStops] = useState('9');

  const loadSettings = async () => {
    try {
      const res = await api.getSettings();
      setOsrmEndpoint(res.osrm_endpoint || '');
      setNominatimEndpoint(res.nominatim_endpoint || '');
      setGeocodingProvider(res.geocoding_provider || 'nominatim');
      setFallbackSpeed((res.fallback_speed_kmh || 30.0).toString());
      setMaxExactStops((res.max_exact_stops || 9).toString());
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      await api.updateSettings({
        osrm_endpoint: osrmEndpoint,
        nominatim_endpoint: nominatimEndpoint,
        geocoding_provider: geocodingProvider,
        geocoding_api_key: geocodingApiKey,
        fallback_speed_kmh: parseFloat(fallbackSpeed),
        max_exact_stops: parseInt(maxExactStops)
      });
      setMessage('Settings updated successfully.');
      loadSettings();
    } catch (err: any) {
      alert(`Error updating settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDemo = async () => {
    try {
      await api.seedDemoDeliveries();
      alert('Successfully seeded authentic Navi Mumbai delivery demo data.');
    } catch (err: any) {
      alert(`Error seeding demo data: ${err.message}`);
    }
  };

  const handleClearDemo = async () => {
    if (!confirm('Clear seeded demo deliveries?')) return;
    try {
      await api.clearDemoDeliveries();
      alert('Demo deliveries cleared.');
    } catch (err: any) {
      alert(`Error clearing demo data: ${err.message}`);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#E8E8E8] pb-5">
        <h1 className="text-2xl font-bold text-[#282C3F] tracking-tight">System & Geospatial Settings</h1>
        <p className="text-sm text-[#686B78] mt-0.5">
          Configure road routing engines, geocoding providers, API credentials, and presentation demo mode.
        </p>
      </div>

      {message && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16803D]" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Routing Engine Settings */}
        <div className="bg-white rounded-xl border border-[#E8E8E8] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Globe className="w-4 h-4 text-[#FC8019]" />
            <h2 className="text-sm font-bold text-[#282C3F]">OSRM Road Network Routing Service</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[#282C3F] mb-1">
                OSRM Base URL Endpoint
              </label>
              <input
                type="url"
                value={osrmEndpoint}
                onChange={(e) => setOsrmEndpoint(e.target.value)}
                placeholder="https://router.project-osrm.org"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
              />
              <span className="text-[11px] text-[#686B78] mt-1 block">
                Points to hosted OSRM instance. Can be changed to a locally hosted Docker container (`http://localhost:5000`) for production reliability.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block font-semibold text-[#282C3F] mb-1">
                  Offline Fallback Road Speed (km/h)
                </label>
                <input
                  type="number"
                  step="1"
                  value={fallbackSpeed}
                  onChange={(e) => setFallbackSpeed(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#282C3F] mb-1">
                  Max Stops for Exact Held-Karp
                </label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={maxExactStops}
                  onChange={(e) => setMaxExactStops(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Geocoding Provider Settings */}
        <div className="bg-white rounded-xl border border-[#E8E8E8] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Key className="w-4 h-4 text-[#FC8019]" />
            <h2 className="text-sm font-bold text-[#282C3F]">Geocoding Provider Abstraction</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[#282C3F] mb-1">
                Active Provider Selection
              </label>
              <select
                value={geocodingProvider}
                onChange={(e) => setGeocodingProvider(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
              >
                <option value="nominatim">OpenStreetMap Nominatim (Rate-limited, user-triggered only)</option>
                <option value="geoapify">Geoapify (Recommended with API Key)</option>
                <option value="locationiq">LocationIQ (With API Key)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#282C3F] mb-1">
                Provider API Key (Optional for Nominatim / Presets)
              </label>
              <input
                type="password"
                value={geocodingApiKey}
                onChange={(e) => setGeocodingApiKey(e.target.value)}
                placeholder="Enter Geoapify or LocationIQ API key..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E8] focus:outline-none focus:border-[#FC8019]"
              />
              <span className="text-[11px] text-[#686B78] mt-1 block">
                Stored securely in server environment. Never exposed in public client bundles.
              </span>
            </div>
          </div>
        </div>

        {/* Presentation Demo Data Controls */}
        <div className="bg-white rounded-xl border border-[#E8E8E8] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Sparkles className="w-4 h-4 text-[#FC8019]" />
            <h2 className="text-sm font-bold text-[#282C3F]">College Presentation Demo Scenario</h2>
          </div>

          <p className="text-xs text-[#686B78]">
            Pre-seed authentic delivery stops in Kharghar, Vashi, Belapur, Nerul, and Seawoods (Navi Mumbai) with accurate Indian coordinates and postal codes.
          </p>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleSeedDemo}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#FC8019] text-[#FC8019] hover:bg-orange-50 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Navi Mumbai Demo Scenario</span>
            </button>

            <button
              type="button"
              onClick={handleClearDemo}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Demo Records</span>
            </button>
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-[#FC8019] text-white hover:bg-[#E37315] font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
