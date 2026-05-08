import React, { useState } from "react";
import { Mail, Send, CheckCircle2, AlertCircle, Loader2, Info } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { notificationService } from "@/services/adminService";

export default function NotificationSettingsPage() {
  const [toEmail, setToEmail] = useState("");
  const [toName, setToName] = useState("");
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
  const [message, setMessage] = useState("");

  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!toEmail || status === "loading") return;

    setStatus("loading");
    setMessage("");

    try {
      const { data } = await notificationService.sendTestEmail(toEmail, toName || undefined);
      setStatus("success");
      setMessage(data?.message || `Email đã gửi tới ${toEmail}.`);
    } catch (err) {
      setStatus("error");
      const detail = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Gửi thất bại.";
      setMessage(detail);
    }
  };

  return (
    <AdminShell activeTop="Cài đặt Thông báo">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cài đặt Thông báo</h1>
          <p className="mt-1 text-sm text-slate-500">Kiểm tra cấu hình email SMTP và gửi thử thông báo.</p>
        </div>

        {/* Info box */}
        <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold">Hệ thống tự động gửi email khi:</p>
            <ul className="mt-1 list-disc pl-4 space-y-1 text-blue-700">
              <li>
                Sinh viên đăng ký workshop <strong>miễn phí</strong> thành công
              </li>
              <li>
                Thanh toán PayOS được <strong>xác nhận</strong> thành công
              </li>
            </ul>
            <p className="mt-2">Dùng form bên dưới để kiểm tra cấu hình SMTP đang hoạt động đúng không.</p>
          </div>
        </div>

        {/* Test email form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Gửi Email Thử Nghiệm</p>
              <p className="text-xs text-slate-500">Kiểm tra kết nối SMTP Gmail</p>
            </div>
          </div>

          <form onSubmit={handleSendTest} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Địa chỉ email nhận <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Tên người nhận <span className="text-slate-400 font-normal">(tùy chọn)</span>
              </label>
              <input
                type="text"
                value={toName}
                onChange={(e) => setToName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={!toEmail || status === "loading"}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Gửi email thử
                </>
              )}
            </button>
          </form>

          {/* Result */}
          {status === "success" && (
            <div className="mt-4 flex gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-sm text-emerald-800">{message}</p>
            </div>
          )}
          {status === "error" && (
            <div className="mt-4 flex gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <div className="text-sm text-rose-800">
                <p className="font-semibold">Gửi thất bại</p>
                <p className="mt-0.5">{message}</p>
                <p className="mt-1 text-xs text-rose-600">
                  Kiểm tra lại cấu hình <code className="rounded bg-rose-100 px-1">Email:Password</code> trong User
                  Secrets.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Config hint */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Cấu hình User Secrets</p>
          <p className="text-xs text-slate-600 mb-2">
            Chạy lệnh sau trong thư mục <code className="rounded bg-slate-200 px-1">src/Api/Api/</code>:
          </p>
          <pre className="rounded-lg bg-slate-900 text-green-400 text-xs p-4 overflow-x-auto leading-relaxed">{`dotnet user-secrets set "Email:Username" "your_gmail@gmail.com"
dotnet user-secrets set "Email:Password" "xxxx xxxx xxxx xxxx"
dotnet user-secrets set "Email:FromAddress" "your_gmail@gmail.com"`}</pre>
          <p className="mt-3 text-xs text-slate-500">
            Mật khẩu là <strong>App Password 16 ký tự</strong> từ{" "}
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline underline-offset-2"
            >
              myaccount.google.com/apppasswords
            </a>{" "}
            — không phải mật khẩu Google thật.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
