import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Bell, CircleHelp, Grid2x2, Compass, CalendarDays, Award, Settings, LogOut, User } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const sideItems = [
  { label: "Dashboard", icon: Grid2x2, to: "/" },
  { label: "Explore", icon: Compass, to: "/workshops" },
  { label: "My Schedule", icon: CalendarDays, to: "/registrations" },
  { label: "Certificates", icon: Award, to: "/registrations" },
  { label: "AI Portal", icon: null, to: "/ai-summary", isAI: true },
];

const topItems = [
  { label: "Browse", to: "/workshops" },
  { label: "My Workshops", to: "/" },
  { label: "Calendar", to: "/registrations" },
];

export default function AdminShell({ children, activeTop = "My Workshops" }) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      {/* Sidebar */}
      <aside className="hidden w-60 flex-col border-r bg-white lg:flex">
        <div className="px-5 py-5">
          <p className="text-xl font-bold">UniHub Student</p>
          <p className="text-xs text-slate-500">Academic Portal</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {sideItems.map((item) => {
            if (item.isAI) {
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"}`
                  }
                >
                  <span className="flex items-center gap-1 rounded bg-blue-600 px-1.5 py-0.5 text-xs font-bold text-white">
                    _AUTO
                  </span>
                  <span className="font-semibold text-blue-700">AI Portal</span>
                </NavLink>
              );
            }
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"}`
                }
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t p-3 space-y-1">
          <button className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
            + Register New
          </button>
          <button className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100">
            <Settings className="h-4 w-4" /> Settings
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
          <div className="flex h-14 items-center gap-4 px-6">
            <p className="text-xl font-extrabold text-blue-600">UniHub</p>
            <nav className="hidden gap-6 md:flex">
              {topItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={`text-sm ${item.label === activeTop ? "border-b-2 border-blue-600 pb-1 font-semibold text-blue-600" : "text-slate-600 hover:text-slate-900"}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <button className="text-slate-500">
                <Bell className="h-4 w-4" />
              </button>
              <button className="text-slate-500">
                <CircleHelp className="h-4 w-4" />
              </button>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200">
                <User className="h-4 w-4 text-slate-600" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
