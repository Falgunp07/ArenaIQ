/**
 * ZoneCard.jsx — Individual zone status card
 *
 * Displays a single zone with density bar, percentage, status badge,
 * and wait time (for applicable facility types). Uses glassmorphism
 * styling with pulse animation on high-density zones.
 */

import { motion } from "framer-motion";
import { BsDoorOpen, BsCupStraw, BsPersonWalking, BsSignpost } from "react-icons/bs";
import { MdOutlineChair, MdOutlineWc } from "react-icons/md";
import WaitTimeBadge from "./WaitTimeBadge";

const TYPE_ICONS = {
  gate: BsDoorOpen,
  concession: BsCupStraw,
  restroom: MdOutlineWc,
  seating: MdOutlineChair,
  corridor: BsPersonWalking,
};

const TYPE_LABELS = {
  gate: "Entry Gate",
  concession: "Concession Stand",
  restroom: "Restroom Block",
  seating: "Seating Area",
  corridor: "Corridor",
};

export default function ZoneCard({ zone, index = 0 }) {
  const density = zone.density ?? 0;
  const status =
    density < 50 ? "green" : density < 80 ? "amber" : "red";

  const statusLabel =
    density < 50 ? "Low" : density < 80 ? "Moderate" : "Crowded";

  const statusClass = `status-${status}`;
  const Icon = TYPE_ICONS[zone.type] || BsSignpost;

  // Compute wait time for applicable types
  const hasWaitTime = ["concession", "restroom"].includes(zone.type);
  const waitMinutes = hasWaitTime ? Math.min(15, Math.round(density * 0.12)) : null;

  // Density bar colour
  const barColor =
    density < 50
      ? "var(--color-accent-green)"
      : density < 80
      ? "var(--color-accent-amber)"
      : "var(--color-accent-red)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`glass-card p-4 ${status === "red" ? "pulse-danger" : ""}`}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor:
                status === "green"
                  ? "rgba(16,185,129,0.12)"
                  : status === "amber"
                  ? "rgba(245,158,11,0.12)"
                  : "rgba(239,68,68,0.12)",
            }}
          >
            <Icon
              className="text-lg"
              style={{
                color:
                  status === "green"
                    ? "var(--color-accent-green)"
                    : status === "amber"
                    ? "var(--color-accent-amber)"
                    : "var(--color-accent-red)",
              }}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary leading-tight">
              {zone.name}
            </h3>
            <p className="text-[11px] text-text-muted">
              {TYPE_LABELS[zone.type] || zone.type}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`${statusClass} text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Density Display */}
      <div className="flex items-end justify-between mb-2">
        <span
          className="text-2xl font-bold font-mono"
          style={{ color: barColor }}
        >
          {density}
          <span className="text-sm text-text-muted font-normal">%</span>
        </span>
        {hasWaitTime && (
          <WaitTimeBadge
            facilityName={zone.name}
            waitMinutes={waitMinutes}
            compact
          />
        )}
      </div>

      {/* Density Bar */}
      <div className="density-bar">
        <div
          className="density-bar-fill"
          style={{
            width: `${density}%`,
            backgroundColor: barColor,
          }}
        />
      </div>

      {/* Last Updated */}
      {zone.lastUpdated && (
        <p className="text-[10px] text-text-muted mt-2">
          Updated:{" "}
          {new Date(zone.lastUpdated).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </p>
      )}
    </motion.div>
  );
}
