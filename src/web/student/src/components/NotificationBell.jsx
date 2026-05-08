import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import {
  getMyNotifications,
  getReadNotificationIds,
  markNotificationRead,
  markNotificationsRead,
} from "@/services/notificationService";

function formatWhen(value) {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "Vừa xong";
  return dt.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function iconForType(type) {
  if (type === "PAYMENT_COMPLETED") return <CreditCard className="h-4 w-4 text-emerald-600" />;
  return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [readIds, setReadIds] = useState(() => getReadNotificationIds());

  const unreadCount = useMemo(() => items.filter((item) => !readIds.has(item.id)).length, [items, readIds]);

  const loadNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyNotifications();
      setItems(data);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Không tải được thông báo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 60000);
    return () => clearInterval(timer);
  }, []);

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);

    if (next) {
      markNotificationsRead(items.map((it) => it.id));
      setReadIds(getReadNotificationIds());
      await loadNotifications();
    }
  };

  const openDetailPage = (item) => {
    markNotificationRead(item.id);
    setReadIds(getReadNotificationIds());
    setOpen(false);
    navigate(`/notifications/${item.id}`);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        className="relative rounded-full p-2 text-slate-600 transition hover:bg-slate-200/70"
        aria-label="Mở thông báo"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[360px] rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Thông báo</p>
            <button onClick={loadNotifications} className="text-xs font-medium text-blue-600 hover:text-blue-700">
              Làm mới
            </button>
          </div>

          <div className="max-h-[380px] overflow-y-auto p-2">
            {loading && (
              <div className="flex items-center gap-2 px-2 py-5 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải thông báo...
              </div>
            )}

            {!loading && error && <p className="px-2 py-4 text-sm text-rose-700">{error}</p>}

            {!loading && !error && items.length === 0 && (
              <p className="px-2 py-6 text-center text-sm text-slate-500">Bạn chưa có thông báo nào.</p>
            )}

            {!loading &&
              !error &&
              items.map((item) => {
                const unread = !readIds.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => openDetailPage(item)}
                    className="mb-1 w-full rounded-lg px-2 py-2 text-left transition hover:bg-slate-50"
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

          <div className="border-t px-3 py-2">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block rounded-md px-2 py-2 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50"
            >
              Xem trang thông báo
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
