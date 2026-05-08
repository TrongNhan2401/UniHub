import { registrationService, workshopService } from "@/services/workshopService";

const READ_KEY = "student_notifications_read_v1";

function normalizeStatus(value) {
  return String(value || "").toUpperCase();
}

function formatDateTime(value) {
  if (!value) return "Đang cập nhật";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "Đang cập nhật";
  return dt.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function getMyNotifications() {
  const [registrationsRes, workshops] = await Promise.all([
    registrationService.getMyRegistrations(),
    workshopService.getAll({ pageNumber: 1, pageSize: 100 }),
  ]);

  const workshopById = Object.fromEntries((workshops || []).map((w) => [String(w.id), w]));
  const registrations = registrationsRes?.data || [];
  const notifications = [];

  registrations.forEach((reg) => {
    const status = normalizeStatus(reg.status);
    const paymentStatus = normalizeStatus(reg.payment_status);
    const workshop = workshopById[String(reg.workshop_id)] || null;
    const workshopTitle = reg.workshop_title || workshop?.title || "Workshop";
    const room = workshop?.room || "Đang cập nhật";
    const startTime = workshop?.startTime || null;
    const qrCode = reg.qr_code || "-";
    const createdAt = reg.registered_at || new Date().toISOString();

    if (paymentStatus === "COMPLETED") {
      notifications.push({
        id: `${reg.id}-payment-completed`,
        type: "PAYMENT_COMPLETED",
        registrationId: reg.id,
        workshopId: reg.workshop_id,
        createdAt,
        title: `Thanh toán thành công - ${workshopTitle}`,
        summary: "Bạn đã thanh toán thành công. Vé và QR đã sẵn sàng.",
        bodyHtml: buildEmailLikeHtml({
          accent: "emerald",
          subtitle: "Thanh toán thành công",
          userName: "bạn",
          intro: "Thanh toán của bạn đã được xác nhận. Vé và mã QR đã sẵn sàng để check-in.",
          workshopTitle,
          room,
          startTime: formatDateTime(startTime),
          qrCode,
          amountLabel: "Đã thanh toán",
        }),
        detail: {
          badge: "THANH TOÁN THÀNH CÔNG",
          accent: "emerald",
          heading: "Xác nhận thanh toán thành công",
          workshopTitle,
          room,
          startTime: formatDateTime(startTime),
          qrCode,
        },
      });
      return;
    }

    if (status === "CONFIRMED" && paymentStatus === "NOT_REQUIRED") {
      notifications.push({
        id: `${reg.id}-registration-confirmed`,
        type: "REGISTRATION_CONFIRMED",
        registrationId: reg.id,
        workshopId: reg.workshop_id,
        createdAt,
        title: `Đăng ký thành công - ${workshopTitle}`,
        summary: "Bạn đã đăng ký workshop miễn phí thành công.",
        bodyHtml: buildEmailLikeHtml({
          accent: "blue",
          subtitle: "Đăng ký thành công",
          userName: "bạn",
          intro: "Bạn đã đăng ký workshop thành công. Vui lòng mang theo QR khi đến sự kiện.",
          workshopTitle,
          room,
          startTime: formatDateTime(startTime),
          qrCode,
        }),
        detail: {
          badge: "ĐĂNG KÝ THÀNH CÔNG",
          accent: "blue",
          heading: "Xác nhận đăng ký workshop",
          workshopTitle,
          room,
          startTime: formatDateTime(startTime),
          qrCode,
        },
      });
    }
  });

  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return notifications;
}

function buildEmailLikeHtml({
  accent,
  subtitle,
  userName,
  intro,
  workshopTitle,
  room,
  startTime,
  qrCode,
  amountLabel,
}) {
  const headerBg = accent === "emerald" ? "#15803d" : "#2563eb";
  const boxBg = accent === "emerald" ? "#f0fdf4" : "#eff6ff";
  const boxText = accent === "emerald" ? "#166534" : "#1e3a8a";

  return `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
      <div style="background:${headerBg};padding:18px 20px;color:white;">
        <div style="font-size:20px;font-weight:700;">UniHub Workshop</div>
        <div style="font-size:13px;opacity:.9;margin-top:4px;">${subtitle}</div>
      </div>
      <div style="padding:20px;">
        <p style="margin:0 0 14px;color:#334155;">Xin chào <strong>${escapeHtml(userName)}</strong>,</p>
        <p style="margin:0 0 14px;color:#334155;">${escapeHtml(intro)}</p>
        <div style="background:${boxBg};border-radius:10px;padding:12px 14px;margin:12px 0;">
          <p style="margin:0 0 8px;color:${boxText};"><strong>Workshop:</strong> ${escapeHtml(workshopTitle)}</p>
          <p style="margin:0 0 8px;color:${boxText};"><strong>Thời gian:</strong> ${escapeHtml(startTime)}</p>
          <p style="margin:0 0 8px;color:${boxText};"><strong>Phòng:</strong> ${escapeHtml(room)}</p>
          ${amountLabel ? `<p style="margin:0 0 8px;color:${boxText};"><strong>Trạng thái:</strong> ${escapeHtml(amountLabel)}</p>` : ""}
          <p style="margin:0;color:${boxText};"><strong>Mã QR:</strong> ${escapeHtml(qrCode || "-")}</p>
        </div>
        <p style="margin:0;color:#b45309;background:#fffbeb;border-left:4px solid #eab308;padding:10px 12px;border-radius:6px;">
          Vui lòng mang theo mã QR khi đến check-in tại sự kiện.
        </p>
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function getReadNotificationIds() {
  if (typeof localStorage === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function markNotificationRead(id) {
  if (!id) return;
  const ids = getReadNotificationIds();
  ids.add(id);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
  }
}

export function markNotificationsRead(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return;
  const current = getReadNotificationIds();
  ids.forEach((id) => current.add(id));
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(READ_KEY, JSON.stringify([...current]));
  }
}
