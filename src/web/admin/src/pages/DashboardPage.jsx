import React from "react";
import { MoreVertical } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { recentRegistrations, upcomingDeadlines, weeklyData } from "@/data/mockData";

// ─── Simple SVG sparkline ──────────────────────────────────────
function TrendChart({ data }) {
  const max = Math.max(...data.map((d) => d.value));
  const W = 520;
  const H = 170;
  const px = 10;
  const py = 10;
  const pts = data.map((d, i) => ({
    x: px + (i / (data.length - 1)) * (W - px * 2),
    y: H - py - (d.value / max) * (H - py * 2),
    day: d.day,
  }));
  const line = pts.map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} className="w-full">
      <defs>
        <linearGradient id="gradAdmin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f, i) => (
        <line
          key={i}
          x1={px}
          x2={W - px}
          y1={py + f * (H - py * 2)}
          y2={py + f * (H - py * 2)}
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      ))}
      <polygon points={`${px},${H - py} ${line} ${W - px},${H - py}`} fill="url(#gradAdmin)" />
      <polyline
        points={line}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#3b82f6" />
      ))}
      {pts.map((p, i) => (
        <text key={i} x={p.x} y={H + 14} textAnchor="middle" fontSize="11" fill="#94a3b8">
          {p.day}
        </text>
      ))}
    </svg>
  );
}

const statusStyles = {
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
};

export default function DashboardPage() {
  return (
    <AdminShell activeTop="My Workshops">
      <h1 className="text-4xl font-bold">Workshop Insights</h1>
      <p className="mt-1 text-slate-500">Real-time performance metrics and registration trends.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <MetricCard label="TOTAL WORKSHOPS" value="42" delta="+12%" icon="🎓" />
        <MetricCard label="TOTAL REGISTRATIONS" value="1,284" delta="+8%" icon="👥" />
        <MetricCard label="ACTIVE CHECK-INS" value="156" tag="LIVENOW" icon="📋" />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_300px]">
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-semibold">Registration Trends</p>
              <p className="text-sm text-slate-500">Daily signup volume for the current month</p>
            </div>
            <div className="flex gap-1 rounded-lg border p-1 text-sm">
              <button className="rounded bg-slate-100 px-3 py-1 font-medium">Daily</button>
              <button className="rounded px-3 py-1 text-slate-500">Weekly</button>
            </div>
          </div>
          <div className="mt-4">
            <TrendChart data={weeklyData} />
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-xl font-semibold">Upcoming Deadlines</p>
          <div className="mt-4 space-y-4">
            {upcomingDeadlines.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <span className="mt-0.5 text-lg">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.sub}</p>
                  {item.tag && (
                    <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-bold ${item.tagColor}`}>
                      {item.tag}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button className="mt-6 text-sm font-medium text-blue-700">View All Schedule ›</button>
        </div>
      </div>

      <div className="mt-5 rounded-xl border bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-2xl font-semibold">Recent Registrations</p>
          <div className="flex w-52 items-center rounded-lg border px-3 py-2">
            <span className="mr-2 text-slate-400">🔍</span>
            <input className="w-full text-sm outline-none" placeholder="Filter users..." />
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">USER</th>
                <th className="px-4 py-3 font-medium">WORKSHOP</th>
                <th className="px-4 py-3 font-medium">STATUS</th>
                <th className="px-4 py-3 font-medium">DATE</th>
                <th className="px-4 py-3 font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {recentRegistrations.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${r.color}`}
                      >
                        {r.initials}
                      </div>
                      <div>
                        <p className="font-medium">{r.name}</p>
                        <p className="text-xs text-slate-500">{r.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{r.workshop}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-1 text-xs font-bold ${statusStyles[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{r.date}</td>
                  <td className="px-4 py-3">
                    <button className="text-slate-400">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

function MetricCard({ label, value, delta, tag, icon }) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs tracking-widest text-slate-500">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="mt-2 text-4xl font-bold">{value}</p>
      {delta && <p className="mt-1 text-sm font-medium text-emerald-600">{delta}</p>}
      {tag && (
        <span className="mt-1 inline-block rounded bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{tag}</span>
      )}
    </div>
  );
}
