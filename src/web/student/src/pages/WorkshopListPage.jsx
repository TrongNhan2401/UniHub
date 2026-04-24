import React from "react";
import { Link } from "react-router-dom";
import { Download, Filter, Pencil, Search, Trash2 } from "lucide-react";
import StudentShell from "@/components/StudentShell";
import { workshops } from "@/data/mockData";

const statusStyles = {
  Active: "bg-emerald-100 text-emerald-700",
  Scheduled: "bg-blue-100 text-blue-700",
  Completed: "bg-slate-200 text-slate-700",
  Draft: "bg-amber-100 text-amber-700",
};

export default function WorkshopListPage() {
  return (
    <StudentShell activeTop="Browse">
      <section>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-5xl font-bold tracking-tight">Workshop Management</h1>
            <p className="mt-2 text-slate-500">Control and monitor all academic workshops across campus.</p>
          </div>
          <button className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white">+ Add New Workshop</button>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex w-full max-w-sm items-center rounded-lg border px-3 py-2">
              <Search className="mr-2 h-4 w-4 text-slate-400" />
              <input className="w-full text-sm outline-none" placeholder="Filter by title or speaker..." />
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm">
                <Filter className="h-4 w-4" />
                Filter
              </button>
              <button className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">TITLE</th>
                  <th className="px-4 py-3 font-medium">SPEAKER</th>
                  <th className="px-4 py-3 font-medium">DATE</th>
                  <th className="px-4 py-3 font-medium">ROOM</th>
                  <th className="px-4 py-3 font-medium">STATUS</th>
                  <th className="px-4 py-3 font-medium">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {workshops.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-4">
                      <Link to={`/workshops/${item.id}`} className="font-semibold hover:text-blue-700">
                        {item.title}
                      </Link>
                      <p className="text-xs text-slate-500">Code: {item.code}</p>
                    </td>
                    <td className="px-4 py-4">{item.speaker}</td>
                    <td className="px-4 py-4">
                      <p>{item.dateLabel}</p>
                      <p className="text-xs text-slate-500">{item.shortTime}</p>
                    </td>
                    <td className="px-4 py-4">{item.room}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[item.status]}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-3 text-slate-500">
                        <button>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <p>Showing 1 to 4 of 24 results</p>
            <div className="flex gap-2">
              <button className="rounded-md border px-3 py-2">1</button>
              <button className="rounded-md border px-3 py-2">2</button>
              <button className="rounded-md border px-3 py-2">3</button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <InfoCard label="TOTAL WORKSHOPS" value="142" />
          <InfoCard label="REGISTRATIONS" value="2,840" />
          <InfoCard label="PENDING APPROVAL" value="18" />
        </div>
      </section>
    </StudentShell>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-xs tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-4xl font-bold">{value}</p>
    </div>
  );
}
