import { useCallback, useEffect, useState } from "react";
import { TriangleAlert, X } from "lucide-react";
import useAlerts from "../hooks/useAlerts";
import { useNotificationContext } from "../context/NotificationContext";

export default function AlertBanner() {
  const { alerts } = useAlerts();
  const [dismissed, setDismissed] = useState(new Set());
  const { notificationsEnabled } = useNotificationContext();

  useEffect(() => {
    const timers = [];
    for (const alert of alerts) {
      if (dismissed.has(alert.id)) continue;

      const timer = setTimeout(() => {
        setDismissed((previous) => new Set([...previous, alert.id]));
      }, 15000);

      timers.push(timer);
    }

    return () => timers.forEach(clearTimeout);
  }, [alerts, dismissed]);

  const handleDismiss = useCallback((id) => {
    setDismissed((previous) => new Set([...previous, id]));
  }, []);

  const visibleAlerts = alerts.filter((alert) => !dismissed.has(alert.id));
  if (!notificationsEnabled || visibleAlerts.length === 0) return null;

  return (
    <div className="relative z-20 mx-auto mb-4 w-full max-w-[1120px] flex flex-col gap-3 items-stretch pointer-events-auto">
      {visibleAlerts.slice(0, 3).map((alert) => (
        <div key={alert.id} role="alert" aria-live="assertive" className="pointer-events-auto w-full">
          <div className="flex items-start gap-3 rounded-2xl border border-accent-red/30 bg-gradient-to-r from-red-50 via-orange-50 to-red-50 px-4 py-3.5 shadow-sm sm:px-5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent-red/15 text-accent-red">
              <TriangleAlert className="h-4 w-4" />
            </div>

            <p className="flex-1 pt-0.5 text-sm font-semibold leading-relaxed text-slate-900">{alert.message}</p>

            <button
              onClick={() => handleDismiss(alert.id)}
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/50 hover:text-slate-900"
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
