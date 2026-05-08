import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, CreditCard, Loader2, RefreshCcw } from "lucide-react";
import StudentShell from "@/components/StudentShell";
import { getMyNotifications, getReadNotificationIds, markNotificationRead } from "@/services/notificationService";

function formatWhen(value) {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "Vừa xong";
  return dt.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function iconForType(type) {
  if (type === "PAYMENT_COMPLETED") {
    return <CreditCard className="h-4 w-4 text-emerald-600" />;
  }
  return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notificationId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [readIds, setReadIds] = useState(() => getReadNotificationIds());

  const selected = useMemo(() => {
    if (!items.length) return null;
    if (notificationId) {
      return items.find((it) => String(it.id) === String(notificationId)) || items[0];
    }
    return items[0];
  }, [items, notificationId]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyNotifications();
      setItems(data);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Không thể tải thông báo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selected) return;
    markNotificationRead(selected.id);
    setReadIds(getReadNotificationIds());

    if (notificationId !== selected.id) {
      navigate(`/notifications/${selected.id}`, { replace: true });
    }
  }, [selected, notificationId, navigate]);

  const handleSelect = (item) => {
    markNotificationRead(item.id);
    setReadIds(getReadNotificationIds());
    navigate(`/notifications/${item.id}`);
  };

  return (
    <StudentShell activeTop="Thông báo">
      <section className="min-h-[68vh]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Thông báo</h1>
            <p className="mt-1 text-sm text-slate-500">Theo dõi toàn bộ thông báo đăng ký và thanh toán của bạn.</p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
          >
            <RefreshCcw className="h-4 w-4" />
            Làm mới
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <aside className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Danh sách thông báo ({items.length})</p>
            </div>

            <div className="max-h-[68vh] overflow-y-auto p-2">
              {loading && (
                <div className="flex items-center gap-2 px-2 py-4 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải...
                </div>
              )}

              {!loading && error && <p className="px-2 py-4 text-sm text-rose-700">{error}</p>}

              {!loading && !error && items.length === 0 && (
                <p className="px-2 py-6 text-sm text-slate-500">Bạn chưa có thông báo nào.</p>
              )}

              {!loading &&
                !error &&
                items.map((item) => {
                  const isActive = selected?.id === item.id;
                  const unread = !readIds.has(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`mb-1 w-full rounded-lg px-2 py-2 text-left transition ${
                        isActive ? "bg-blue-50 ring-1 ring-blue-200" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex gap-2">
                        <div className="mt-0.5">{iconForType(item.type)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-600">{item.summary}</p>
                          <p className="mt-1 text-[11px] text-slate-400">{formatWhen(item.createdAt)}</p>
                        </div>
                        {unread ? <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" /> : null}
                      </div>
                    </button>
                  );
                })}
            </div>
          </aside>

          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            {!selected && !loading && !error && (
              <p className="text-sm text-slate-500">Hãy chọn một thông báo ở cột bên trái để xem chi tiết.</p>
            )}

            {selected && (
              <div>
                <h2 className="mb-1 text-xl font-bold text-slate-900">{selected.title}</h2>
                <p className="mb-4 text-xs text-slate-500">{formatWhen(selected.createdAt)}</p>
                <div className="rounded-xl" dangerouslySetInnerHTML={{ __html: selected.bodyHtml || "" }} />
              </div>
            )}
          </article>
        </div>
      </section>
    </StudentShell>
  );
}
