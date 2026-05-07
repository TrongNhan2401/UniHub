import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, MapPin, Ticket, Search, X } from "lucide-react";
import StudentShell from "@/components/StudentShell";
import QRModal from "@/components/QRModal";
import { checkInService, mapRegistrationToUi, registrationService } from "@/services/workshopService";

const regStyles = {
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-slate-200 text-slate-700",
  ATTENDED: "bg-blue-100 text-blue-700",
};

const payStyles = {
  NOT_REQUIRED: "bg-blue-100 text-blue-700",
  PENDING: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-rose-100 text-rose-700",
};

const regLabels = {
  CONFIRMED: "Đã xác nhận",
  PENDING: "Chờ xác nhận",
  CANCELLED: "Đã hủy",
  ATTENDED: "Đã tham dự",
};

const payLabels = {
  NOT_REQUIRED: "Không cần thanh toán",
  PENDING: "Chờ thanh toán",
  COMPLETED: "Đã thanh toán",
  FAILED: "Thanh toán lỗi",
};

export default function MyRegistrationsPage() {
  const [selected, setSelected] = useState(null);
  const [confirmItem, setConfirmItem] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleCancel = async () => {
    if (!confirmItem || cancelling) return;
    setCancelling(true);
    try {
      await registrationService.cancel(confirmItem.id);
      setItems((prev) =>
        prev.map((it) => (it.id === confirmItem.id ? { ...it, registrationStatus: "CANCELLED" } : it)),
      );
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Hủy đăng ký thất bại.");
    } finally {
      setCancelling(false);
      setConfirmItem(null);
    }
  };

  React.useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const registrationsRes = await registrationService.getMyRegistrations();
        let mapped = (registrationsRes?.data || []).map((r) => mapRegistrationToUi(r));

        const workshopIds = [...new Set(mapped.map((item) => item.workshopId).filter(Boolean))];
        const attendedRegistrationIds = new Set();

        await Promise.all(
          workshopIds.map(async (workshopId) => {
            try {
              const res = await checkInService.getByWorkshop(workshopId);
              (res?.data || []).forEach((attendance) => {
                if (attendance?.registration_id) {
                  attendedRegistrationIds.add(String(attendance.registration_id).toLowerCase());
                }
              });
            } catch {
              // Keep page functional even if attendance list cannot be loaded.
            }
          }),
        );

        mapped = mapped.map((item) =>
          attendedRegistrationIds.has(String(item.id).toLowerCase())
            ? { ...item, registrationStatus: "ATTENDED" }
            : item,
        );

        if (active) setItems(mapped);
      } catch (err) {
        if (active) {
          setError(err?.response?.data?.detail || err?.message || "Không thể tải danh sách đăng ký.");
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

  const filtered = items.filter((item) => `${item.title} ${item.date}`.toLowerCase().includes(query.toLowerCase()));
  const upcoming = filtered.filter(
    (item) => item.registrationStatus !== "CANCELLED" && item.registrationStatus !== "ATTENDED",
  );
  const history = filtered.filter(
    (item) => item.registrationStatus === "CANCELLED" || item.registrationStatus === "ATTENDED",
  );

  return (
    <StudentShell activeTop="Vé của tôi">
      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-5xl font-bold">Vé workshop của tôi</h1>
            <p className="mt-1 text-slate-500">
              Theo dõi trạng thái đăng ký, thanh toán và mã QR check-in cho từng workshop.
            </p>
          </div>
          <div className="flex w-full max-w-xs items-center rounded-lg border bg-white px-3 py-2">
            <Search className="mr-2 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-sm outline-none"
              placeholder="Tìm workshop đã đăng ký..."
            />
          </div>
        </div>

        <h2 className="mb-3 text-3xl font-semibold">Sắp diễn ra</h2>
        {loading ? <p className="mb-3 text-sm text-slate-500">Đang tải dữ liệu đăng ký...</p> : null}
        {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
        <div className="grid gap-4 md:grid-cols-2">
          {!loading &&
            !error &&
            upcoming.map((item) => (
              <article key={item.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <Link to={`/workshops/${item.workshopId}`}>
                  <div className="mb-3 h-40 overflow-hidden rounded-lg bg-gradient-to-r from-slate-900 to-blue-900" />
                </Link>
                <Link to={`/workshops/${item.workshopId}`} className="text-2xl font-bold hover:text-blue-700">
                  {item.title}
                </Link>
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
                    {regLabels[item.registrationStatus] || item.registrationStatus}
                  </span>
                  <span className={`rounded-full px-2 py-1 ${payStyles[item.paymentStatus]}`}>
                    {payLabels[item.paymentStatus] || item.paymentStatus}
                  </span>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    disabled={!item.qrCode}
                    onClick={() => setSelected(item)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Ticket className="h-4 w-4" />
                    {item.qrCode ? "QR check-in" : "Đang chờ QR"}
                  </button>
                  <Link
                    to={`/workshops/${item.workshopId}`}
                    className="flex items-center justify-center gap-1 rounded-lg border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    Chi tiết
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  {item.paymentStatus !== "COMPLETED" && item.registrationStatus !== "ATTENDED" ? (
                    <button
                      onClick={() => setConfirmItem(item)}
                      className="flex items-center justify-center rounded-lg border border-rose-200 px-3 py-2.5 text-rose-600 hover:bg-rose-50"
                      title="Hủy đăng ký"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          {!loading && !error && !upcoming.length ? (
            <p className="text-sm text-slate-500">Bạn chưa có đăng ký nào.</p>
          ) : null}
        </div>

        <section className="mt-8 rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-3xl font-semibold">Lịch sử / Đã hủy</h3>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-500">
                <tr>
                  <th className="px-3 py-2">WORKSHOP</th>
                  <th className="px-3 py-2">NGÀY</th>
                  <th className="px-3 py-2">TRẠNG THÁI</th>
                  <th className="px-3 py-2">THANH TOÁN</th>
                  <th className="px-3 py-2">MÃ QR</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-3 py-3">
                      <Link
                        to={`/workshops/${item.workshopId}`}
                        className="font-medium hover:text-blue-700 hover:underline"
                      >
                        {item.title}
                      </Link>
                    </td>
                    <td className="px-3 py-3">{item.date}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${regStyles[item.registrationStatus]}`}
                      >
                        {regLabels[item.registrationStatus] || item.registrationStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${payStyles[item.paymentStatus]}`}>
                        {payLabels[item.paymentStatus] || item.paymentStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-400">{item.qrCode || "Không có"}</td>
                  </tr>
                ))}
                {!loading && !error && !history.length ? (
                  <tr className="border-t">
                    <td className="px-3 py-3 text-slate-500" colSpan={5}>
                      Chưa có dữ liệu lịch sử.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <QRModal open={!!selected} workshop={selected} onClose={() => setSelected(null)} />

      {confirmItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h4 className="text-xl font-bold">Xác nhận hủy đăng ký</h4>
            <p className="mt-2 text-sm text-slate-600">
              Bạn có chắc muốn hủy đăng ký workshop{" "}
              <span className="font-semibold text-slate-800">{confirmItem.title}</span>?
            </p>
            <p className="mt-1 text-xs text-amber-600">Lưu ý: hành động này không thể hoàn tác.</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmItem(null)}
                disabled={cancelling}
                className="flex-1 rounded-lg border py-2.5 font-semibold text-slate-700 disabled:opacity-50"
              >
                Giữ lại
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 rounded-lg bg-rose-600 py-2.5 font-semibold text-white disabled:opacity-60"
              >
                {cancelling ? "Đang hủy..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </StudentShell>
  );
}
