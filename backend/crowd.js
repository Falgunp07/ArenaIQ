/**
 * crowd.js — Firestore crowd-data helpers
 *
 * Provides functions to read zone density and compute wait times
 * from the Firestore `zones` collection. Used both by the Express
 * endpoints and by Gemini function-calling handlers.
 */

const admin = require("firebase-admin");
const path = require("path");

// Normalize credential file path so it works regardless of how node is started.
if (process.env.GOOGLE_APPLICATION_CREDENTIALS && !path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  const fromBackend = path.resolve(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS);
  const fromRepoRoot = path.resolve(__dirname, "..", process.env.GOOGLE_APPLICATION_CREDENTIALS);

  process.env.GOOGLE_APPLICATION_CREDENTIALS = fromBackend;
  if (!require("fs").existsSync(fromBackend) && require("fs").existsSync(fromRepoRoot)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = fromRepoRoot;
  }
}

// ── Initialise Firebase Admin (singleton) ──
if (!admin.apps.length) {
  let credential;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // For Render / Production where uploading a JSON file directly is insecure
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    credential = admin.credential.cert(serviceAccount);
  } else {
    // Local dev uses applicationDefault (reads GOOGLE_APPLICATION_CREDENTIALS from .env)
    credential = admin.credential.applicationDefault();
  }

  admin.initializeApp({ credential });
}

const db = admin.firestore();

/**
 * Get the current crowd density for a specific zone.
 * @param {string} zoneId — e.g. "gate_a", "concession_2"
 * @returns {{ density: number, lastUpdated: string, name: string }}
 */
async function getCrowdDensity(zoneId) {
  const doc = await db.collection("zones").doc(zoneId).get();
  if (!doc.exists) {
    return { density: -1, lastUpdated: null, name: zoneId, error: "Zone not found" };
  }
  const data = doc.data();
  return {
    density: data.density ?? 0,
    lastUpdated: data.lastUpdated?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
    name: data.name ?? zoneId,
    type: data.type ?? "unknown",
  };
}

/**
 * Compute the estimated wait time for a facility zone.
 * Simple formula: density × 0.12 → minutes (clamped 0–15).
 * @param {string} facilityId — e.g. "concession_1", "restroom_2"
 * @returns {{ waitMinutes: number, density: number, name: string }}
 */
async function getWaitTime(facilityId) {
  const doc = await db.collection("zones").doc(facilityId).get();
  if (!doc.exists) {
    return { waitMinutes: -1, density: -1, name: facilityId, error: "Facility not found" };
  }
  const data = doc.data();
  const density = data.density ?? 0;
  const waitMinutes = Math.min(15, Math.round(density * 0.12));
  return {
    waitMinutes,
    density,
    name: data.name ?? facilityId,
    type: data.type ?? "unknown",
  };
}

/**
 * Get all zones with current density data.
 * @returns {Array<{ id: string, name: string, density: number, type: string, ... }>}
 */
async function getAllZones() {
  const snapshot = await db.collection("zones").get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    lastUpdated: doc.data().lastUpdated?.toDate?.()?.toISOString?.() ?? null,
  }));
}

module.exports = { getCrowdDensity, getWaitTime, getAllZones, db };
