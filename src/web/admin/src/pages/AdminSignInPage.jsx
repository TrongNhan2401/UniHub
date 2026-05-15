import React, { useState } from "react";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AdminSignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);

  const { signin, verifyOtp, loading: isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    const result = await signin(email, password);
    if (result.success) {
      if (result.requiresTwoFactor) {
        setShowOtp(true);
      } else {
        navigate("/");
      }
    } else {
      alert(result.error);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const result = await verifyOtp(email, otp);
    if (result.success) {
      navigate("/");
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f2fb] p-4">
      <div className="w-full max-w-[440px] space-y-8 rounded-3xl border border-slate-200/80 bg-white p-10 shadow-sm">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <ShieldCheck className="h-9 w-9" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">UniHub Admin</h1>
          <p className="mt-2 text-slate-500">
            {showOtp ? "Enter the 6-digit code sent to your email" : "Sign in to manage workshops and events"}
          </p>
        </div>

        {/* Form */}
        {!showOtp ? (
          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="admin@unihub.edu.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? "Authenticating..." : "Sign In to Portal"}
              {!isLoading && <ArrowRight className="h-5 w-5" />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Authentication Code</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={6}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 text-center text-2xl tracking-widest outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length < 6}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? "Verifying..." : "Verify Code"}
              {!isLoading && <ShieldCheck className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={() => setShowOtp(false)}
              className="mt-2 w-full text-center text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              Back to Sign In
            </button>
          </form>
        )}

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400">
          Strictly for authorized personnel only. <br />
          All access attempts are logged for security purposes.
        </p>
      </div>
    </div>
  );
}
