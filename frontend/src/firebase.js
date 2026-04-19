/**
 * firebase.js — Firebase Client SDK Initialisation
 *
 * Initialises Firebase app, Firestore, and anonymous Auth.
 * All config values come from Vite environment variables.
 * Gracefully handles missing configuration for local development.
 */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

let app;
let db;
let auth;

try {
  // Initialise Firebase
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

  // Sign in anonymously (non-blocking)
  signInAnonymously(auth).catch((err) => {
    console.warn("[firebase] Anonymous sign-in failed:", err.message);
  });
} catch (err) {
  console.warn("[firebase] Initialization failed:", err.message);
  console.warn("[firebase] App will run in demo mode without real-time data.");
}

export { db, auth };
export default app;
