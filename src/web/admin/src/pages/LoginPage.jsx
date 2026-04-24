import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const handleLogin = () => {
    setAuth("demo-admin-token", { name: "Admin Demo", role: "ORGANIZER" });
    navigate("/");
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow">
        <p className="text-2xl font-extrabold text-blue-600">UniHub Admin</p>
        <h1 className="mt-2 text-3xl font-bold">Organizer Login</h1>
        <p className="mt-1 text-sm text-slate-500">Demo mode for UI integration.</p>
        <button onClick={handleLogin} className="mt-6 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white">
          Continue As Demo Admin
        </button>
      </div>
    </div>
  );
}
