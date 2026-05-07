import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/workshopService";

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [isSignup, setIsSignup] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [studentId, setStudentId] = React.useState("");
  const [email, setEmail] = React.useState("student@unihub.local");
  const [password, setPassword] = React.useState("Passw0rd!");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const doLogin = async () => {
    const { data } = await authService.login({ email, password });
    const token = data?.accessToken;
    if (!token) {
      throw new Error("Không nhận được access token từ máy chủ.");
    }

    setAuth(token, {
      name: data?.user?.fullName || fullName || "Sinh viên",
      role: data?.user?.role || "STUDENT",
      email: data?.user?.email || email,
    });
    navigate("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isSignup) {
        if (password !== confirmPassword) {
          throw new Error("Mật khẩu xác nhận không khớp.");
        }

        await authService.signup({
          email,
          password,
          fullName: fullName.trim(),
          studentId: studentId.trim() || null,
        });

        setSuccess("Đăng ký thành công. Đang đăng nhập...");
      }

      await doLogin();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || (isSignup ? "Đăng ký thất bại." : "Đăng nhập thất bại."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow">
        <p className="text-2xl font-extrabold text-blue-600">UniHub</p>
        <h1 className="mt-2 text-3xl font-bold">{isSignup ? "Đăng ký tài khoản sinh viên" : "Đăng nhập sinh viên"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isSignup
            ? "Tạo tài khoản để đăng ký workshop và nhận mã QR check-in."
            : "Đăng nhập để xem workshop, đăng ký và lấy mã QR check-in."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isSignup ? (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Họ và tên</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  type="text"
                  required
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Mã sinh viên (không bắt buộc)</label>
                <input
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  type="text"
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-400"
                />
              </div>
            </>
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Mật khẩu</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-400"
            />
          </div>

          {isSignup ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Xác nhận mật khẩu</label>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                required
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-400"
              />
            </div>
          ) : null}

          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          {success ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

          <button
            disabled={loading}
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Đang xử lý..." : isSignup ? "Đăng ký và đăng nhập" : "Đăng nhập"}
          </button>
        </form>

        <button
          onClick={() => {
            setIsSignup((v) => !v);
            setError("");
            setSuccess("");
          }}
          className="mt-3 w-full rounded-lg border py-2.5 font-semibold text-blue-700"
        >
          {isSignup ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}
        </button>
      </div>
    </div>
  );
}
