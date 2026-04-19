/**
 * useAlerts.js - Firestore real-time listener for alert documents
 *
 * Subscribes to the `alerts` collection and returns active alerts
 * for the AlertBanner component.
 * Falls back to demo alerts when Firebase is not configured.
 */

import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

const DEMO_ALERTS = [
  {
    id: "demo-alert-1",
    zoneId: "concession_2",
    zoneName: "Concessions 2",
    density: 91,
    message: "Concessions 2 is getting crowded (91%) - try Concessions 3 instead (34% capacity).",
    createdAt: new Date().toISOString(),
    resolved: false,
  },
];

export function useAlerts() {
  const hasDb = Boolean(db);
  const [alerts, setAlerts] = useState(() => (hasDb ? [] : DEMO_ALERTS));
  const [loading, setLoading] = useState(hasDb);

  useEffect(() => {
    if (!hasDb) {
      return () => {};
    }

    try {
      const alertsQuery = query(collection(db, "alerts"), orderBy("createdAt", "desc"), limit(5));

      const unsubscribe = onSnapshot(
        alertsQuery,
        (snapshot) => {
          const items = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() ?? null,
          }));

          setAlerts(items);
          setLoading(false);
        },
        (error) => {
          console.error("[useAlerts] Error:", error.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.warn("[useAlerts] Firestore setup failed:", error.message);
      const timeout = setTimeout(() => {
        setAlerts(DEMO_ALERTS);
        setLoading(false);
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [hasDb]);

  return { alerts, loading };
}

export default useAlerts;
