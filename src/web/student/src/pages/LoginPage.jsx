import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/workshopService";

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const doLogin = async () => {
    const { data } = await authService.login({ email, password });
    const token = data?.accessToken;
    if (!token) {
      throw new Error("Không nhận được access token từ máy chủ.");
    }

    setAuth(token, {
      name: data?.user?.fullName || "Sinh viên",
      role: data?.user?.role || "STUDENT",
      email: data?.user?.email || email,
    });
    navigate("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await doLogin();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow">
        <p className="text-2xl font-extrabold text-blue-600">UniHub</p>
        <h1 className="mt-2 text-3xl font-bold">Đăng nhập sinh viên</h1>
        <p className="mt-1 text-sm text-slate-500">Đăng nhập để xem workshop, đăng ký và lấy mã QR check-in.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <button
            disabled={loading}
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
