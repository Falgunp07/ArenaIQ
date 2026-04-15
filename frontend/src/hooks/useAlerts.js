/**
 * useAlerts.js — Firestore real-time listener for alert documents
 *
 * Subscribes to the `alerts` collection and returns active alerts
 * for the AlertBanner component.
 * Falls back to demo alerts when Firebase is not configured.
 */

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";

export function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Firebase is not configured, show a demo alert
    if (!db) {
      setAlerts([
        {
          id: "demo-alert-1",
          zoneId: "concession_2",
          zoneName: "Concessions 2",
          density: 91,
          message: "Concessions 2 is getting crowded (91%) — try Concessions 3 instead (34% capacity).",
          createdAt: new Date().toISOString(),
          resolved: false,
        },
      ]);
      setLoading(false);
      return () => {};
    }

    try {
      const q = query(
        collection(db, "alerts"),
        orderBy("createdAt", "desc"),
        limit(5)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() ?? null,
          }));
          setAlerts(items);
          setLoading(false);
        },
        (err) => {
          console.error("[useAlerts] Error:", err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn("[useAlerts] Firestore setup failed:", err.message);
      setLoading(false);
      return () => {};
    }
  }, []);

  return { alerts, loading };
}

export default useAlerts;
