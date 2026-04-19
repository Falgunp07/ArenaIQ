import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  CircleCheckBig,
  Gauge,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import useRealtimeCrowd from "../hooks/useRealtimeCrowd";
import ZoneCard from "./ZoneCard";
import CrowdHeatmap from "./CrowdHeatmap";

export default function StaffDashboard() {
  const { zones, loading } = useRealtimeCrowd();
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const response = await fetch("/api/staff-summary", { method: "POST" });
      if (!response.ok) {
        throw new Error(`Summary endpoint error (${response.status})`);
      }

      const payload = await response.json();
      setSummary(payload.summary || "No summary available right now.");
    } catch {
      setSummary("Unable to generate summary at the moment. Verify backend connectivity and try again.");
    } finally {
      setSummaryLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 60_000);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  const totalZones = zones.length;
  const highDensity = zones.filter((zone) => zone.density >= 80).length;
  const avgDensity = totalZones
    ? Math.round(zones.reduce((sum, zone) => sum + (zone.density || 0), 0) / totalZones)
    : 0;
  const normalZones = totalZones - highDensity;

  const sortedZones = [...zones].sort((a, b) => (b.density || 0) - (a.density || 0));
  const hotspotZones = sortedZones.filter((zone) => zone.density >= 80);

  return (
    <div className="mx-auto max-w-[1400px] w-full p-4 sm:p-6 md:p-8 flex flex-col gap-6 sm:gap-8">
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="relative z-10 px-7 py-8 sm:px-10 sm:py-10 lg:px-12 flex flex-col gap-8">
          <div className="max-w-3xl flex flex-col gap-3">
            <p className="inline-flex items-center gap-2 rounded-full bg-accent-cyan/12 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-cyan">
              <ShieldCheck className="h-3.5 w-3.5" />
              Operations Command
            </p>
            <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-4xl">Stadium Control Dashboard</h1>
            <p className="max-w-[62ch] text-base leading-7 text-slate-600">
              Monitor crowd risk in every zone, identify bottlenecks instantly, and coordinate staff response with AI-assisted recommendations.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Avg Density</p>
              <p className="mt-2 text-xl font-bold leading-none text-accent-blue">{avgDensity}%</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Hotspots</p>
              <p className="mt-2 text-xl font-bold leading-none text-accent-red">{highDensity}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Stable</p>
              <p className="mt-2 text-xl font-bold leading-none text-accent-green">{normalZones >= 0 ? normalZones : 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Zones</p>
              <p className="mt-2 text-xl font-bold leading-none text-slate-900">{totalZones || "--"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <article className="bg-white xl:col-span-7 rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">AI Situation Report</p>
              <h2 className="mt-1 flex items-center gap-2 text-xl font-bold leading-tight text-slate-900">
                <Bot className="h-5 w-5 text-accent-purple" />
                Live Operational Summary
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Updated every 60 seconds
                {lastRefresh && ` • Last refresh ${lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
              </p>
            </div>

            <button
              onClick={fetchSummary}
              disabled={summaryLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-accent-blue/35 hover:text-accent-blue disabled:opacity-50"
              aria-label="Refresh AI summary"
            >
              <RefreshCcw className={`h-4 w-4 ${summaryLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {summaryLoading && !summary ? (
            <div className="flex flex-col gap-3 py-4">
              <div className="shimmer h-4 w-full rounded-lg" />
              <div className="shimmer h-4 w-4/5 rounded-lg" />
              <div className="shimmer h-4 w-5/6 rounded-lg" />
            </div>
          ) : (
            <p className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-base leading-7 text-slate-600 whitespace-pre-wrap">
              {summary || "Summary will appear once the backend responds."}
            </p>
          )}

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Risk Level</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-base font-semibold leading-tight text-slate-900">
                {highDensity > 0 ? <AlertTriangle className="h-4 w-4 text-accent-red" /> : <CircleCheckBig className="h-4 w-4 text-accent-green" />}
                {highDensity > 0 ? "Needs attention" : "Controlled"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Flow Health</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-base font-semibold leading-tight text-slate-900">
                <Activity className="h-4 w-4 text-accent-cyan" />
                {avgDensity < 60 ? "Smooth" : avgDensity < 80 ? "Watch closely" : "Congested"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Command Advice</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-base font-semibold leading-tight text-slate-900">
                <Gauge className="h-4 w-4 text-accent-blue" />
                Prioritize top density zones
              </p>
            </div>
          </div>
        </article>

        <article className="bg-white xl:col-span-5 rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Priority Hotspots</h2>
          <div className="flex flex-col gap-3">
            {hotspotZones.length > 0 ? (
              hotspotZones.slice(0, 5).map((zone) => (
                <div key={zone.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4">
                  <p className="text-base font-semibold leading-tight text-slate-900">{zone.name}</p>
                  <span className="shrink-0 rounded-md bg-red-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-red-700 border border-red-200">{zone.density}%</span>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm leading-relaxed text-slate-600">
                No high-risk hotspots right now. Operations are stable.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col gap-6">
        <h2 className="text-lg font-bold text-slate-900">Live Heatmap</h2>
        <div className="h-[520px] rounded-2xl border border-slate-200 bg-white p-4">
          <div className="h-full overflow-hidden rounded-xl border border-slate-200/70">
            <CrowdHeatmap />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col gap-6">
        <h2 className="text-lg font-bold text-slate-900">All Stadium Zones</h2>
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="shimmer h-4 w-24 rounded mb-4" />
                <div className="shimmer h-8 w-20 rounded mb-4" />
                <div className="shimmer h-2 w-full rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {sortedZones.map((zone, index) => (
              <ZoneCard key={zone.id} zone={zone} index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
