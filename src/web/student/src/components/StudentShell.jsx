import React from "react";
import { NavLink } from "react-router-dom";
import { Bell, CircleHelp, Compass, Grid2x2, Award, CalendarDays, Settings, LogOut, Search, User } from "lucide-react";

const sideItems = [
  { label: "Dashboard", icon: Grid2x2, to: "/" },
  { label: "Explore", icon: Compass, to: "/" },
  { label: "My Schedule", icon: CalendarDays, to: "/my-registrations" },
  { label: "Certificates", icon: Award, to: "/my-registrations" },
];

const topItems = [
  { label: "Browse", to: "/" },
  { label: "My Workshops", to: "/my-registrations" },
  { label: "Calendar", to: "/my-registrations" },
];

export default function StudentShell({ children, activeTop = "Browse" }) {
  const activeSide = activeTop === "My Workshops" ? "My Schedule" : "Explore";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 border-r bg-white lg:flex lg:flex-col">
          <div className="px-6 py-6">
            <p className="text-2xl font-bold text-blue-600">UniHub Student</p>
            <p className="text-sm text-slate-500">Academic Portal</p>
          </div>

          <nav className="flex-1 px-3">
            {sideItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    `mb-1 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
                      isActive || item.label === activeSide
                        ? "border-l-4 border-blue-600 bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-100"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t p-3">
            <button className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white">
              + Register New
            </button>
            <button className="mb-1 flex w-full items-center gap-2 rounded-lg px-4 py-3 text-sm text-slate-600 hover:bg-slate-100">
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-sm text-slate-600 hover:bg-slate-100">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1">
          <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 lg:px-8">
              <p className="text-xl font-extrabold text-blue-600">UniHub</p>
              <nav className="hidden gap-6 md:flex">
                {topItems.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    className={`text-sm ${
                      item.label === activeTop
                        ? "border-b-2 border-blue-600 pb-1 font-semibold text-blue-600"
                        : "text-slate-600"
                    }`}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="ml-auto hidden items-center rounded-full border bg-slate-50 px-3 py-2 md:flex md:w-[320px]">
                <Search className="mr-2 h-4 w-4 text-slate-400" />
                <input className="w-full bg-transparent text-sm outline-none" placeholder="Search workshops..." />
              </div>
              <button className="p-2 text-slate-600">
                <Bell className="h-4 w-4" />
              </button>
              <button className="p-2 text-slate-600">
                <CircleHelp className="h-4 w-4" />
              </button>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <User className="h-4 w-4" />
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
