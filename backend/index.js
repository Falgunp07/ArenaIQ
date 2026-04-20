/**
 * index.js — ArenaIQ Backend Server
 *
 * Express server with three endpoints:
 *   POST /chat       — Gemini AI chat with function calling
 *   GET  /crowd-data — All zone density data (REST fallback)
 *   POST /alerts     — Manual alert trigger endpoint
 *   GET  /health     — Health check
 *   POST /staff-summary — AI-generated bottleneck summary
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { handleChat, generateStaffSummary } = require("./gemini");
const { getAllZones } = require("./crowd");
const { checkAndCreateAlerts } = require("./alerts");

const app = express();
const PORT = process.env.PORT || 3001;

// —— Middleware ——
app.use(helmet()); 
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

// ── Health Check ──
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "arenaiq-backend", timestamp: new Date().toISOString() });
});

// ── POST /chat — AI Chat Assistant ──
app.post("/chat", async (req, res) => {
  try {
    const { message, sessionId, history } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required and must be a string." });
    }

    // Sanitise input (basic XSS prevention)
    const sanitised = message.trim().slice(0, 2000);

    console.log(`[chat] Session ${sessionId || "anonymous"}: "${sanitised.slice(0, 80)}..."`);
    const result = await handleChat(sanitised, history || []);

    res.json({ reply: result.reply, sessionId: sessionId || null });
  } catch (err) {
    console.error("[chat] Error:", err.message);
    const apiError = err.message.includes("PERMISSION_DENIED") || err.message.includes("403")
      ? "API Error: Your Google Gemini API Key has been blocked or denied access."
      : "Failed to process chat message. Please try again.";
    res.status(500).json({ error: apiError });
  }
});

// ── GET /crowd-data — All Zone Data ──
app.get("/crowd-data", async (_req, res) => {
  try {
    const zones = await getAllZones();
    res.json({ zones, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("[crowd-data] Error:", err.message);
    res.status(500).json({ error: "Failed to fetch crowd data." });
  }
});

// ── POST /alerts — Manual Alert Trigger ──
app.post("/alerts", async (req, res) => {
  try {
    const zones = await getAllZones();
    await checkAndCreateAlerts(zones);
    res.json({ success: true, zonesChecked: zones.length });
  } catch (err) {
    console.error("[alerts] Error:", err.message);
    res.status(500).json({ error: "Failed to check alerts." });
  }
});

// ── POST /staff-summary — AI Bottleneck Summary ──
app.post("/staff-summary", async (_req, res) => {
  try {
    const zones = await getAllZones();
    const result = await generateStaffSummary(zones);
    res.json(result);
  } catch (err) {
    console.error("[staff-summary] Error:", err.message);
    res.status(500).json({ error: "Failed to generate summary." });
  }
});

// ── Error Handling Middleware ──
app.use((err, _req, res, _next) => {
  console.error("[server] Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

// ── Start Server ──
app.listen(PORT, () => {
  console.log(`\n  🏟️  ArenaIQ Backend running on http://localhost:${PORT}`);
  console.log(`     Health: http://localhost:${PORT}/health\n`);
});

module.exports = app;
