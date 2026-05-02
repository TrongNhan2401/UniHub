import React from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Clock3, MapPin, Search, Ticket } from "lucide-react";
import StudentShell from "@/components/StudentShell";
import { workshops } from "@/data/mockData";

const statusStyles = {
  OPEN: "bg-emerald-100 text-emerald-700",
  FULL: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-slate-200 text-slate-700",
};

export default function WorkshopListPage() {
  const [query, setQuery] = React.useState("");
  const filtered = workshops.filter((w) => {
    const haystack = `${w.title} ${w.speaker} ${w.dateLabel}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <StudentShell activeTop="Browse">
      <section>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-5xl font-bold tracking-tight">Workshop tuan nay</h1>
            <p className="mt-2 text-slate-500">
              Xem lich, tinh trang con cho va dang ky tham du workshop ngay tren he thong.
            </p>
          </div>
          <span className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            {filtered.length} workshop phu hop
          </span>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex w-full max-w-sm items-center rounded-lg border px-3 py-2">
              <Search className="mr-2 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full text-sm outline-none"
                placeholder="Tim theo ten workshop, dien gia, ngay..."
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <img src={item.image} alt={item.title} className="h-44 w-full object-cover" />
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to={`/workshops/${item.id}`} className="text-2xl font-bold hover:text-blue-700">
                        {item.title}
                      </Link>
                      <p className="text-sm text-slate-500">Dien gia: {item.speaker}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[item.status]}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="grid gap-1 text-sm text-slate-600">
                    <p className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" /> {item.dateLabel}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <Clock3 className="h-4 w-4" /> {item.timeLabel}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> {item.room}
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span>
                      Hoc phi: <strong>{item.price}</strong>
                    </span>
                    <span>
                      Con <strong>{item.slotsLeft}</strong>/{item.capacity} cho
                    </span>
                  </div>

                  <Link
                    to={`/workshops/${item.id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 font-semibold text-white"
                  >
                    <Ticket className="h-4 w-4" />
                    Xem chi tiet va dang ky
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {!filtered.length ? <p className="mt-4 text-sm text-slate-500">Khong tim thay workshop phu hop.</p> : null}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <InfoCard label="WORKSHOP DANG MO" value={String(workshops.filter((w) => w.status === "OPEN").length)} />
          <InfoCard label="WORKSHOP HET CHO" value={String(workshops.filter((w) => w.status === "FULL").length)} />
          <InfoCard label="WORKSHOP DA HUY" value={String(workshops.filter((w) => w.status === "CANCELLED").length)} />
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
