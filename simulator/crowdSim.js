/**
 * crowdSim.js — IoT Crowd Data Simulator
 *
 * Writes synthetic but realistic crowd density data to Firestore
 * every 30 seconds for 12 stadium zones. Simulates real sensor feeds
 * from turnstiles, cameras, and BLE beacons.
 *
 * Features:
 *   - Random walk: density adjusts by ±5–15 (clamped 0–100)
 *   - Correlated zones: high gate density → nearby concessions trend up
 *   - Alert generation: zones above 80% trigger alert documents
 *
 * Usage:
 *   node crowdSim.js
 *
 * In production, this would be triggered by Cloud Scheduler every 30s.
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const admin = require("firebase-admin");

// ── Initialise Firebase Admin ──
if (!admin.apps.length) {
  let credential;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    credential = admin.credential.cert(serviceAccount);
  } else {
    credential = admin.credential.applicationDefault();
  }
  admin.initializeApp({ credential });
}

const db = admin.firestore();

// ── Zone Definitions ──
// Each zone has a base range for realistic density distribution.
// lat/lng are fictional positions around a stadium at ~37.4035, -121.9693
const ZONES = [
  { id: "gate_a",        name: "Gate A",        type: "gate",       baseMin: 20, baseMax: 60, lat: 37.4038, lng: -121.9693 },
  { id: "gate_b",        name: "Gate B",        type: "gate",       baseMin: 15, baseMax: 50, lat: 37.4032, lng: -121.9688 },
  { id: "gate_c",        name: "Gate C",        type: "gate",       baseMin: 30, baseMax: 85, lat: 37.4027, lng: -121.9693 },
  { id: "gate_d",        name: "Gate D",        type: "gate",       baseMin: 10, baseMax: 45, lat: 37.4032, lng: -121.9700 },
  { id: "concession_1",  name: "Concessions 1", type: "concession", baseMin: 40, baseMax: 75, lat: 37.4036, lng: -121.9690 },
  { id: "concession_2",  name: "Concessions 2", type: "concession", baseMin: 50, baseMax: 95, lat: 37.4031, lng: -121.9689 },
  { id: "concession_3",  name: "Concessions 3", type: "concession", baseMin: 25, baseMax: 60, lat: 37.4029, lng: -121.9690 },
  { id: "concession_4",  name: "Concessions 4", type: "concession", baseMin: 30, baseMax: 70, lat: 37.4031, lng: -121.9698 },
  { id: "restroom_1",    name: "Restroom 1",    type: "restroom",   baseMin: 45, baseMax: 90, lat: 37.4036, lng: -121.9689 },
  { id: "restroom_2",    name: "Restroom 2",    type: "restroom",   baseMin: 20, baseMax: 55, lat: 37.4029, lng: -121.9696 },
  { id: "main_stand",    name: "Main Stand",    type: "seating",    baseMin: 60, baseMax: 95, lat: 37.4032, lng: -121.9694 },
  { id: "exit_corridor", name: "Exit Corridor", type: "corridor",   baseMin: 10, baseMax: 40, lat: 37.4032, lng: -121.9701 },
];

const DENSITY_THRESHOLD = 80;
const UPDATE_INTERVAL_MS = 30_000; // 30 seconds

// ── Current densities (mutable state for random walk) ──
const currentDensities = {};

/**
 * Initialise densities to random values within base range.
 */
function initDensities() {
  for (const zone of ZONES) {
    currentDensities[zone.id] = randomInRange(zone.baseMin, zone.baseMax);
  }
}

/**
 * Random integer in [min, max].
 */
function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Clamp a value between min and max.
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Apply a random walk to all densities with zone correlations.
 */
function updateDensities() {
  for (const zone of ZONES) {
    // Random walk: ±5 to ±15
    const delta = randomInRange(-15, 15);
    let newDensity = currentDensities[zone.id] + delta;

    // Bias towards base range (mean reversion)
    const baseMid = (zone.baseMin + zone.baseMax) / 2;
    const pull = (baseMid - newDensity) * 0.1;
    newDensity += pull;

    currentDensities[zone.id] = clamp(Math.round(newDensity), 0, 100);
  }

  // Correlation: if a gate is high, nearby concessions trend 5-10% higher
  const gateAvg =
    (currentDensities.gate_a + currentDensities.gate_b +
     currentDensities.gate_c + currentDensities.gate_d) / 4;

  if (gateAvg > 60) {
    const boost = Math.round((gateAvg - 60) * 0.15);
    for (const id of ["concession_1", "concession_2", "concession_3", "concession_4"]) {
      currentDensities[id] = clamp(currentDensities[id] + boost, 0, 100);
    }
  }
}

/**
 * Write all zone densities to Firestore and generate alerts.
 */
async function writeToFirestore() {
  const batch = db.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const zonesForAlerts = [];

  for (const zone of ZONES) {
    const density = currentDensities[zone.id];
    const ref = db.collection("zones").doc(zone.id);

    batch.set(
      ref,
      {
        name: zone.name,
        type: zone.type,
        density,
        lat: zone.lat,
        lng: zone.lng,
        lastUpdated: now,
      },
      { merge: true }
    );

    zonesForAlerts.push({ id: zone.id, name: zone.name, type: zone.type, density });
  }

  await batch.commit();

  // Generate alerts for zones over threshold
  await generateAlerts(zonesForAlerts);

  // Log summary
  const highZones = zonesForAlerts.filter((z) => z.density >= DENSITY_THRESHOLD);
  const summary = ZONES.map((z) => `${z.name}: ${currentDensities[z.id]}%`).join(" | ");
  console.log(`[sim] ${new Date().toLocaleTimeString()} — ${summary}`);
  if (highZones.length > 0) {
    console.log(
      `[sim] ⚠️  High density: ${highZones.map((z) => `${z.name} (${z.density}%)`).join(", ")}`
    );
  }
}

/**
 * Create alert documents for zones exceeding threshold.
 */
async function generateAlerts(zones) {
  const zonesByType = {};
  for (const z of zones) {
    if (!zonesByType[z.type]) zonesByType[z.type] = [];
    zonesByType[z.type].push(z);
  }

  const batch = db.batch();
  let count = 0;

  for (const zone of zones) {
    if (zone.density >= DENSITY_THRESHOLD) {
      const alternatives = (zonesByType[zone.type] || [])
        .filter((z) => z.id !== zone.id)
        .sort((a, b) => a.density - b.density);

      const best = alternatives[0];
      const suggestion = best
        ? `try ${best.name} instead (${best.density}% capacity)`
        : "consider waiting a few minutes";

      const ref = db.collection("alerts").doc();
      batch.set(ref, {
        zoneId: zone.id,
        zoneName: zone.name,
        density: zone.density,
        message: `${zone.name} is getting crowded (${zone.density}%) — ${suggestion}.`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        resolved: false,
      });
      count++;
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  // Clean up alerts older than 5 minutes
  const cutoff = new Date(Date.now() - 5 * 60 * 1000);
  const old = await db.collection("alerts").where("createdAt", "<", cutoff).get();
  if (!old.empty) {
    const cleanBatch = db.batch();
    old.docs.forEach((doc) => cleanBatch.delete(doc.ref));
    await cleanBatch.commit();
  }
}

// ── Main Loop ──
async function main() {
  console.log("\n  🏟️  ArenaIQ IoT Simulator");
  console.log(`     Writing to Firestore every ${UPDATE_INTERVAL_MS / 1000}s for ${ZONES.length} zones\n`);

  initDensities();

  // Initial write
  await writeToFirestore();

  // Schedule updates
  setInterval(async () => {
    updateDensities();
    try {
      await writeToFirestore();
    } catch (err) {
      console.error("[sim] Firestore write error:", err.message);
    }
  }, UPDATE_INTERVAL_MS);
}

main().catch((err) => {
  console.error("[sim] Fatal:", err);
  process.exit(1);
});

// —— Create a dummy web server for Render ——
// Render requires a "Web Service" to listen to a PORT, otherwise it kills the process.
const http = require("http");
// Local dev loads root .env where PORT=3001 (backend), so don't reuse it here.
// On Render, PORT is injected by the platform and must be used.
const isRender = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);
const PORT = isRender
  ? Number(process.env.PORT)
  : Number(process.env.SIMULATOR_PORT || 3002);

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("ArenaIQ Simulator is running!\n");
});

server.listen(PORT, () => {
  console.log(`[sim] Dummy web server listening on port ${PORT} to keep Render happy.`);
});
