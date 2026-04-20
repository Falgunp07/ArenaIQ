import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { Clock3, Route as RouteIcon, Users } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import Layout from "./components/Layout";
import ChatInterface from "./components/ChatInterface";
import AlertBanner from "./components/AlertBanner";
import StaffDashboard from "./components/StaffDashboard";
import { NotificationProvider } from "./context/NotificationContext";
import useRealtimeCrowd from "./hooks/useRealtimeCrowd";

const CrowdHeatmap = lazy(() => import("./components/CrowdHeatmap"));

function ErrorFallback({ error }) {
  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl bg-red-50 p-6 text-center">
      <h2 className="text-xl font-bold text-red-900 mb-2">Something went wrong</h2>
      <p className="text-sm text-red-700 mb-4">{error.message}</p>
      <button 
        onClick={() => window.location.reload()} 
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
      >
        Reload Page
      </button>
    </div>
  );
}

function getEstimatedWait(density = 0) {
  return Math.max(1, Math.round(density * 0.12));
}

function AttendeePage() {
  const { zones } = useRealtimeCrowd();

  const activeZones = zones.length;
  const avgDensity = activeZones
    ? Math.round(zones.reduce((sum, zone) => sum + (zone.density || 0), 0) / activeZones)
    : 0;

  const busiest = [...zones].sort((a, b) => (b.density || 0) - (a.density || 0)).slice(0, 3);

  return (
    <>
      <AlertBanner />

      <div className="mx-auto max-w-[1400px] w-full p-4 sm:p-6 md:p-8 flex flex-col gap-6 sm:gap-8">
        
        {/* HEADER AREA */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col xl:flex-row gap-8 justify-between xl:items-center">
          <div className="flex flex-col gap-3">
            <div className="inline-flex max-w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1 border border-blue-100">
              <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Live Attendee Dashboard</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Navigate with Intelligence
            </h1>
            <p className="max-w-2xl text-base text-slate-600 leading-relaxed">
              Find the fastest gates, locate zero-wait restrooms, and get smart route guidance while the stadium map updates in real time.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-4 xl:shrink-0">
            <div className="flex flex-col flex-1 sm:w-32 bg-slate-50 rounded-2xl border border-slate-100 p-5 items-center text-center justify-center">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Zones</p>
              <p className="mt-1 text-3xl font-black text-slate-800">{activeZones || "--"}</p>
            </div>
            <div className="flex flex-col flex-1 sm:w-32 bg-blue-50 rounded-2xl border border-blue-100 p-5 items-center text-center justify-center">
               <p className="text-xs font-bold uppercase tracking-wider text-blue-500">Avg Density</p>
               <p className="mt-1 text-3xl font-black text-blue-700">{avgDensity}%</p>
            </div>
            <div className="flex flex-col flex-auto sm:w-auto bg-green-50 rounded-2xl border border-green-100 p-5 items-center text-center justify-center">
               <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-1">Status</p>
               <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700 border border-green-200 uppercase tracking-widest">Live</span>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          
          {/* MAP COLUMN */}
          <div className="lg:col-span-8 flex flex-col gap-6 sm:gap-8">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                 <h2 className="text-xl font-bold text-slate-800">Live Crowd Map</h2>
                 <span className="text-sm font-medium text-slate-500">Updated constantly</span>
              </div>
              <div className="h-[450px] w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                 <ErrorBoundary FallbackComponent={ErrorFallback}>
                   <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="shimmer w-full h-full" /></div>}>
                     <CrowdHeatmap />
                   </Suspense>
                 </ErrorBoundary>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex items-center gap-2">
                 <RouteIcon className="h-5 w-5 text-blue-600" />
                 <h3 className="text-lg font-bold text-slate-800">Smart Route Suggestions</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {busiest.length > 0 ? (
                  busiest.map((zone) => (
                    <div key={zone.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-5 hover:border-blue-200 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-slate-800 leading-tight">{zone.name}</p>
                        <span className="shrink-0 rounded-md bg-red-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-red-700 border border-red-200">
                          {zone.density}% busy
                        </span>
                      </div>
                      
                      <div className="mt-auto pt-2 flex flex-col gap-2 text-sm text-slate-600">
                        <span className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-amber-500" /> Wait: {getEstimatedWait(zone.density)}m
                        </span>
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" /> Avoid Area
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8 rounded-xl border border-slate-100 bg-slate-50 text-slate-500">
                    Awaiting density data readings...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CHAT COLUMN */}
          <div className="lg:col-span-4 relative flex flex-col h-[600px] lg:h-auto">
            <div className="absolute inset-0 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
               <div className="p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                  <h2 className="text-lg font-bold text-slate-800">ArenaIQ Assistant</h2>
                  <p className="text-sm text-slate-500 mt-1">Ask questions for instant guidance.</p>
               </div>
               <div className="flex-1 flex flex-col w-full min-h-0 bg-white">
                 <ChatInterface />
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
    <NotificationProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<AttendeePage />} />
          <Route path="/staff" element={<StaffDashboard />} />
        </Routes>
      </Layout>
    </NotificationProvider>
  );
}
