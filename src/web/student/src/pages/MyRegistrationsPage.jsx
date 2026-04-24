import React, { useState } from "react";
import { CalendarDays, MapPin, Ticket, Search } from "lucide-react";
import StudentShell from "@/components/StudentShell";
import QRModal from "@/components/QRModal";
import { myWorkshops } from "@/data/mockData";

export default function MyRegistrationsPage() {
  const [selected, setSelected] = useState(null);

  return (
    <StudentShell activeTop="My Workshops">
      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-5xl font-bold">My Workshops</h1>
            <p className="mt-1 text-slate-500">Manage your registered sessions and check in for upcoming events.</p>
          </div>
          <div className="flex w-full max-w-xs items-center rounded-lg border bg-white px-3 py-2">
            <Search className="mr-2 h-4 w-4 text-slate-400" />
            <input className="w-full text-sm outline-none" placeholder="Search workshops..." />
          </div>
        </div>

        <h2 className="mb-3 text-3xl font-semibold">Upcoming</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {myWorkshops.map((item) => (
            <article key={item.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="mb-3 h-40 rounded-lg bg-gradient-to-r from-slate-900 to-blue-900" />
              <p className="text-2xl font-bold">{item.title}</p>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <p className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" /> {item.date} · {item.time}
                </p>
                <p className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {item.location}
                </p>
              </div>
              <button
                onClick={() => setSelected(item)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 font-semibold text-white"
              >
                <Ticket className="h-4 w-4" />
                Show Check-in QR
              </button>
            </article>
          ))}
        </div>

        <section className="mt-8 rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-3xl font-semibold">Past Workshops</h3>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-500">
                <tr>
                  <th className="px-3 py-2">WORKSHOP NAME</th>
                  <th className="px-3 py-2">DATE</th>
                  <th className="px-3 py-2">STATUS</th>
                  <th className="px-3 py-2">CHECK-INS</th>
                  <th className="px-3 py-2">CERTIFICATE</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-3 py-3">Introduction to Python</td>
                  <td className="px-3 py-3">Sep 15, 2023</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                      Completed
                    </span>
                  </td>
                  <td className="px-3 py-3">1.0</td>
                  <td className="px-3 py-3 text-blue-700">Download</td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-3">Startup Funding 101</td>
                  <td className="px-3 py-3">Aug 15, 2023</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
                      Canceled
                    </span>
                  </td>
                  <td className="px-3 py-3">0.0</td>
                  <td className="px-3 py-3 text-slate-400">N/A</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <QRModal open={!!selected} workshop={selected} onClose={() => setSelected(null)} />
    </StudentShell>
  );
}
