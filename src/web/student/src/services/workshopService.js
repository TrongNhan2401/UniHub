import api from "./api";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1600&q=80";

function formatDateLabel(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
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
  if (isFree) return "Free";
  const amount = Number(price ?? 0);
  return `${amount.toLocaleString("vi-VN")} VND`;
}

function toAboutPoints(description, speakerName, room) {
  const points = [
    `Dien gia: ${speakerName || "Dang cap nhat"}`,
    `Dia diem: ${room || "Dang cap nhat"}`,
    description ? description.slice(0, 120) : "Noi dung chi tiet se duoc cap nhat.",
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
    title: raw?.title || "Untitled Workshop",
    code: String(raw?.id || "")
      .slice(0, 8)
      .toUpperCase(),
    speaker: raw?.speakerName || "Dang cap nhat",
    dateLabel: formatDateLabel(start),
    timeLabel: formatTimeLabel(start, end),
    shortTime: start ? new Date(start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "-",
    room: raw?.room || "Dang cap nhat",
    status: toUiWorkshopStatus(raw?.status, slotsLeft),
    image: raw?.imageUrl || PLACEHOLDER_IMAGE,
    description: raw?.description || "Noi dung workshop dang duoc cap nhat.",
    aboutPoints: toAboutPoints(raw?.description, raw?.speakerName, raw?.room),
    price: toPriceLabel(raw?.isFree, raw?.price),
    slotsLeft,
    capacity,
    location: raw?.room || "Dang cap nhat",
    roomMapUrl: raw?.roomMapUrl || "https://maps.google.com",
    speakerRole: raw?.speakerBio || "Dien gia workshop",
    materials: raw?.pdfUrl ? ["Workshop PDF"] : ["Tai lieu dang cap nhat"],
    aiSummary: raw?.aiSummary || "Tom tat AI se duoc cap nhat sau.",
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
    date: workshop?.dateLabel || "-",
    time: workshop?.timeLabel || "-",
    room: workshop?.room || "-",
    registrationStatus: raw?.status || "PENDING",
    paymentStatus: raw?.payment_status || "PENDING",
    qrCode: raw?.qr_code || null,
  };
}

export const authService = {
  login: (data) => api.post("/auth/signin", data),
};

export const workshopService = {
  getAll: async (params = {}) => {
    const { data } = await api.get("/workshops", {
      params: {
        pageNumber: 1,
        pageSize: 100,
        ...params,
      },
    });
    const items = Array.isArray(data?.items) ? data.items : [];
    return items.map(mapWorkshopToUi);
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
