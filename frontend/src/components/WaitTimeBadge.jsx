/**
 * WaitTimeBadge.jsx — Live wait-time pill indicator
 *
 * Small badge showing estimated wait time for a facility.
 * Color-coded: green (&lt;3 min), amber (3-7 min), red (&gt;7 min).
 */

import { motion } from "framer-motion";
import { HiOutlineClock } from "react-icons/hi";

export default function WaitTimeBadge({ facilityName, waitMinutes, compact = false }) {
  const getStatus = () => {
    if (waitMinutes < 3) return { color: "green", label: "Low", className: "status-green" };
    if (waitMinutes <= 7) return { color: "amber", label: "Medium", className: "status-amber" };
    return { color: "red", label: "High", className: "status-red" };
  };

  const status = getStatus();

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${status.className} ${
        status.color === "red" ? "pulse-danger" : ""
      }`}
      title={`${facilityName}: ${waitMinutes} min wait`}
    >
      <HiOutlineClock className="text-sm" />
      {!compact && <span>{facilityName}:</span>}
      <span className="font-mono">{waitMinutes} min</span>
      <span className="sr-only">wait time — {status.label}</span>
    </motion.div>
  );
}
