import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Medal, Trophy, Users, CalendarDays, TrendingUp } from "lucide-react";
import StudentShell from "@/components/StudentShell";
import { workshopService } from "@/services/workshopService";

const rankStyles = [
  "bg-amber-100 text-amber-700 ring-amber-200",
  "bg-slate-100 text-slate-600 ring-slate-200",
  "bg-orange-100 text-orange-700 ring-orange-200",
];

export default function LeaderboardPage() {
  const [workshops, setWorkshops] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;

    workshopService
      .getAll()
      .then((items) => {
        if (active) setWorkshops(items);
      })
      .catch((err) => {
        if (active) setError(err?.response?.data?.detail || err?.message || "Không thể tải bảng xếp hạng.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const rankedWorkshops = workshops
    .filter((workshop) => workshop.status !== "CANCELLED")
    .sort((a, b) => b.registeredCount - a.registeredCount);
  const totalRegistrations = rankedWorkshops.reduce((total, workshop) => total + workshop.registeredCount, 0);
  const totalCapacity = rankedWorkshops.reduce((total, workshop) => total + workshop.capacity, 0);
  const occupancy = totalCapacity ? Math.round((totalRegistrations / totalCapacity) * 100) : 0;
  const leader = rankedWorkshops[0];

  return (
    <StudentShell activeTop="Xếp hạng">
      <section>
        <div className="mb-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            <TrendingUp className="h-3.5 w-3.5" /> Cập nhật theo lượt đăng ký
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">Bảng xếp hạng workshop</h1>
          <p className="mt-2 max-w-2xl text-slate-600">Khám phá những workshop đang được sinh viên quan tâm nhất.</p>
        </div>

        {!loading && !error && leader ? (
          <Link
            to={`/workshops/${leader.id}`}
            className="group relative mb-6 block overflow-hidden rounded-3xl bg-slate-950 text-white shadow-sm"
          >
            <img src={leader.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35 transition group-hover:scale-[1.02]" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
            <div className="relative flex min-h-60 flex-col justify-between gap-8 p-6 md:flex-row md:items-end md:p-9">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-950">
                  <Trophy className="h-4 w-4" /> Đang dẫn đầu
                </span>
                <h2 className="mt-4 text-3xl font-bold md:text-4xl">{leader.title}</h2>
                <p className="mt-2 text-sm text-slate-200">Diễn giả: {leader.speaker} · {leader.dateLabel}</p>
              </div>
              <div className="flex shrink-0 items-end gap-3">
                <Users className="mb-1 h-7 w-7 text-blue-300" />
                <div>
                  <p className="text-3xl font-bold">{leader.registeredCount.toLocaleString("vi-VN")}</p>
                  <p className="text-sm text-slate-200">lượt đăng ký</p>
                </div>
                <ArrowUpRight className="mb-1 ml-4 h-5 w-5 text-white/70 transition group-hover:-translate-y-1 group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ) : null}

        {loading ? <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Đang tải bảng xếp hạng...</p> : null}
        {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</p> : null}
        {!loading && !error && !rankedWorkshops.length ? (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Chưa có workshop để xếp hạng.</p>
        ) : null}

        {!loading && !error && rankedWorkshops.length ? (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <StatCard icon={Trophy} label="Workshop đang xếp hạng" value={rankedWorkshops.length} detail="Đang mở hoặc đã đủ chỗ" />
              <StatCard icon={Users} label="Tổng lượt đăng ký" value={totalRegistrations.toLocaleString("vi-VN")} detail="Trên các workshop đang hoạt động" />
              <StatCard icon={TrendingUp} label="Tỉ lệ lấp đầy" value={`${occupancy}%`} detail="So với tổng sức chứa" />
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Thứ hạng hiện tại</h2>
                  <p className="mt-0.5 text-sm text-slate-500">Sắp xếp theo số lượt đăng ký từ cao xuống thấp</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{rankedWorkshops.length} workshop</span>
              </div>

              <div className="divide-y divide-slate-100">
                {rankedWorkshops.map((workshop, index) => {
                  const registered = workshop.registeredCount || 0;
                  const capacity = workshop.capacity || 0;
                  const fillPercent = capacity ? Math.min(100, Math.round((registered / capacity) * 100)) : 0;

                  return (
                    <div key={workshop.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ${rankStyles[index] || "bg-slate-50 text-slate-500 ring-slate-200"}`}>
                        {index < 3 ? <Medal className="h-5 w-5" /> : <span className="text-sm font-bold">{index + 1}</span>}
                      </div>

                      <img src={workshop.image} alt="" className="hidden h-14 w-20 shrink-0 rounded-lg object-cover sm:block" />

                      <div className="min-w-0 flex-1">
                        <Link to={`/workshops/${workshop.id}`} className="font-semibold text-slate-900 hover:text-blue-700">
                          {workshop.title}
                        </Link>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>{workshop.speaker}</span>
                          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{workshop.dateLabel}</span>
                        </p>
                      </div>

                      <div className="w-full sm:w-48">
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">{registered}/{capacity} đăng ký</span>
                          <span className="text-slate-500">{fillPercent}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-blue-600" style={{ width: `${fillPercent}%` }} />
                        </div>
                      </div>

                      <Link to={`/workshops/${workshop.id}`} className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900 sm:inline-flex">
                        Chi tiết <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}
      </section>
    </StudentShell>
  );
}

function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}
