/**
 * useRealtimeCrowd.js - Firestore real-time listener for zone data
 *
 * Subscribes to the `zones` collection via onSnapshot and returns
 * live crowd density data for all zones.
 * Falls back to demo data when Firebase is not configured.
 */

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const DEMO_ZONES = [
  { id: "gate_a", name: "Gate A", type: "gate", density: 42, lat: 37.4042, lng: -121.9693 },
  { id: "gate_b", name: "Gate B", type: "gate", density: 28, lat: 37.4035, lng: -121.9686 },
  { id: "gate_c", name: "Gate C", type: "gate", density: 78, lat: 37.4028, lng: -121.9693 },
  { id: "gate_d", name: "Gate D", type: "gate", density: 15, lat: 37.4035, lng: -121.9700 },
  { id: "concession_1", name: "Concessions 1", type: "concession", density: 55, lat: 37.4040, lng: -121.969 },
  { id: "concession_2", name: "Concessions 2", type: "concession", density: 91, lat: 37.4032, lng: -121.9688 },
  { id: "concession_3", name: "Concessions 3", type: "concession", density: 34, lat: 37.4030, lng: -121.969 },
  { id: "concession_4", name: "Concessions 4", type: "concession", density: 48, lat: 37.4032, lng: -121.9698 },
  { id: "restroom_1", name: "Restroom 1", type: "restroom", density: 87, lat: 37.4038, lng: -121.9688 },
  { id: "restroom_2", name: "Restroom 2", type: "restroom", density: 31, lat: 37.4032, lng: -121.9696 },
  { id: "main_stand", name: "Main Stand", type: "seating", density: 73, lat: 37.4035, lng: -121.9693 },
  { id: "exit_corridor", name: "Exit Corridor", type: "corridor", density: 19, lat: 37.4035, lng: -121.9702 },
];

export function useRealtimeCrowd() {
  const hasDb = Boolean(db);
  const [zones, setZones] = useState(() => (hasDb ? [] : DEMO_ZONES));
  const [loading, setLoading] = useState(hasDb);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hasDb) {
      const interval = setInterval(() => {
        setZones((previous) =>
          previous.map((zone) => ({
            ...zone,
            density: Math.max(0, Math.min(100, zone.density + Math.floor(Math.random() * 21) - 10)),
            lastUpdated: new Date().toISOString(),
          }))
        );
      }, 30000);

      return () => clearInterval(interval);
    }

    try {
      const zonesCollection = collection(db, "zones");

      const unsubscribe = onSnapshot(
        zonesCollection,
        (snapshot) => {
          const items = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            lastUpdated: doc.data().lastUpdated?.toDate?.()?.toISOString?.() ?? null,
          }));

          setZones(items.length > 0 ? items : DEMO_ZONES);
          setLoading(false);
          setError(null);
        },
        (snapshotError) => {
          console.error("[useRealtimeCrowd] Error:", snapshotError.message);
          setError(snapshotError.message);
          setZones(DEMO_ZONES);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (setupError) {
      console.warn("[useRealtimeCrowd] Firestore setup failed:", setupError.message);
      const timeout = setTimeout(() => {
        setError(setupError.message);
        setZones(DEMO_ZONES);
        setLoading(false);
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [hasDb]);

  return { zones, loading, error };
}

export default useRealtimeCrowd;
