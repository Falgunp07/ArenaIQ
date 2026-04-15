# 🏟️ ArenaIQ — Smart Stadium Assistant

> AI-powered crowd guidance for large-scale sporting events. Built for the Google Cloud + Gemini hackathon.

![ArenaIQ](https://img.shields.io/badge/ArenaIQ-Smart_Stadium-0a0e1a?style=for-the-badge&labelColor=3b82f6)
![Gemini](https://img.shields.io/badge/Gemini_2.0_Flash-Vertex_AI-4285F4?style=for-the-badge)
![Firebase](https://img.shields.io/badge/Firebase-Firestore_%7C_Auth_%7C_FCM-FFCA28?style=for-the-badge)

---

## 🎯 Vertical

**Large-scale sporting event experience** — crowd movement optimisation, wait-time reduction, and real-time coordination for stadium attendees and operations staff.

---

## 💡 What Is ArenaIQ?

ArenaIQ is a **Progressive Web App (PWA)** that transforms the stadium experience through two interfaces:

### For Attendees — AI Chat Assistant
Chat with a Gemini-powered assistant that answers real-time questions:
- *"Which gate is least crowded right now?"*
- *"How long is the wait at Gate 3 concessions?"*
- *"Guide me to my seat from Section B entrance"*
- *"Notify me when restroom wait drops below 2 min"*
- *"What's the nearest food stall serving vegetarian food?"*

### For Staff — Operations Dashboard
A live dashboard showing:
- Crowd density heatmaps across all zones
- Per-zone status cards with density %, wait times, and red/amber/green indicators
- AI-generated routing suggestions and bottleneck summaries
- Real-time alert flags when zones exceed capacity

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React PWA)                  │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Chat UI  │  │ Crowd Heatmap│  │ Staff Dashboard   │  │
│  └────┬─────┘  └──────┬───────┘  └────────┬─────────┘  │
│       │               │                   │             │
│       │        Firestore Real-Time Listeners            │
└───────┼───────────────┼───────────────────┼─────────────┘
        │               │                   │
   POST /chat     onSnapshot(zones)   onSnapshot(alerts)
        │               │                   │
┌───────┼───────────────┼───────────────────┼─────────────┐
│       ▼               ▼                   ▼             │
│  ┌─────────┐    ┌──────────┐    ┌──────────────┐       │
│  │ Express │    │ Firestore│    │ Alert Engine │       │
│  │ + Gemini│───▶│ (zones)  │◀───│              │       │
│  └─────────┘    └──────────┘    └──────────────┘       │
│       │               ▲                                 │
│       │               │                                 │
│       ▼          ┌────┴─────┐                          │
│  ┌─────────┐    │ IoT Sim  │                          │
│  │ Gemini  │    │ (30s)    │                          │
│  │ 2.0 Flash│    └──────────┘                          │
│  └─────────┘         BACKEND (Node.js / Cloud Run)     │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Chat Assistant** | Gemini 2.0 Flash with function calling. Two declared functions (`get_crowd_density`, `get_wait_time`) query Firestore for live data before responding. |
| 2 | **Live Crowd Map** | Google Maps JS SDK with deck.gl HeatmapLayer overlay. Intensity driven by Firestore real-time listeners updating every 30 seconds. |
| 3 | **IoT Simulator** | Script writing randomised but realistic crowd density data to Firestore for 12 zones every 30 seconds — simulates real sensor feeds. |
| 4 | **Smart Alerts** | When a zone exceeds 80% density, an alert document is created. The frontend renders a banner suggesting an alternative route. |
| 5 | **Staff Dashboard** | Grid of all 12 zones with live status + a Gemini-generated summary card identifying bottlenecks and recommending actions. |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React PWA (Vite), Tailwind CSS v4, Framer Motion |
| Maps | Google Maps JS SDK (`@vis.gl/react-google-maps`) + deck.gl |
| AI | Gemini 2.0 Flash via `@google/genai` SDK |
| Auth | Firebase Authentication (anonymous sessions) |
| Database | Cloud Firestore (real-time document sync) |
| Backend | Node.js / Express (Cloud Run ready) |
| Simulator | Node.js script (Cloud Scheduler in production) |

### Google Services Used
- **Gemini (Vertex AI)** — AI chat assistant with function calling
- **Google Maps Platform** — Indoor venue heatmap visualisation
- **Firebase Auth** — Anonymous user sessions
- **Cloud Firestore** — Real-time crowd density & alert data
- **Firebase Cloud Messaging** — Push notification triggers (production)
- **Cloud Run** — Backend API hosting (production)
- **Cloud Scheduler** — IoT simulator scheduling (production)

---

## 📁 Repository Structure

```
ArenaIQ/
├── README.md
├── .env.example
├── .gitignore
├── firestore.rules
├── frontend/                    # React PWA
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css            # Design system + Tailwind
│       ├── firebase.js          # Firebase client init
│       ├── components/
│       │   ├── ChatInterface.jsx
│       │   ├── CrowdHeatmap.jsx
│       │   ├── DeckGlOverlay.jsx
│       │   ├── WaitTimeBadge.jsx
│       │   ├── AlertBanner.jsx
│       │   ├── StaffDashboard.jsx
│       │   ├── ZoneCard.jsx
│       │   ├── Navbar.jsx
│       │   └── Layout.jsx
│       └── hooks/
│           ├── useRealtimeCrowd.js
│           ├── useAlerts.js
│           └── useChat.js
├── backend/                     # Cloud Run API
│   ├── package.json
│   ├── index.js
│   ├── gemini.js
│   ├── crowd.js
│   ├── alerts.js
│   └── __tests__/
│       ├── crowd.test.js
│       └── gemini.test.js
└── simulator/                   # IoT data simulator
    ├── package.json
    └── crowdSim.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project with Firestore, Auth enabled
- A Gemini API key
- A Google Maps API key (Maps JavaScript API enabled)

### 1. Clone & Configure
```bash
git clone https://github.com/your-username/ArenaIQ.git
cd ArenaIQ
cp .env.example .env
# Fill in your API keys in .env
```

### 2. Start the Backend
```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:3001
```

### 3. Start the IoT Simulator
```bash
cd simulator
npm install
node crowdSim.js
# Writes crowd data to Firestore every 30 seconds
```

### 4. Start the Frontend
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

---

## 📋 Assumptions

1. **Simulated IoT Data** — Crowd density data is generated by a simulator script (Cloud Scheduler in production). A real deployment would use BLE beacons, turnstile counters, or camera-based computer vision.

2. **Static Venue Overlay** — The indoor map is a static SVG overlay on Google Maps. A real deployment would use Google Maps Indoor Maps with a venue partnership.

3. **Anonymous Authentication** — Firebase anonymous sessions are used for attendee identity. A real deployment would tie into the venue's ticketing system (e.g. Ticketmaster SSO).

4. **Function Calling over Fine-Tuning** — Gemini uses function calling with a detailed system prompt encoding venue-specific context, rather than a fine-tuned model. This is more flexible and cost-effective for the demo.

5. **Single-Venue Demo** — The app is configured for a single fictional 60,000-seat arena. Multi-venue support would require a venue registry and dynamic system prompts.

---

## ✅ Evaluation Checklist

| Criterion | How It's Covered |
|-----------|-----------------|
| **Code Quality** | Modular structure, custom hooks for data, clean separation of UI / API / AI layers |
| **Security** | API keys in env vars, Firestore rules restrict writes to backend service account, CORS configured |
| **Efficiency** | Firestore real-time listeners (no polling), Gemini Flash (fast + cost-effective) |
| **Testing** | Jest tests for `get_wait_time` mock and Gemini function call routing |
| **Accessibility** | ARIA roles on chat messages, keyboard-navigable map controls, colour + text for density levels |
| **Google Services** | Maps, Gemini/Vertex AI, Firebase (Auth + Firestore + FCM), Cloud Run, Cloud Scheduler |

---

## 📄 License

MIT
