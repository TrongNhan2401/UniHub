import React, { useEffect, useState } from "react";
import { Upload, RefreshCw, FileText, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { syncService } from "@/services/adminService";

const statusMap = {
  0: { label: "Đang chờ", icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-100" },
  "Pending": { label: "Đang chờ", icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-100" },

  1: { label: "Đã lọc", icon: RefreshCw, color: "text-blue-600 bg-blue-50 border-blue-100 animate-spin-slow" },
  "Filtered": { label: "Đang lọc", icon: RefreshCw, color: "text-blue-600 bg-blue-50 border-blue-100 animate-spin-slow" },

  2: { label: "Đã đồng bộ", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
  "Synchronized": { label: "Đã đồng bộ", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },

  3: { label: "Thất bại", icon: XCircle, color: "text-rose-600 bg-rose-50 border-rose-100" },
  "Failed": { label: "Thất bại", icon: XCircle, color: "text-rose-600 bg-rose-50 border-rose-100" },
};

function toDateTimeLabel(value) {
  if (!value) return "-";
  const d = new Date(value);
  return d.toLocaleString("vi-VN");
}

export default function StudentSyncPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadTasks = async () => {
    try {
      const { data } = await syncService.getTasks();
      setTasks(data || []);
    } catch (err) {
      // Background error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 5000); // Polling every 5s for better responsiveness
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setError("Chỉ chấp nhận file CSV.");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);

    setUploading(true);
    setError("");
    setMessage("");

    try {
      await syncService.uploadCsv(fd);
      setMessage("Tải file lên thành công. Hệ thống đang bắt đầu xử lý.");
      loadTasks();
    } catch (err) {
      setError(err?.response?.data?.detail || "Tải file lên thất bại.");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  return (
    <AdminShell activeTop="Đồng bộ dữ liệu">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Đồng bộ dữ liệu sinh viên</h1>
        <p className="mt-2 text-slate-500 max-w-2xl text-lg">
          Nhập dữ liệu sinh viên từ hệ thống quản lý của trường qua file CSV để xác thực người dùng.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {error && (
            <div className="flex items-center gap-3 rounded-2xl bg-rose-50 p-4 text-rose-700 border border-rose-100 shadow-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}
          {message && (
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-700 border border-emerald-100 shadow-sm">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <p className="text-sm font-semibold">{message}</p>
            </div>
          )}

          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <h3 className="font-bold text-slate-800">Lịch sử đồng bộ</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Tổng số hàng</th>
                    <th className="px-6 py-4 text-emerald-600">Chuẩn</th>
                    <th className="px-6 py-4 text-rose-600">Lỗi</th>
                    <th className="px-6 py-4">Ngày tạo</th>
                    <th className="px-6 py-4">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && tasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        <RefreshCw className="mx-auto h-8 w-8 animate-spin opacity-20 mb-3" />
                        Đang tải danh sách tác vụ...
                      </td>
                    </tr>
                  ) : tasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                        Chưa có tác vụ đồng bộ nào được thực hiện.
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => {
                      const status = statusMap[task.syncState] || statusMap.Pending;
                      const Icon = status.icon;
                      return (
                        <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${status.color}`}>
                              <Icon className="h-3 w-3" />
                              {status.label}
                            </span>
                            {task.errorMessage && (
                              <p className="mt-1 text-[10px] text-rose-500 font-medium max-w-[150px] truncate" title={task.errorMessage}>
                                {task.errorMessage}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-700">
                            {task.totalRows || 0}
                          </td>
                          <td className="px-6 py-4 text-emerald-600 font-black">
                            {task.successCount || 0}
                          </td>
                          <td className="px-6 py-4 text-rose-600 font-black">
                            {task.errorCount || 0}
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-medium">
                            {toDateTimeLabel(task.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {task.successUrl && (
                                <a
                                  href={task.successUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-bold text-emerald-600 hover:underline"
                                >
                                  Tải Success CSV
                                </a>
                              )}
                              {task.errorUrl && (
                                <a
                                  href={task.errorUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-bold text-rose-600 hover:underline"
                                >
                                  Tải Error CSV
                                </a>
                              )}
                              {!task.successUrl && !task.errorUrl && (
                                <span className="text-xs text-slate-300 italic">No reports</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-6 shadow-sm">
            <h3 className="mb-2 font-bold text-blue-900">Tải lên dữ liệu mới</h3>
            <p className="mb-6 text-sm text-blue-700/80 leading-relaxed">
              Hệ thống sẽ tự động xử lý file CSV và cập nhật thông tin sinh viên vào cơ sở dữ liệu.
              <strong> Lưu ý:</strong> File phải đúng định dạng CSV chuẩn.
            </p>

            <label className={`group flex h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-white transition-all hover:border-blue-400 hover:bg-blue-50 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="rounded-full bg-blue-100 p-4 text-blue-600 transition-transform group-hover:scale-110">
                {uploading ? <RefreshCw className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8" />}
              </div>
              <p className="mt-4 text-sm font-bold text-slate-600">
                {uploading ? "Đang tải lên..." : "Nhấp để chọn file CSV"}
              </p>
              <p className="mt-1 text-[11px] font-medium text-slate-400">Dung lượng tối đa: 10MB</p>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" /> Hướng dẫn
            </h3>
            <ul className="space-y-3 text-sm text-slate-500">
              <li className="flex gap-2">
                <span className="font-bold text-slate-900">1.</span>
                Xuất file CSV từ hệ thống cũ của trường.
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-slate-900">2.</span>
                Đảm bảo các cột: Email, FullName, StudentId, DateOfBirth...
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-slate-900">3.</span>
                Hệ thống sẽ bỏ qua các sinh viên đã tồn tại.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
