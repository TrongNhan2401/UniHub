import React from "react";
import { NavLink } from "react-router-dom";
import { LogOut, Search, User } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import NotificationBell from "@/components/NotificationBell";

const topItems = [
  { label: "Khám phá", to: "/" },
  { label: "Vé của tôi", to: "/my-registrations" },
];

const footerColumns = [
  {
    title: "NỀN TẢNG",
    items: ["Tìm workshop", "Trở thành diễn giả", "Đối tác trường học"],
  },
  {
    title: "TÀI NGUYÊN",
    items: ["Lộ trình học", "Lịch sự kiện", "Chứng chỉ"],
  },
  {
    title: "HỖ TRỢ",
    items: ["Trung tâm trợ giúp", "Điều khoản sử dụng", "Chính sách riêng tư"],
  },
];

export default function StudentShell({ children, activeTop = "Khám phá" }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-[#f4f2fb] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-[#f4f2fb]/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center gap-4 px-4 lg:px-6">
          <p className="text-3xl font-extrabold tracking-tight text-blue-600">UniHub</p>
          <nav className="hidden gap-7 md:flex">
            {topItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={`text-sm transition-colors ${
                  item.label === activeTop
                    ? "border-b-2 border-blue-600 pb-1 font-semibold text-blue-600"
                    : "text-slate-700 hover:text-blue-600"
                }`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 md:flex">
            <Search className="h-4 w-4 text-slate-400" />
            <input className="w-[220px] bg-transparent text-sm outline-none" placeholder="Tìm workshop, diễn giả..." />
          </div>
          <NotificationBell />
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <User className="h-4 w-4" />
          </div>
          <p className="hidden text-sm font-medium text-slate-700 lg:block">{user?.name || "Sinh viên"}</p>
          <button
            onClick={logout}
            className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600 md:flex"
          >
            <LogOut className="h-3.5 w-3.5" />
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1240px] px-4 py-6 lg:px-6">{children}</main>

      <footer className="mt-16 border-t border-slate-200 bg-[#ebe8f5]">
        <div className="mx-auto grid w-full max-w-[1240px] gap-8 px-4 py-10 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-6">
          <div>
            <p className="text-2xl font-bold text-blue-700">UniHub</p>
            <p className="mt-3 max-w-xs text-sm text-slate-600">
              Nền tảng kết nối sinh viên với workshop thực hành, tăng tốc kỹ năng nghề nghiệp.
            </p>
          </div>
          {footerColumns.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-bold tracking-[0.2em] text-slate-500">{group.title}</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
