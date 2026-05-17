import React from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Clock3, MapPin, Search, Ticket, ChevronLeft, ChevronRight } from "lucide-react";
import StudentShell from "@/components/StudentShell";
import { workshopService } from "@/services/workshopService";

const statusStyles = {
  OPEN: "bg-emerald-100 text-emerald-700",
  FULL: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-slate-200 text-slate-700",
};

const statusLabel = {
  OPEN: "Đang mở",
  FULL: "Sắp đầy",
  CANCELLED: "Đã hủy",
};

export default function WorkshopListPage() {
  const pageSize = 6;
  const [query, setQuery] = React.useState("");
  const [workshops, setWorkshops] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [category, setCategory] = React.useState("ALL");
  const [onlyFree, setOnlyFree] = React.useState(false);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const items = await workshopService.getAll();
        if (active) setWorkshops(items);
      } catch (err) {
        if (active) {
          setError(err?.response?.data?.detail || err?.message || "Không thể tải danh sách workshop.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const now = Date.now();
  const soonWindowMs = 14 * 24 * 60 * 60 * 1000;

  const filtered = workshops.filter((item) => {
    const haystack = `${item.title} ${item.speaker} ${item.dateLabel}`.toLowerCase();
    const passQuery = haystack.includes(query.toLowerCase());
    const passPrice = onlyFree ? item.isFree : true;
    const occupancyRatio = item.capacity > 0 ? (item.capacity - item.slotsLeft) / item.capacity : 0;
    const startAt = item.startTime ? new Date(item.startTime).getTime() : NaN;
    const isNewUpcoming = Number.isFinite(startAt) && startAt >= now && startAt - now <= soonWindowMs;
    const isAlmostFull = item.status === "FULL" || item.slotsLeft <= Math.max(3, Math.ceil(item.capacity * 0.15));
    const passCategory =
      category === "ALL"
        ? true
        : category === "TRENDING"
          ? item.status === "OPEN" && occupancyRatio >= 0.5
          : category === "NEW"
            ? isNewUpcoming
            : isAlmostFull;

    return passQuery && passPrice && passCategory;
  });

  React.useEffect(() => {
    setPage(1);
  }, [query, category, onlyFree]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pagedItems = filtered.slice(startIndex, endIndex);

  const visiblePageNumbers = (() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safePage <= 3) return [1, 2, 3, 4, 5];
    if (safePage >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [safePage - 2, safePage - 1, safePage, safePage + 1, safePage + 2];
  })();

  return (
    <StudentShell activeTop="Khám phá">
      <section className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Bộ lọc workshop</p>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Danh mục</p>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <label className="flex items-center gap-2">
                <input type="radio" name="cat" checked={category === "ALL"} onChange={() => setCategory("ALL")} />
                Tất cả chủ đề
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="cat"
                  checked={category === "TRENDING"}
                  onChange={() => setCategory("TRENDING")}
                />
                Xu hướng
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="cat" checked={category === "NEW"} onChange={() => setCategory("NEW")} />
                Mới mở
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="cat"
                  checked={category === "ALMOST_FULL"}
                  onChange={() => setCategory("ALMOST_FULL")}
                />
                Sắp đầy chỗ
              </label>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Mức phí</p>
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
              <input checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} type="checkbox" />
              Chỉ hiển thị workshop miễn phí
            </label>
          </div>

          <button
            onClick={() => {
              setCategory("ALL");
              setOnlyFree(false);
              setQuery("");
            }}
            className="mt-6 w-full rounded-xl border border-blue-300 py-2 text-sm font-semibold text-blue-700"
          >
            Đặt lại bộ lọc
          </button>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex w-full max-w-2xl items-center rounded-xl border border-slate-200 bg-white px-4 py-3">
              <Search className="mr-2 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
                placeholder="Tìm workshop, diễn giả hoặc kỹ năng..."
              />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Hiển thị {filtered.length ? startIndex + 1 : 0}-{Math.min(endIndex, filtered.length)} / {filtered.length}{" "}
              workshop
            </span>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <Chip active={category === "ALL"} onClick={() => setCategory("ALL")} label="Tất cả" />
            <Chip active={category === "TRENDING"} onClick={() => setCategory("TRENDING")} label="Xu hướng" />
            <Chip active={category === "NEW"} onClick={() => setCategory("NEW")} label="Mới" />
            <Chip active={category === "ALMOST_FULL"} onClick={() => setCategory("ALMOST_FULL")} label="Sắp đầy" />
          </div>

          {loading ? <p className="text-sm text-slate-500">Đang tải workshop...</p> : null}
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}

          <div className="grid gap-4 md:grid-cols-2">
            {!loading &&
              !error &&
              pagedItems.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <img src={item.image} alt={item.title} className="h-52 w-full object-cover" />
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-[11px] font-semibold text-blue-700">
                        Tóm tắt AI khả dụng
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[item.status]}`}>
                        {statusLabel[item.status] || item.status}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          to={`/workshops/${item.id}`}
                          className="text-3xl font-bold leading-tight hover:text-blue-700"
                        >
                          {item.title}
                        </Link>
                        <p className="mt-1 text-sm text-slate-500">Diễn giả: {item.speaker}</p>
                      </div>
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

                    <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium text-slate-700">
                          Chỗ còn lại: {item.slotsLeft}/{item.capacity}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {item.slotsLeft <= 3 ? "Nhanh tay giữ chỗ" : "Đang mở đăng ký"}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-200">
                        <div
                          className="h-1.5 rounded-full bg-blue-600"
                          style={{
                            width: `${Math.max(8, Math.round((item.slotsLeft / Math.max(1, item.capacity)) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>
                        Học phí: <strong>{item.price}</strong>
                      </span>
                      <Link
                        to={`/workshops/${item.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white"
                      >
                        <Ticket className="h-4 w-4" />
                        Đăng ký nhanh
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
          </div>

          {!loading && !error && filtered.length > 0 ? (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-sm text-slate-500">
                Trang {safePage} / {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage === 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {visiblePageNumbers.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPage(num)}
                    className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold ${
                      num === safePage
                        ? "bg-blue-600 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {num}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safePage === totalPages}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}

          {!loading && !error && !filtered.length ? (
            <p className="mt-4 text-sm text-slate-500">Không tìm thấy workshop phù hợp với bộ lọc hiện tại.</p>
          ) : null}
        </div>
      </section>
    </StudentShell>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
        active ? "bg-blue-600 text-white" : "bg-slate-200/70 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}
