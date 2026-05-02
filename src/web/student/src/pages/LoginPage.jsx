import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/workshopService";

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = React.useState("student@unihub.local");
  const [password, setPassword] = React.useState("Passw0rd!");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await authService.login({ email, password });
      const token = data?.accessToken;
      if (!token) {
        throw new Error("Khong nhan duoc access token tu server.");
      }

      setAuth(token, {
        name: data?.user?.fullName || "Student",
        role: data?.user?.role || "STUDENT",
        email: data?.user?.email || email,
      });
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Dang nhap that bai.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setAuth("demo-student-token", { name: "Student Demo", role: "STUDENT", email: "demo@unihub.local" });
    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow">
        <p className="text-2xl font-extrabold text-blue-600">UniHub</p>
        <h1 className="mt-2 text-3xl font-bold">Student Login</h1>
        <p className="mt-1 text-sm text-slate-500">Dang nhap de xem workshop, dang ky va lay QR check-in.</p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
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
            <label className="mb-1 block text-sm font-medium text-slate-600">Mat khau</label>
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
            {loading ? "Dang dang nhap..." : "Dang nhap"}
          </button>
        </form>

        <button onClick={handleDemoLogin} className="mt-3 w-full rounded-lg border py-2.5 font-semibold text-blue-700">
          Demo student mode
        </button>
      </div>
    </div>
  );
}
