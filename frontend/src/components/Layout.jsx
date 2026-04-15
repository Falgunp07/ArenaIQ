/**
 * Layout.jsx — Shared layout wrapper
 *
 * Wraps all pages with Navbar and main content area.
 */

import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-stadium-dark">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
