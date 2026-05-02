import React, { useState } from "react";
import { CalendarDays, MapPin, Ticket, Search } from "lucide-react";
import StudentShell from "@/components/StudentShell";
import QRModal from "@/components/QRModal";
import { myRegistrations } from "@/data/mockData";

const regStyles = {
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-slate-200 text-slate-700",
};

const payStyles = {
  NOT_REQUIRED: "bg-blue-100 text-blue-700",
  PENDING: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-rose-100 text-rose-700",
};

export default function MyRegistrationsPage() {
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");

  const filtered = myRegistrations.filter((item) =>
    `${item.title} ${item.date}`.toLowerCase().includes(query.toLowerCase()),
  );
  const upcoming = filtered.filter((item) => item.registrationStatus !== "CANCELLED");
  const history = filtered.filter((item) => item.registrationStatus === "CANCELLED");

  return (
    <StudentShell activeTop="My Registrations">
      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-5xl font-bold">Dang ky cua toi</h1>
            <p className="mt-1 text-slate-500">
              Theo doi trang thai dang ky, thanh toan va QR check-in cua tung workshop.
            </p>
          </div>
          <div className="flex w-full max-w-xs items-center rounded-lg border bg-white px-3 py-2">
            <Search className="mr-2 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-sm outline-none"
              placeholder="Tim workshop da dang ky..."
            />
          </div>
        </div>

        <h2 className="mb-3 text-3xl font-semibold">Sap dien ra</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {upcoming.map((item) => (
            <article key={item.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="mb-3 h-40 rounded-lg bg-gradient-to-r from-slate-900 to-blue-900" />
              <p className="text-2xl font-bold">{item.title}</p>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <p className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" /> {item.date} · {item.time}
                </p>
                <p className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {item.room}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className={`rounded-full px-2 py-1 ${regStyles[item.registrationStatus]}`}>
                  {item.registrationStatus}
                </span>
                <span className={`rounded-full px-2 py-1 ${payStyles[item.paymentStatus]}`}>{item.paymentStatus}</span>
              </div>

              <button
                disabled={!item.qrCode}
                onClick={() => setSelected(item)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Ticket className="h-4 w-4" />
                {item.qrCode ? "Hien QR check-in" : "Dang cho QR"}
              </button>
            </article>
          ))}
        </div>

        <section className="mt-8 rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-3xl font-semibold">Lich su / Da huy</h3>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-500">
                <tr>
                  <th className="px-3 py-2">WORKSHOP</th>
                  <th className="px-3 py-2">DATE</th>
                  <th className="px-3 py-2">REGISTRATION</th>
                  <th className="px-3 py-2">PAYMENT</th>
                  <th className="px-3 py-2">QR</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-3 py-3">{item.title}</td>
                    <td className="px-3 py-3">{item.date}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${regStyles[item.registrationStatus]}`}
                      >
                        {item.registrationStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${payStyles[item.paymentStatus]}`}>
                        {item.paymentStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-400">{item.qrCode || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <QRModal open={!!selected} workshop={selected} onClose={() => setSelected(null)} />
    </StudentShell>
  );
}
