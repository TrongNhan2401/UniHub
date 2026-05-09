import React, { useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { authService } from "@/services/adminService";
import { CheckCircle2, Lock, Mail, QrCode, RefreshCw, Search, Users } from "lucide-react";

const STORAGE_KEY = "unihub_admin_checkin_staff";

const initialStaff = [
  {
    id: "seed-checkin-01",
    fullName: "Check-in Staff (Seed)",
    email: "checkin.seed@unihub.local",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
];

function loadStaffFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialStaff;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return initialStaff;
    return parsed;
  } catch {
    return initialStaff;
  }
}

function saveStaffToStorage(staff) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(staff));
}

export default function CheckinStaffPage() {
  const [staffList, setStaffList] = useState(() => loadStaffFromStorage());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const filteredStaff = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staffList;
    return staffList.filter((s) => s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  }, [staffList, query]);

  const activeCount = useMemo(() => staffList.filter((s) => s.status === "ACTIVE").length, [staffList]);

  const persistAndSet = (next) => {
    setStaffList(next);
    saveStaffToStorage(next);
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      await authService.createCheckinStaff({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
      });

      const newStaff = {
        id: crypto.randomUUID(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };

      const next = [newStaff, ...staffList];
      persistAndSet(next);
      setMessage("Tạo tài khoản staff check-in thành công.");
      setForm({ fullName: "", email: "", password: "" });
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        "Không thể tạo tài khoản staff check-in.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = (id) => {
    const next = staffList.map((s) => {
      if (s.id !== id) return s;
      return {
        ...s,
        status: s.status === "ACTIVE" ? "DISABLED" : "ACTIVE",
      };
    });
    persistAndSet(next);
  };

  return (
    <AdminShell activeTop="Quản lý staff check-in">
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Quản lý staff check-in</h1>
          <p className="mt-1 text-slate-500">
            Tạo tài khoản riêng cho nhân sự check-in và quản lý trạng thái hoạt động.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            icon={<Users className="h-5 w-5 text-blue-700" />}
            label="Tổng staff"
            value={String(staffList.length)}
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-700" />}
            label="Đang hoạt động"
            value={String(activeCount)}
          />
          <StatCard icon={<QrCode className="h-5 w-5 text-blue-700" />} label="Role" value="CHECKIN_STAFF" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Tạo tài khoản staff check-in</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tài khoản này đăng nhập mobile check-in, tách biệt với tài khoản STUDENT.
            </p>

            <form className="mt-5 space-y-4" onSubmit={handleCreateStaff}>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Họ và tên</label>
                <div className="relative">
                  <Users className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    required
                    value={form.fullName}
                    onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 pl-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Nguyen Van A"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email đăng nhập</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 pl-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="checkin.staff@unihub.edu.vn"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Mật khẩu tạm</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 pl-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="ToiThieu8KyTu"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                {loading ? "Đang tạo..." : "Tạo tài khoản check-in"}
              </button>
            </form>

            {message ? (
              <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {message}
              </p>
            ) : null}
            {error ? (
              <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Danh sách staff check-in</h2>
              <div className="flex w-full max-w-xs items-center rounded-lg border border-slate-200 bg-white px-3 py-2">
                <Search className="mr-2 h-4 w-4 text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="Tìm theo tên hoặc email"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold">STAFF</th>
                    <th className="px-4 py-3 text-xs font-semibold">EMAIL</th>
                    <th className="px-4 py-3 text-xs font-semibold">TRẠNG THÁI</th>
                    <th className="px-4 py-3 text-xs font-semibold">NGÀY TẠO</th>
                    <th className="px-4 py-3 text-xs font-semibold">HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((staff) => {
                    const isActive = staff.status === "ACTIVE";
                    return (
                      <tr key={staff.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">{staff.fullName}</td>
                        <td className="px-4 py-3 text-slate-600">{staff.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {isActive ? "Đang hoạt động" : "Đã khóa"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(staff.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleStatus(staff.id)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                              isActive
                                ? "border border-rose-200 text-rose-600 hover:bg-rose-50"
                                : "border border-blue-200 text-blue-700 hover:bg-blue-50"
                            }`}
                          >
                            {isActive ? "Khóa tài khoản" : "Mở lại"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                        Không có staff nào phù hợp bộ lọc.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <div className="rounded-lg bg-blue-50 p-2">{icon}</div>
      </div>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
