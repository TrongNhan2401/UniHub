import React, { useEffect, useState } from "react";
import { UserPlus, Search, Shield, Mail, Calendar, RefreshCw, MoreVertical, Trash2, Key } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { checkinService } from "@/services/adminService";

export default function StaffManagementPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadStaff = async () => {
    setLoading(true);
    try {
      const { data } = await checkinService.getAllStaff({ pageNumber: 1, pageSize: 50 });
      setStaff(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await checkinService.createStaff(formData);
      setIsModalOpen(false);
      setFormData({ fullName: "", email: "", password: "" });
      loadStaff();
    } catch (err) {
      setError(err.response?.data?.detail || "Không thể tạo tài khoản staff.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell activeTop="Quản lý Staff">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Quản lý Staff Check-in</h1>
          <p className="mt-2 text-slate-500 max-w-2xl text-lg">
            Tạo và quản lý tài khoản cho nhân viên hỗ trợ check-in tại các workshop.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]"
        >
          <UserPlus className="h-4 w-4" />
          Thêm Staff mới
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-6 py-4">Họ và tên</th>
                <th className="px-6 py-4">Email / Tài khoản</th>
                <th className="px-6 py-4">Ngày tạo</th>
                <th className="px-6 py-4">Vai trò</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto h-8 w-8 animate-spin opacity-20 mb-3" />
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                    Chưa có tài khoản staff nào.
                  </td>
                </tr>
              ) : (
                staff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                          {s.full_name?.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-700">{s.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 opacity-40" />
                        {s.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 opacity-40" />
                        {new Date(s.created_at).toLocaleDateString("vi-VN")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-tight text-blue-600">
                        <Shield className="h-2.5 w-2.5" />
                        Check-in Staff
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40 animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-slate-900">Tạo Staff mới</h2>
            <p className="mt-2 text-sm text-slate-500">Cấp quyền truy cập hệ thống check-in cho nhân viên.</p>

            <form onSubmit={handleCreate} className="mt-8 space-y-5">
              {error && (
                <div className="rounded-xl bg-rose-50 p-4 text-xs font-bold text-rose-600 border border-rose-100 italic">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Họ và tên</label>
                <input
                  required
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium transition-all focus:border-slate-900 focus:bg-white focus:ring-0"
                  placeholder="VD: Nguyễn Văn A"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email / Username</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium transition-all focus:border-slate-900 focus:bg-white focus:ring-0"
                  placeholder="staff@unihub.edu.vn"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mật khẩu ban đầu</label>
                <input
                  required
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium transition-all focus:border-slate-900 focus:bg-white focus:ring-0"
                  placeholder="••••••••"
                />
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-2xl border border-slate-200 py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-800 disabled:opacity-50"
                >
                  {submitting ? "Đang xử lý..." : "Xác nhận tạo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
