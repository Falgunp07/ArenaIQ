/**
 * StaffDashboard.jsx — Operations dashboard for staff
 *
 * Grid of all 12 zones with live status, density, and wait times.
 * Includes a Gemini-generated AI summary card identifying bottlenecks
 * and recommending actions.
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { BsArrowRepeat, BsRobot, BsShieldCheck } from "react-icons/bs";
import { HiOutlineExclamation } from "react-icons/hi";
import useRealtimeCrowd from "../hooks/useRealtimeCrowd";
import ZoneCard from "./ZoneCard";
import CrowdHeatmap from "./CrowdHeatmap";

export default function StaffDashboard() {
  const { zones, loading } = useRealtimeCrowd();
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Fetch AI summary
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch("/api/staff-summary", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary || "Unable to generate summary.");
      } else {
        setSummary("Failed to generate AI summary. Check backend connection.");
      }
    } catch {
      setSummary("Unable to reach AI backend. Ensure the server is running.");
    } finally {
      setSummaryLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  // Auto-fetch summary on load and every 60s
  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 60_000);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  // Stats calculations
  const totalZones = zones.length;
  const highDensity = zones.filter((z) => z.density >= 80).length;
  const avgDensity = totalZones
    ? Math.round(zones.reduce((sum, z) => sum + (z.density || 0), 0) / totalZones)
    : 0;

  // Sort: highest density first
  const sortedZones = [...zones].sort((a, b) => (b.density || 0) - (a.density || 0));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <BsShieldCheck className="text-accent-cyan" />
            Operations Dashboard
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Real-time venue monitoring • {totalZones} zones active
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-3">
          <div className="glass-card px-4 py-2 text-center">
            <p className="text-lg font-bold font-mono text-accent-cyan">{avgDensity}%</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Avg. Density</p>
          </div>
          <div className="glass-card px-4 py-2 text-center">
            <p className={`text-lg font-bold font-mono ${highDensity > 0 ? "text-accent-red" : "text-accent-green"}`}>
              {highDensity}
            </p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">High Zones</p>
          </div>
          <div className="glass-card px-4 py-2 text-center">
            <p className="text-lg font-bold font-mono text-accent-green">{totalZones - highDensity}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Normal</p>
          </div>
        </div>
      </div>

      {/* AI Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="gradient-border"
      >
        <div className="relative p-5 rounded-2xl bg-stadium-card">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center">
                <BsRobot className="text-white text-sm" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-primary">AI Situation Report</h2>
                <p className="text-[10px] text-text-muted">
                  Powered by Gemini 2.0 Flash
                  {lastRefresh && ` • ${lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                </p>
              </div>
            </div>
            <button
              onClick={fetchSummary}
              disabled={summaryLoading}
              className="p-2 rounded-lg text-text-muted hover:text-accent-cyan hover:bg-stadium-hover transition-colors disabled:opacity-50"
              aria-label="Refresh AI summary"
            >
              <BsArrowRepeat className={`text-base ${summaryLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {summaryLoading && !summary ? (
            <div className="space-y-2">
              <div className="shimmer h-4 rounded-lg w-full" />
              <div className="shimmer h-4 rounded-lg w-3/4" />
              <div className="shimmer h-4 rounded-lg w-5/6" />
            </div>
          ) : (
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
              {summary}
            </p>
          )}

          {/* Bottleneck badges */}
          {highDensity > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-stadium-border">
              {zones
                .filter((z) => z.density >= 80)
                .map((z) => (
                  <span
                    key={z.id}
                    className="inline-flex items-center gap-1 status-red text-[10px] font-bold px-2 py-0.5 rounded-full"
                  >
                    <HiOutlineExclamation className="text-xs" />
                    {z.name}: {z.density}%
                  </span>
                ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zones Grid */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
            All Zones
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="glass-card p-4">
                  <div className="shimmer h-4 w-24 rounded mb-3" />
                  <div className="shimmer h-8 w-16 rounded mb-2" />
                  <div className="shimmer h-2 w-full rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sortedZones.map((zone, i) => (
                <ZoneCard key={zone.id} zone={zone} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Heatmap Panel */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
            Live Heatmap
          </h2>
          <div className="sticky top-20">
            <CrowdHeatmap compact />
          </div>
        </div>
      </div>
    </div>
  );
}
