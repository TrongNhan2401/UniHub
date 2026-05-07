import api from "./api";

const WORKSHOP_CACHE_KEY = "student_workshops_cache_v1";
const WORKSHOP_CACHE_TTL_MS = 30 * 1000;
let workshopCache = null;

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1600&q=80";

function formatDateLabel(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatTimeLabel(start, end) {
  if (!start || !end) return "-";
  const s = new Date(start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const e = new Date(end).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${s} - ${e}`;
}

function toUiWorkshopStatus(rawStatus, slotsLeft) {
  if (rawStatus === "Cancelled") return "CANCELLED";
  if (slotsLeft <= 0) return "FULL";
  return "OPEN";
}

function toPriceLabel(isFree, price) {
  if (isFree) return "Miễn phí";
  const amount = Number(price ?? 0);
  return `${amount.toLocaleString("vi-VN")} VND`;
}

function toAboutPoints(description, speakerName, room) {
  const points = [
    `Diễn giả: ${speakerName || "Đang cập nhật"}`,
    `Địa điểm: ${room || "Đang cập nhật"}`,
    description ? description.slice(0, 120) : "Nội dung chi tiết sẽ được cập nhật.",
  ];
  return points;
}

export function mapWorkshopToUi(raw) {
  const capacity = Number(raw?.totalSlots ?? 0);
  const registered = Number(raw?.registeredCount ?? 0);
  const slotsLeft = Math.max(capacity - registered, 0);
  const start = raw?.startTime;
  const end = raw?.endTime;

  return {
    id: raw?.id,
    title: raw?.title || "Workshop chưa có tiêu đề",
    code: String(raw?.id || "")
      .slice(0, 8)
      .toUpperCase(),
    speaker: raw?.speakerName || "Đang cập nhật",
    dateLabel: formatDateLabel(start),
    timeLabel: formatTimeLabel(start, end),
    shortTime: start ? new Date(start).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "-",
    room: raw?.room || "Đang cập nhật",
    status: toUiWorkshopStatus(raw?.status, slotsLeft),
    image: raw?.imageUrl || PLACEHOLDER_IMAGE,
    description: raw?.description || "Nội dung workshop đang được cập nhật.",
    aboutPoints: toAboutPoints(raw?.description, raw?.speakerName, raw?.room),
    price: toPriceLabel(raw?.isFree, raw?.price),
    slotsLeft,
    capacity,
    location: raw?.room || "Đang cập nhật",
    roomMapUrl: raw?.roomMapUrl || "https://maps.google.com",
    speakerRole: raw?.speakerBio || "Diễn giả workshop",
    materials: raw?.pdfUrl ? ["Tài liệu PDF workshop"] : ["Tài liệu đang cập nhật"],
    aiSummary: raw?.aiSummary || "Tóm tắt AI sẽ được cập nhật sau.",
    isFree: Boolean(raw?.isFree),
    startTime: start,
    endTime: end,
  };
}

export function mapRegistrationToUi(raw, workshopById = {}) {
  const workshop = workshopById?.[raw?.workshop_id] || {};
  return {
    id: raw?.id,
    workshopId: raw?.workshop_id,
    title: workshop?.title || raw?.workshop_title || "Workshop",
    date: workshop?.dateLabel || "Đang cập nhật",
    time: workshop?.timeLabel || "Đang cập nhật",
    room: workshop?.room || "-",
    registrationStatus: raw?.status || "PENDING",
    paymentStatus: raw?.payment_status || "PENDING",
    qrCode: raw?.qr_code || null,
  };
}

export const authService = {
  signup: (data) => api.post("/auth/signup", data),
  login: (data) => api.post("/auth/signin", data),
};

export const workshopService = {
  getAll: async (params = {}) => {
    const now = Date.now();

    // Prefer memory cache first to avoid network wait when users move between pages.
    if (workshopCache && now - workshopCache.ts < WORKSHOP_CACHE_TTL_MS) {
      return workshopCache.items;
    }

    // Restore cache across refresh in the same browser session.
    if (typeof sessionStorage !== "undefined") {
      try {
        const cachedRaw = sessionStorage.getItem(WORKSHOP_CACHE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (cached?.ts && Array.isArray(cached?.items) && now - cached.ts < WORKSHOP_CACHE_TTL_MS) {
            workshopCache = cached;
            return cached.items;
          }
        }
      } catch {
        // Ignore malformed cache and continue with network fetch.
      }
    }

    const { data } = await api.get("/workshops", {
      params: {
        pageNumber: 1,
        pageSize: 100,
        ...params,
      },
    });
    const items = Array.isArray(data?.items) ? data.items : [];
    const mapped = items.map(mapWorkshopToUi);

    workshopCache = { ts: now, items: mapped };
    if (typeof sessionStorage !== "undefined") {
      try {
        sessionStorage.setItem(WORKSHOP_CACHE_KEY, JSON.stringify(workshopCache));
      } catch {
        // Ignore storage quota issues.
      }
    }

    return mapped;
  },

  getById: async (id) => {
    const { data } = await api.get(`/workshops/${id}`);
    return mapWorkshopToUi(data);
  },
};

export const registrationService = {
  register: (workshopId, idempotencyKey) =>
    api.post(
      "/registrations",
      { workshop_id: workshopId },
      {
        headers: { "Idempotency-Key": idempotencyKey },
      },
    ),

  getById: (registrationId) => api.get(`/registrations/${registrationId}`),

  cancel: (registrationId) => api.delete(`/registrations/${registrationId}`),

  getMyRegistrations: () => api.get("/registrations/mine"),
};

export const checkInService = {
  getByWorkshop: (workshopId) => api.get(`/checkins/workshops/${workshopId}`),
};

export const paymentService = {
  checkout: (registrationId, idempotencyKey) =>
    api.post(`/payments/registrations/${registrationId}/checkout`, null, {
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
    }),

  getByRegistration: (registrationId) => api.get(`/payments/registrations/${registrationId}`),
};

export function generateIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
