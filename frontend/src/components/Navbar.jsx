import { createElement, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Activity,
  Bell,
  BellOff,
  Bot,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  X,
} from "lucide-react";
import { useNotificationContext } from "../context/NotificationContext";

const NAV_LINKS = [
  { to: "/", label: "Attendee Assistant", icon: MessageSquareText },
  { to: "/staff", label: "Operations", icon: LayoutDashboard },
];

function NavItems({ onNavigate }) {
  return NAV_LINKS.map(({ to, label, icon }) => (
    <NavLink
      key={to}
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all",
          isActive
            ? "bg-accent-blue/10 text-accent-blue border border-accent-blue/25 shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent",
        ].join(" ")
      }
    >
      {createElement(icon, { className: "h-4 w-4" })}
      <span>{label}</span>
    </NavLink>
  ));
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { notificationsEnabled, toggleNotifications } = useNotificationContext();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue to-accent-cyan text-white shadow-md">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-extrabold tracking-tight text-slate-900">ArenaIQ</p>
            <p className="text-[11px] font-medium text-slate-400">Stadium Intelligence Platform</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <NavItems />
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-2 rounded-full border border-accent-green/25 bg-accent-green/10 px-3 py-1.5 text-xs font-semibold text-accent-green">
            <Activity className="h-3.5 w-3.5" />
            Live Feed
          </div>

          <button
            onClick={toggleNotifications}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-accent-blue/35 hover:text-accent-blue"
            aria-label={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
          >
            {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            <span>{notificationsEnabled ? "Alerts On" : "Alerts Off"}</span>
          </button>
        </div>

        <button
          className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="bg-slate-50 border-t border-slate-200 border-t border-slate-200 px-4 py-4 md:hidden">
          <div className="mx-auto flex max-w-[1320px] flex-col gap-2">
            <NavItems onNavigate={() => setMobileOpen(false)} />

            <button
              onClick={toggleNotifications}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600"
              aria-label={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
            >
              {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              <span>{notificationsEnabled ? "Alerts On" : "Alerts Off"}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
