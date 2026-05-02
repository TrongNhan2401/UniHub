import React from "react";
import { CalendarDays, CheckCircle2, Eye } from "lucide-react";
import { Link } from "react-router-dom";

export default function SuccessModal({ open, onClose, workshop }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <h3 className="text-center text-4xl font-bold">Dang ky thanh cong</h3>
        <p className="mx-auto mt-4 max-w-md text-center text-slate-600">
          Ban da dang ky workshop <span className="font-semibold text-blue-700">{workshop?.title || ""}</span>. He thong
          da gui thong bao xac nhan qua app va email.
        </p>

        <div className="mt-6 rounded-xl bg-slate-100 p-4">
          <p className="text-xs uppercase tracking-widest text-slate-500">Thong tin workshop</p>
          <p className="mt-2 font-semibold">
            {workshop?.dateLabel} · {workshop?.timeLabel}
          </p>
          <p className="text-sm text-slate-600">{workshop?.room}</p>
        </div>

        <div className="mt-6 space-y-3">
          <Link
            to="/my-registrations"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white"
          >
            <Eye className="h-4 w-4" />
            Xem dang ky cua toi
          </Link>
          <button
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-lg border py-3 font-semibold text-blue-700"
          >
            <CalendarDays className="h-4 w-4" />
            Dong
          </button>
        </div>
      </div>
    </div>
  );
}
