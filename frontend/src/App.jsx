/**
 * App.jsx — Main application with routing
 *
 * Two routes:
 *   /      → Attendee view (Chat + Heatmap + Alerts)
 *   /staff → Staff Operations Dashboard
 */

import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ChatInterface from "./components/ChatInterface";
import CrowdHeatmap from "./components/CrowdHeatmap";
import AlertBanner from "./components/AlertBanner";
import StaffDashboard from "./components/StaffDashboard";

function AttendeePage() {
  return (
    <>
      <AlertBanner />
      <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-5 h-full">
          {/* Chat Panel */}
          <div className="lg:col-span-3 h-full border-r border-stadium-border">
            <ChatInterface />
          </div>

          {/* Map Panel — desktop only */}
          <div className="hidden lg:block lg:col-span-2 p-4">
            <div className="h-full flex flex-col gap-4">
              <div>
                <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Live Crowd Map
                </h2>
                <p className="text-xs text-text-muted mb-3">
                  Real-time density across all zones
                </p>
              </div>
              <div className="flex-1">
                <CrowdHeatmap />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<AttendeePage />} />
        <Route path="/staff" element={<StaffDashboard />} />
      </Routes>
    </Layout>
  );
}
