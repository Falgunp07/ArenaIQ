import { Clock3 } from "lucide-react";

export default function WaitTimeBadge({ facilityName, waitMinutes, compact = false }) {
  const getStatus = () => {
    if (waitMinutes < 3) return { label: "Low", className: "status-green" };
    if (waitMinutes <= 7) return { label: "Medium", className: "status-amber" };
    return { label: "High", className: "status-red" };
  };

  const status = getStatus();

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${status.className}`}
      title={`${facilityName}: ${waitMinutes} min wait`}
    >
      <Clock3 className="h-3.5 w-3.5" />
      {!compact && <span>{facilityName}:</span>}
      <span className="font-mono">{waitMinutes} min</span>
      <span className="sr-only">wait time - {status.label}</span>
    </div>
  );
}
