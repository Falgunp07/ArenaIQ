/**
 * useRealtimeCrowd.js — Firestore real-time listener for zone data
 *
 * Subscribes to the `zones` collection via onSnapshot and returns
 * live crowd density data for all 12 stadium zones.
 * Falls back to empty state when Firebase is not configured.
 */

import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// Demo data used when Firebase is not available
const DEMO_ZONES = [
  { id: "gate_a", name: "Gate A", type: "gate", density: 42, lat: 37.4045, lng: -121.9693 },
  { id: "gate_b", name: "Gate B", type: "gate", density: 28, lat: 37.4035, lng: -121.9683 },
  { id: "gate_c", name: "Gate C", type: "gate", density: 78, lat: 37.4025, lng: -121.9693 },
  { id: "gate_d", name: "Gate D", type: "gate", density: 15, lat: 37.4035, lng: -121.9703 },
  { id: "concession_1", name: "Concessions 1", type: "concession", density: 55, lat: 37.4042, lng: -121.969 },
  { id: "concession_2", name: "Concessions 2", type: "concession", density: 91, lat: 37.4032, lng: -121.9685 },
  { id: "concession_3", name: "Concessions 3", type: "concession", density: 34, lat: 37.4028, lng: -121.969 },
  { id: "concession_4", name: "Concessions 4", type: "concession", density: 48, lat: 37.4032, lng: -121.97 },
  { id: "restroom_1", name: "Restroom 1", type: "restroom", density: 87, lat: 37.404, lng: -121.9686 },
  { id: "restroom_2", name: "Restroom 2", type: "restroom", density: 31, lat: 37.403, lng: -121.9698 },
  { id: "main_stand", name: "Main Stand", type: "seating", density: 73, lat: 37.4035, lng: -121.9693 },
  { id: "exit_corridor", name: "Exit Corridor", type: "corridor", density: 19, lat: 37.4035, lng: -121.9706 },
];

export function useRealtimeCrowd() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If Firebase is not configured, use demo data with simulated updates
    if (!db) {
      console.warn("[useRealtimeCrowd] No Firestore — using demo data");
      setZones(DEMO_ZONES);
      setLoading(false);

      // Simulate updates every 30s
      const interval = setInterval(() => {
        setZones((prev) =>
          prev.map((z) => ({
            ...z,
            density: Math.max(0, Math.min(100, z.density + Math.floor(Math.random() * 21) - 10)),
            lastUpdated: new Date().toISOString(),
          }))
        );
      }, 30000);

      return () => clearInterval(interval);
    }

    try {
      const colRef = collection(db, "zones");

      const unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const items = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            lastUpdated: doc.data().lastUpdated?.toDate?.()?.toISOString?.() ?? null,
          }));

          if (items.length > 0) {
            setZones(items);
          } else {
            // Firestore is empty, use demo data
            setZones(DEMO_ZONES);
          }
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error("[useRealtimeCrowd] Error:", err.message);
          setError(err.message);
          setZones(DEMO_ZONES);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn("[useRealtimeCrowd] Firestore setup failed:", err.message);
      setZones(DEMO_ZONES);
      setLoading(false);
      return () => {};
    }
  }, []);

  return { zones, loading, error };
}

export default useRealtimeCrowd;
