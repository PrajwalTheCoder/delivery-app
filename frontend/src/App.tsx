import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { RoutePlanner } from './pages/RoutePlanner';
import { DeliveryManagement } from './pages/DeliveryManagement';
import { DeliveryExecution } from './pages/DeliveryExecution';
import { RouteHistory } from './pages/RouteHistory';
import { Analytics } from './pages/Analytics';
import { AlgorithmComparison } from './pages/AlgorithmComparison';
import { Settings } from './pages/Settings';
import { SwiggyFoodApp } from './pages/SwiggyFoodApp';
import { LiveOrderTracking } from './pages/LiveOrderTracking';
import { DriverCompanion } from './pages/DriverCompanion';
import { KitchenMerchant } from './pages/KitchenMerchant';

function AppLayout() {
  const location = useLocation();
  // Driver phone view and standalone customer tracking can hide sidebar for native mobile feel
  const isDriverView = location.pathname.startsWith('/driver');

  if (isDriverView) {
    return (
      <main className="min-h-screen bg-[#121212]">
        <Routes>
          <Route path="/driver" element={<DriverCompanion />} />
          <Route path="*" element={<Navigate to="/driver" replace />} />
        </Routes>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-white text-[#282C3F] font-sans antialiased">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Application Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-white">
        <Routes>
          {/* Swiggy & Zomato Real-Time Delivery Ecosystem */}
          <Route path="/swiggy" element={<SwiggyFoodApp />} />
          <Route path="/track/:orderId" element={<LiveOrderTracking />} />
          <Route path="/driver" element={<DriverCompanion />} />
          <Route path="/kitchen" element={<KitchenMerchant />} />

          {/* Core Operations & Route Planning */}
          <Route path="/" element={<SwiggyFoodApp />} />
          <Route path="/tour" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/route-planner" element={<RoutePlanner />} />
          <Route path="/deliveries" element={<DeliveryManagement />} />
          <Route path="/execution" element={<DeliveryExecution />} />
          <Route path="/history" element={<RouteHistory />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/algorithms" element={<AlgorithmComparison />} />
          <Route path="/settings" element={<Settings />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/swiggy" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
