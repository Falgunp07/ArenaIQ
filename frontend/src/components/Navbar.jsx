/**
 * Navbar.jsx — Shared navigation bar
 *
 * Sticky top nav with ArenaIQ branding, attendee/staff links,
 * and mobile hamburger menu.
 */

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import { MdStadium } from "react-icons/md";
import { RiDashboardLine } from "react-icons/ri";
import { BsChatDots } from "react-icons/bs";

const NAV_LINKS = [
  { to: "/", label: "Stadium", icon: BsChatDots },
  { to: "/staff", label: "Staff Dashboard", icon: RiDashboardLine },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 border-b border-stadium-border"
      style={{ backgroundColor: "rgba(10, 14, 26, 0.85)", backdropFilter: "blur(12px)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center">
              <MdStadium className="text-white text-lg" />
            </div>
            <div>
              <span className="text-lg font-bold text-text-primary tracking-tight">
                Arena<span className="text-accent-cyan">IQ</span>
              </span>
              <span className="hidden sm:inline text-xs text-text-muted ml-2 font-medium">
                Smart Stadium
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.to;
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium no-underline transition-colors ${
                    isActive
                      ? "bg-accent-blue/15 text-accent-blue"
                      : "text-text-secondary hover:text-text-primary hover:bg-stadium-hover"
                  }`}
                >
                  <Icon className="text-base" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Live Indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs text-text-muted">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green" />
            </span>
            Live Data
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-stadium-hover transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <HiOutlineX className="text-xl" /> : <HiOutlineMenu className="text-xl" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-stadium-border overflow-hidden"
            style={{ backgroundColor: "rgba(10, 14, 26, 0.95)" }}
          >
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.map((link) => {
                const isActive = location.pathname === link.to;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium no-underline transition-colors ${
                      isActive
                        ? "bg-accent-blue/15 text-accent-blue"
                        : "text-text-secondary hover:text-text-primary hover:bg-stadium-hover"
                    }`}
                  >
                    <Icon className="text-base" />
                    {link.label}
                  </Link>
                );
              })}
              <div className="flex items-center gap-2 px-4 py-2 text-xs text-text-muted">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green" />
                </span>
                Live Data Active
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
