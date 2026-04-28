import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Bell, CircleHelp, Grid2x2, Compass, CalendarDays, Award, Settings, LogOut, User, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const sideItems = [
  { label: "Dashboard", icon: Grid2x2, to: "/" },
  { label: "Danh sách workshops", icon: Compass, to: "/workshops" },
  { label: "Lịch trình", icon: CalendarDays, to: "/calendar" },
];

export default function AdminShell({ children, activeTop = "Quản lý Workshop" }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="hidden w-60 flex-col border-r bg-white lg:flex">
        <div className="px-5 py-5">
          <p className="text-xl font-bold tracking-tight text-slate-900">UniHub Admin</p>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cổng Quản trị</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {sideItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                {Icon && <Icon className={`h-4 w-4 ${Icon === Compass ? "stroke-[2.5px]" : ""}`} />}
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <p className="text-2xl font-black text-blue-600 tracking-tighter">UniHub</p>
              <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block" />
              <p className="text-sm font-bold text-slate-500 hidden sm:block">{activeTop}</p>
            </div>

            <div className="relative">
              {/* User Avatar Button */}
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center gap-2 rounded-full p-1 pr-3 transition-all hover:bg-slate-100 active:scale-95 ${isUserMenuOpen ? "bg-slate-100 ring-4 ring-slate-100" : ""}`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 shadow-sm border border-white">
                  <User className="h-5 w-5 text-slate-600" />
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight">Admin User</p>
                  <p className="text-[10px] font-medium text-slate-500 uppercase leading-tight">Quản trị viên</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isUserMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-200 z-20">
                    <div className="px-3 py-2 mb-2 border-b border-slate-50">
                      <p className="text-sm font-bold text-slate-900">Admin Account</p>
                      <p className="text-xs text-slate-500 truncate">admin@unihub.edu.vn</p>
                    </div>

                    <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                      <Settings className="h-4 w-4 text-slate-400" />
                      Cài đặt tài khoản
                    </button>

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors mt-1"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
