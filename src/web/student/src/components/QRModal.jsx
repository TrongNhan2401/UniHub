import React from "react";
import { X } from "lucide-react";

export default function QRModal({ open, onClose, workshop }) {
  if (!open || !workshop) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between bg-blue-600 p-4 text-white">
          <div>
            <h3 className="text-2xl font-semibold">Workshop Check-in</h3>
            <p className="text-sm text-blue-100">Scan this code at the venue entrance</p>
          </div>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5 text-center">
          <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-2xl border-2 border-blue-600 bg-slate-100">
            <div className="grid grid-cols-8 gap-1">
              {Array.from({ length: 64 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 w-2 rounded-sm ${idx % 3 === 0 || idx % 5 === 0 ? "bg-slate-900" : "bg-transparent"}`}
                />
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-2xl font-bold">{workshop.title}</h4>
            <p className="mt-1 text-sm text-slate-500">
              Student ID: <span className="font-semibold text-blue-700">{workshop.qrCode}</span>
            </p>
          </div>

          <button className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white">Done</button>
          <button className="text-sm font-medium text-blue-700">Save to Google Wallet</button>
        </div>
      </div>
    </div>
  );
}
