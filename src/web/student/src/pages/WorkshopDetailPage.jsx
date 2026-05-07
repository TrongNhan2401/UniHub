import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock3, MapPin, CheckCircle2, Sparkles } from "lucide-react";
import StudentShell from "@/components/StudentShell";
import SuccessModal from "@/components/SuccessModal";
import {
  generateIdempotencyKey,
  paymentService,
  registrationService,
  workshopService,
} from "@/services/workshopService";

export default function WorkshopDetailPage() {
  const { id } = useParams();
  const [openSuccess, setOpenSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [workshop, setWorkshop] = useState(null);
  const [allWorkshops, setAllWorkshops] = useState([]);
  const [myRegistration, setMyRegistration] = useState(null);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [item, items, regsRes] = await Promise.all([
          workshopService.getById(id),
          workshopService.getAll({ pageNumber: 1, pageSize: 30 }),
          registrationService.getMyRegistrations().catch(() => ({ data: [] })),
        ]);
        if (active) {
          setWorkshop(item);
          setAllWorkshops(items);
          const regs = regsRes?.data || [];
          const found = regs.find((r) => String(r.workshop_id) === String(id) && r.status !== "CANCELLED");
          setMyRegistration(found || null);
        }
      } catch (err) {
        if (active) {
          setError(err?.response?.data?.detail || err?.message || "Không thể tải chi tiết workshop.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id]);

  const similarWorkshops = useMemo(
    () => allWorkshops.filter((w) => String(w.id) !== String(id)).slice(0, 3),
    [allWorkshops, id],
  );

  const handleRegister = async () => {
    if (!workshop || !canRegister || submitting) return;

    setSubmitting(true);
    setError("");
    try {
      const registerKey = generateIdempotencyKey();
      const { data: reg } = await registrationService.register(workshop.id, registerKey);

      setMyRegistration(reg);

      if (reg?.payment_status === "NOT_REQUIRED") {
        setOpenSuccess(true);
        return;
      }

      const checkoutKey = generateIdempotencyKey();
      const { data: checkout } = await paymentService.checkout(reg.id, checkoutKey);
      if (checkout?.checkout_url) {
        window.location.href = checkout.checkout_url;
        return;
      }

      setError("Đã tạo đăng ký thành công nhưng chưa lấy được liên kết thanh toán.");
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Đăng ký thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <StudentShell activeTop="Khám phá">
        <p className="text-sm text-slate-500">Đang tải chi tiết workshop...</p>
      </StudentShell>
    );
  }

  if (!workshop) {
    return (
      <StudentShell activeTop="Khám phá">
        <p className="text-sm text-rose-700">{error || "Không tìm thấy workshop."}</p>
      </StudentShell>
    );
  }

  const canRegister = !myRegistration && workshop.status === "OPEN" && workshop.slotsLeft > 0;
  const agenda = buildAgenda(workshop.startTime, workshop.endTime, workshop.aboutPoints);
  const remainPercent = Math.max(8, Math.round((workshop.slotsLeft / Math.max(1, workshop.capacity)) * 100));

  return (
    <StudentShell activeTop="Khám phá">
      <section>
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại danh sách workshop
        </Link>

        <div className="relative h-[300px] overflow-hidden rounded-3xl bg-slate-900 md:h-[360px]">
          <img src={workshop.image} alt={workshop.title} className="h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="mb-3 flex gap-2">
              <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold">{workshop.code}</span>
              <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold">
                {workshop.slotsLeft}/{workshop.capacity} chỗ còn lại
              </span>
            </div>
            <h1 className="max-w-4xl text-4xl font-bold leading-tight md:text-6xl">{workshop.title}</h1>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-200">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-4 w-4" /> {workshop.dateLabel}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-4 w-4" /> {workshop.timeLabel}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {workshop.room}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_330px]">
          <div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-bold tracking-[0.2em] text-slate-500">DIỄN GIẢ</p>
                <p className="mt-3 text-2xl font-semibold">{workshop.speaker}</p>
                <p className="text-sm text-slate-500">{workshop.speakerRole}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-bold tracking-[0.2em] text-slate-500">THỜI GIAN</p>
                <p className="mt-3 text-lg font-semibold">{workshop.dateLabel}</p>
                <p className="text-sm text-slate-500">{workshop.timeLabel}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
              <p className="inline-flex items-center gap-2 text-base font-semibold text-blue-700">
                <Sparkles className="h-4 w-4" /> Gợi ý AI
              </p>
              <p className="mt-2 text-sm italic text-slate-700">"{workshop.aiSummary}"</p>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-3xl font-bold">Chi tiết workshop</h2>
              <p className="mt-3 text-slate-600">{workshop.description}</p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {workshop.aboutPoints.map((point) => (
                  <p key={point} className="inline-flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    {point}
                  </p>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-3xl font-bold">Lịch trình dự kiến</h3>
              <div className="mt-4 space-y-4">
                {agenda.map((item, idx) => (
                  <div key={`${item.time}-${idx}`} className="flex gap-4">
                    <div className="mt-1 h-3 w-3 rounded-full bg-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-blue-700">{item.time}</p>
                      <p className="text-sm text-slate-700">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold tracking-[0.2em] text-slate-500">PHÍ THAM DỰ</p>
              <p className="mt-2 text-5xl font-bold text-blue-700">{workshop.price}</p>

              {myRegistration ? (
                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-700">Bạn đã đăng ký workshop này</p>
                      <p className="text-xs text-emerald-600">
                        Trạng thái:{" "}
                        {myRegistration.status === "CONFIRMED"
                          ? "Đã xác nhận"
                          : myRegistration.status === "PENDING"
                            ? "Chờ xác nhận"
                            : myRegistration.status}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/my-registrations"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-blue-600 py-3 text-base font-semibold text-blue-700"
                  >
                    Xem vé của tôi
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={!canRegister || submitting}
                  className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {submitting ? "Đang xử lý..." : canRegister ? "Đăng ký ngay" : "Không thể đăng ký"}
                </button>
              )}

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Sức chứa</span>
                  <span className="font-semibold">{workshop.capacity} chỗ</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Còn lại</span>
                  <span className="font-semibold text-blue-700">{workshop.slotsLeft} chỗ</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${remainPercent}%` }} />
                </div>
                {!myRegistration && !canRegister ? (
                  <p className="text-xs text-rose-700">Workshop đã đầy chỗ hoặc không còn mở đăng ký.</p>
                ) : null}
                {error ? <p className="text-xs text-rose-700">{error}</p> : null}
              </div>

              <div className="mt-5 border-t pt-4">
                <p className="text-xs tracking-widest text-slate-500">BAO GỒM</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  {workshop.materials.map((material) => (
                    <li key={material}>• {material}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs tracking-widest text-slate-500">ĐỊA ĐIỂM</p>
              <div className="mt-3 h-44 rounded-xl bg-slate-100" />
              <p className="mt-3 text-sm">{workshop.location}</p>
              <a
                href={workshop.roomMapUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block w-full rounded-lg border py-2 text-center text-sm font-medium text-blue-700"
              >
                Xem sơ đồ phòng
              </a>
            </div>
          </aside>
        </div>

        <section className="mt-16">
          <h3 className="text-4xl font-bold">Workshop tương tự</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {similarWorkshops.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-xl border bg-white">
                <img src={item.image} alt={item.title} className="h-44 w-full object-cover" />
                <div className="p-4">
                  <p className="text-2xl font-semibold">{item.title}</p>
                  <p className="text-sm text-slate-500">
                    {item.dateLabel} · {item.room}
                  </p>
                </div>
              </article>
            ))}
            {!similarWorkshops.length ? <p className="text-sm text-slate-500">Chưa có workshop tương tự.</p> : null}
          </div>
        </section>
      </section>

      <SuccessModal open={openSuccess} onClose={() => setOpenSuccess(false)} workshop={workshop} />
    </StudentShell>
  );
}

function buildAgenda(startTime, endTime, aboutPoints = []) {
  const fallback = [
    { time: "Mở đầu", text: "Định hướng nội dung và mục tiêu buổi học." },
    { time: "Thực hành", text: "Làm bài tập tình huống và giải đáp trực tiếp." },
    { time: "Tổng kết", text: "Tóm tắt kiến thức và định hướng tự học tiếp theo." },
  ];

  if (!startTime || !endTime) {
    return fallback;
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  const middle = new Date((start.getTime() + end.getTime()) / 2);
  const format = (d) => d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  return [
    { time: `${format(start)} - ${format(middle)}`, text: aboutPoints[0] || fallback[0].text },
    { time: `${format(middle)} - ${format(end)}`, text: aboutPoints[1] || fallback[1].text },
    { time: `${format(end)}+`, text: aboutPoints[2] || fallback[2].text },
  ];
}
