import {
  Armchair,
  DoorOpen,
  PersonStanding,
  Signpost,
  Toilet,
  TriangleAlert,
  UtensilsCrossed,
} from "lucide-react";
import WaitTimeBadge from "./WaitTimeBadge";

const TYPE_ICONS = {
  gate: DoorOpen,
  concession: UtensilsCrossed,
  restroom: Toilet,
  seating: Armchair,
  corridor: PersonStanding,
};

const TYPE_LABELS = {
  gate: "Entry Gate",
  concession: "Concession",
  restroom: "Restroom",
  seating: "Seating",
  corridor: "Corridor",
};

export default function ZoneCard({ zone }) {
  const density = zone.density ?? 0;
  const status = density < 50 ? "green" : density < 80 ? "amber" : "red";
  const statusLabel = density < 50 ? "Low" : density < 80 ? "Moderate" : "Crowded";
  const statusClass =
    density < 50 ? "bg-green-100 text-green-700 border-green-200" :
    density < 80 ? "bg-amber-100 text-amber-700 border-amber-200" :
                   "bg-red-100 text-red-700 border-red-200";
  const Icon = TYPE_ICONS[zone.type] || Signpost;

  const hasWaitTime = ["concession", "restroom"].includes(zone.type);
  const waitMinutes = hasWaitTime ? Math.min(15, Math.round(density * 0.12)) : null;

  const barColor =
    density < 50 ? "#10b981" : density < 80 ? "#f59e0b" : "#ef4444";

  return (
    <article className={`bg-white rounded-3xl border border-slate-200 shadow-sm p-6`}>
      <div className="mb-6 flex items-start justify-between gap-3.5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              status === "green"
                ? "bg-green-50 text-green-600"
                : status === "amber"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-red-50 text-red-600"
            }`}
          >
            <Icon className="h-6 w-6" />
          </div>

          <div className="flex flex-col gap-0.5">
            <h3 className="text-xl font-bold leading-tight text-slate-800">{zone.name}</h3>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{TYPE_LABELS[zone.type] || zone.type}</p>
          </div>
        </div>

        <span className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider border self-start ${statusClass}`}>{statusLabel}</span>
      </div>

      <div className="mb-4 flex flex-col gap-2">
        <div className="flex items-end justify-between">
          <p className="text-4xl font-extrabold leading-none text-slate-900 tracking-tight">
            {density}
            <span className="ml-1 text-lg font-bold text-slate-400">%</span>
          </p>

          {hasWaitTime && <WaitTimeBadge facilityName={zone.name} waitMinutes={waitMinutes} compact />}
        </div>
      </div>

      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
        <div className="h-full rounded-full transition-all duration-500 ease-in-out" style={{ width: `${density}%`, backgroundColor: barColor }} />
      </div>

      {density >= 80 && (
        <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <TriangleAlert className="h-4 w-4" />
          Consider alternate routes
        </p>
      )}

      {zone.lastUpdated && (
        <p className="mt-4 text-[11px] font-medium text-slate-400">
          Updated {new Date(zone.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
      )}
    </article>
  );
}
