import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlarmClock, CalendarDays, ClipboardList, GraduationCap, MoreVertical, Search, Users } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { workshopService } from "@/services/adminService";

function toDateTimeLabel(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function toRelativeDeadlineLabel(startTime) {
  const start = new Date(startTime);
  if (Number.isNaN(start.getTime())) return "Chưa có lịch";

  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffHours < 0)
    return `Đã bắt đầu lúc ${start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
  if (diffHours <= 24) return `Bắt đầu sau ${diffHours} giờ`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays <= 7) return `Bắt đầu sau ${diffDays} ngày`;

  return `Bắt đầu lúc ${toDateTimeLabel(start)}`;
}

function getInitialsFromEmail(email) {
  const safe = String(email || "").trim();
  if (!safe.includes("@")) return "NA";
  const local = safe.split("@")[0];
  const chunks = local.split(/[._-]+/).filter(Boolean);
  if (chunks.length >= 2) return `${chunks[0][0]}${chunks[1][0]}`.toUpperCase();
  return local.slice(0, 2).toUpperCase() || "NA";
}

function normalizeStatus(raw) {
  const value = String(raw || "")
    .trim()
    .toUpperCase();
  if (!value) return "PENDING";
  return value;
}

function buildTrendData(registrations) {
  const labels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const today = new Date();
  const days = [];

  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  const countMap = {};
  days.forEach((d) => {
    const key = d.toISOString().slice(0, 10);
    countMap[key] = 0;
  });

  registrations.forEach((r) => {
    const dt = new Date(r.createdAt);
    if (Number.isNaN(dt.getTime())) return;
    dt.setHours(0, 0, 0, 0);
    const key = dt.toISOString().slice(0, 10);
    if (countMap[key] !== undefined) countMap[key] += 1;
  });

  return days.map((d) => {
    const key = d.toISOString().slice(0, 10);
    return {
      day: labels[d.getDay()],
      value: countMap[key] || 0,
    };
  });
}

function TrendChart({ data }) {
  const safeData = Array.isArray(data) && data.length > 0 ? data : [{ day: "-", value: 0 }];
  const max = Math.max(1, ...safeData.map((d) => d.value));
  const W = 520;
  const H = 170;
  const px = 10;
  const py = 10;
  const denominator = Math.max(1, safeData.length - 1);

  const pts = safeData.map((d, i) => ({
    x: px + (i / denominator) * (W - px * 2),
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
        <text 
          key={`val-${i}`} 
          x={p.x} 
          y={p.y - 10} 
          textAnchor="middle" 
          fontSize="10" 
          fontWeight="bold" 
          fill="#1e40af"
        >
          {safeData[i].value}
        </text>
      ))}
      {pts.map((p, i) => (
        <text key={i} x={p.x} y={H + 14} textAnchor="middle" fontSize="11" fill="#94a3b8">
          {p.day}
        </text>
      ))}
    </svg>
  );
}


export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workshops, setWorkshops] = useState([]);
  const [workshopDetails, setWorkshopDetails] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const pageSize = 100;
        const firstRes = await workshopService.getAll({ pageNumber: 1, pageSize });
        const firstData = firstRes?.data || {};
        let allWorkshops = firstData.items || [];
        const totalPages = Number(firstData.totalPages || 1);

        for (let page = 2; page <= totalPages; page += 1) {
          const res = await workshopService.getAll({ pageNumber: page, pageSize });
          allWorkshops = allWorkshops.concat(res?.data?.items || []);
        }

        const detailResponses = await Promise.all(
          allWorkshops.map((w) => workshopService.getById(w.id).catch(() => null)),
        );

        const details = detailResponses.map((res) => res?.data).filter(Boolean);

        if (!ignore) {
          setWorkshops(allWorkshops);
          setWorkshopDetails(details);
        }
      } catch (err) {
        if (!ignore) {
          setError(err?.response?.data?.detail || err?.response?.data?.message || "Không tải được số liệu dashboard.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  const metrics = useMemo(() => {
    const totalWorkshops = workshops.length;
    const totalRegistrations = workshops.reduce((sum, w) => sum + (Number(w.registeredCount) || 0), 0);
    const publishedWorkshops = workshops.filter((w) => w.status === "Published").length;
    return { totalWorkshops, totalRegistrations, publishedWorkshops };
  }, [workshops]);

  const allRegistrations = useMemo(() => {
    const registrations = [];
    workshopDetails.forEach((w) => {
      const workshopTitle = w?.title || "Workshop";
      (w?.registrations || []).forEach((r) => {
        registrations.push({
          id: r.id,
          userId: r.userId,
          userEmail: r.userEmail,
          status: normalizeStatus(r.status),
          createdAt: r.createdAt,
          workshopTitle,
        });
      });
    });
    return registrations;
  }, [workshopDetails]);

  const trendData = useMemo(() => buildTrendData(allRegistrations), [allRegistrations]);

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    return workshops
      .filter((w) => {
        const dt = new Date(w.startTime);
        return !Number.isNaN(dt.getTime()) && dt >= now;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 3)
      .map((w, idx) => {
        const diffHours = Math.round((new Date(w.startTime).getTime() - now.getTime()) / (1000 * 60 * 60));
        return {
          id: w.id,
          title: w.title || "Workshop",
          sub: toRelativeDeadlineLabel(w.startTime),
          tag: diffHours >= 0 && diffHours <= 6 ? "KHẨN CẤP" : null,
          tagColor: "bg-red-500 text-white",
          Icon: idx === 0 ? AlarmClock : idx === 1 ? CalendarDays : ClipboardList,
        };
      });
  }, [workshops]);

  const recentRegistrations = useMemo(() => {
    const q = query.trim().toLowerCase();

    const rows = allRegistrations
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((r, idx) => ({
        id: r.id,
        name: (r.userEmail || "").split("@")[0] || `User ${idx + 1}`,
        email: r.userEmail || "-",
        initials: getInitialsFromEmail(r.userEmail),
        color: [
          "bg-blue-200 text-blue-700",
          "bg-emerald-200 text-emerald-700",
          "bg-amber-200 text-amber-700",
          "bg-purple-200 text-purple-700",
        ][idx % 4],
        workshop: r.workshopTitle,
        status: r.status,
        date: toDateTimeLabel(r.createdAt),
      }));

    const filtered = q
      ? rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.workshop.toLowerCase().includes(q),
      )
      : rows;

    return filtered.slice(0, 8);
  }, [allRegistrations, query]);

  return (
    <AdminShell activeTop="Bảng điều khiển">
      <h1 className="text-4xl font-bold">Phân tích Workshop</h1>
      <p className="mt-1 text-slate-500">Các chỉ số hiệu suất và xu hướng đăng ký theo thời gian thực.</p>

      {error ? <p className="mt-4 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p> : null}

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <MetricCard
          label="TỔNG WORKSHOP"
          value={loading ? "..." : String(metrics.totalWorkshops)}
          delta={loading ? undefined : "API"}
          icon={GraduationCap}
        />
        <MetricCard
          label="TỔNG LƯỢT ĐĂNG KÝ"
          value={loading ? "..." : metrics.totalRegistrations.toLocaleString("vi-VN")}
          delta={loading ? undefined : "API"}
          icon={Users}
        />
        <MetricCard
          label="WORKSHOP ĐÃ XUẤT BẢN"
          value={loading ? "..." : String(metrics.publishedWorkshops)}
          tag={loading ? undefined : "API"}
          icon={ClipboardList}
        />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_300px]">
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-semibold">Xu hướng đăng ký</p>
              <p className="text-sm text-slate-500">Số lượng đăng ký trong 7 ngày gần nhất</p>
            </div>
            <div className="flex gap-1 rounded-lg border p-1 text-sm">
              <button className="rounded bg-slate-100 px-3 py-1 font-medium">7 ngày</button>
            </div>
          </div>
          <div className="mt-4">
            <TrendChart data={trendData} />
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-xl font-semibold">Thời hạn sắp tới</p>
          <div className="mt-4 space-y-4">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có workshop sắp diễn ra.</p>
            ) : (
              upcomingDeadlines.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <span className="mt-0.5 text-lg text-slate-500">
                    <item.Icon size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.sub}</p>
                    {item.tag ? (
                      <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-bold ${item.tagColor}`}>
                        {item.tag}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
          <button onClick={() => navigate("/calendar")} className="mt-6 text-sm font-medium text-blue-700">
            Xem toàn bộ lịch trình ›
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-xl border bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-2xl font-semibold">Đăng ký gần đây</p>
          <div className="flex w-72 items-center rounded-lg border px-3 py-2">
            <Search className="mr-2 h-4 w-4 text-slate-400" />
            <input
              className="w-full text-sm outline-none"
              placeholder="Lọc người dùng, email, workshop..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">NGƯỜI DÙNG</th>
                <th className="px-4 py-3 font-medium">WORKSHOP</th>
                <th className="px-4 py-3 font-medium">NGÀY</th>
              </tr>
            </thead>
            <tbody>
              {recentRegistrations.length === 0 ? (
                <tr className="border-t">
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                    {loading ? "Đang tải dữ liệu đăng ký..." : "Không có dữ liệu đăng ký."}
                  </td>
                </tr>
              ) : (
                recentRegistrations.map((r) => (
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
                    <td className="px-4 py-3 text-slate-500">{r.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

function MetricCard({ label, value, delta, tag, icon: Icon }) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs tracking-widest text-slate-500">{label}</p>
        <span className="text-slate-500">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-2 text-4xl font-bold">{value}</p>
      {delta ? <p className="mt-1 text-sm font-medium text-emerald-600">{delta}</p> : null}
      {tag ? (
        <span className="mt-1 inline-block rounded bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{tag}</span>
      ) : null}
    </div>
  );
}
