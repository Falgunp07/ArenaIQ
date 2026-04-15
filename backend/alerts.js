/**
 * alerts.js — Smart alert creation logic
 *
 * Checks zone densities and creates alert documents in Firestore
 * when any zone exceeds the 80% threshold, suggesting a less-crowded
 * alternative zone of the same type.
 */

const { db } = require("./crowd");
const admin = require("firebase-admin");

const DENSITY_THRESHOLD = 80;
const ALERT_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Check all zones and create alerts for any above threshold.
 * Each alert suggests the least-crowded alternative of the same type.
 * @param {Array} zones — array of zone objects with { id, name, density, type }
 */
async function checkAndCreateAlerts(zones) {
  const batch = db.batch();
  let alertCount = 0;

  // Group zones by type for alternative suggestions
  const zonesByType = {};
  for (const zone of zones) {
    if (!zonesByType[zone.type]) zonesByType[zone.type] = [];
    zonesByType[zone.type].push(zone);
  }

  for (const zone of zones) {
    if (zone.density >= DENSITY_THRESHOLD) {
      // Find the least-crowded alternative of the same type
      const alternatives = (zonesByType[zone.type] || [])
        .filter((z) => z.id !== zone.id)
        .sort((a, b) => a.density - b.density);

      const best = alternatives[0];
      const suggestion = best
        ? `try ${best.name} instead (${best.density}% capacity)`
        : "consider waiting a few minutes";

      const alertRef = db.collection("alerts").doc();
      batch.set(alertRef, {
        zoneId: zone.id,
        zoneName: zone.name,
        density: zone.density,
        message: `${zone.name} is getting crowded (${zone.density}%) — ${suggestion}.`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        resolved: false,
      });
      alertCount++;
    }
  }

  if (alertCount > 0) {
    await batch.commit();
    console.log(`[alerts] Created ${alertCount} alert(s)`);
  }

  // Clean up old alerts
  await cleanupOldAlerts();
}

/**
 * Remove alerts older than ALERT_TTL_MS to prevent build-up.
 */
async function cleanupOldAlerts() {
  const cutoff = new Date(Date.now() - ALERT_TTL_MS);
  const oldAlerts = await db
    .collection("alerts")
    .where("createdAt", "<", cutoff)
    .get();

  if (oldAlerts.empty) return;

  const batch = db.batch();
  oldAlerts.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`[alerts] Cleaned up ${oldAlerts.size} old alert(s)`);
}

module.exports = { checkAndCreateAlerts, cleanupOldAlerts };
