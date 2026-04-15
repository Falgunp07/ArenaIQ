/**
 * AlertBanner.jsx — Smart crowd alert banner
 *
 * Displays slide-down alerts when zones exceed 80% density.
 * Auto-dismisses after 15 seconds or manual close.
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineExclamation, HiOutlineX } from "react-icons/hi";
import useAlerts from "../hooks/useAlerts";

export default function AlertBanner() {
  const { alerts } = useAlerts();
  const [dismissed, setDismissed] = useState(new Set());

  // Auto-dismiss after 15 seconds
  useEffect(() => {
    const timers = [];
    for (const alert of alerts) {
      if (!dismissed.has(alert.id)) {
        const timer = setTimeout(() => {
          setDismissed((prev) => new Set([...prev, alert.id]));
        }, 15000);
        timers.push(timer);
      }
    }
    return () => timers.forEach(clearTimeout);
  }, [alerts, dismissed]);

  const handleDismiss = useCallback((id) => {
    setDismissed((prev) => new Set([...prev, id]));
  }, []);

  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.id));

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-40 px-4 pt-2 pointer-events-none">
      <AnimatePresence>
        {visibleAlerts.slice(0, 3).map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ y: -20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            role="alert"
            aria-live="assertive"
            className="pointer-events-auto max-w-2xl mx-auto mb-2"
          >
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-accent-red/15 via-accent-amber/10 to-accent-red/15 border border-accent-red/30 backdrop-blur-sm">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-red/20 flex items-center justify-center">
                <HiOutlineExclamation className="text-accent-red text-lg" />
              </div>
              <p className="flex-1 text-sm text-text-primary font-medium">
                {alert.message}
              </p>
              <button
                onClick={() => handleDismiss(alert.id)}
                className="flex-shrink-0 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                aria-label="Dismiss alert"
              >
                <HiOutlineX className="text-base" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
