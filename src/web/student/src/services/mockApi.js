import { AxiosError } from "axios";
import { myRegistrations, workshops } from "@/data/mockData";

const REGISTRATIONS_KEY = "student_mock_registrations_v1";
const PAYMENTS_KEY = "student_mock_payments_v1";

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function response(config, data, status = 200) {
  const result = { config, data, headers: {}, status, statusText: status >= 400 ? "Error" : "OK" };
  if (status >= 400) {
    return Promise.reject(
      new AxiosError(data?.detail || "Mock API request failed.", AxiosError.ERR_BAD_REQUEST, config, null, result),
    );
  }
  return result;
}

function parseBody(data) {
  if (typeof data !== "string") return data || {};
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export default async function mockApiAdapter(config) {
  const method = (config.method || "get").toUpperCase();
  const requestUrl = new URL(config.url || "", config.baseURL || window.location.origin);
  const path = requestUrl.pathname.replace(/^\/api(?=\/|$)/, "");
  const registrations = readStorage(REGISTRATIONS_KEY, myRegistrations);
  const payments = readStorage(PAYMENTS_KEY, {});

  if (method === "GET" && path === "/workshops") {
    return response(config, { items: workshops });
  }

  const workshopMatch = path.match(/^\/workshops\/([^/]+)$/);
  if (method === "GET" && workshopMatch) {
    const workshop = workshops.find((item) => String(item.id) === workshopMatch[1]);
    if (!workshop) return response(config, { detail: "Workshop không tồn tại." }, 404);
    return response(config, workshop);
  }

  if (method === "GET" && path === "/registrations/mine") {
    return response(config, registrations);
  }

  if (method === "POST" && path === "/registrations") {
    const { workshop_id: workshopId } = parseBody(config.data);
    const workshop = workshops.find((item) => String(item.id) === String(workshopId));
    if (!workshop || workshop.status !== "Open" || workshop.registeredCount >= workshop.totalSlots) {
      return response(config, { detail: "Workshop không còn nhận đăng ký." }, 400);
    }

    const id = `MOCK-REG-${Date.now()}`;
    const registration = {
      id,
      workshop_id: workshop.id,
      workshop_title: workshop.title,
      status: workshop.isFree ? "CONFIRMED" : "PENDING",
      payment_status: workshop.isFree ? "NOT_REQUIRED" : "PENDING",
      qr_code: workshop.isFree ? `QR-${id}` : null,
      registered_at: new Date().toISOString(),
    };
    registrations.unshift(registration);
    workshop.registeredCount += 1;
    writeStorage(REGISTRATIONS_KEY, registrations);
    return response(config, registration, 201);
  }

  const registrationMatch = path.match(/^\/registrations\/([^/]+)$/);
  if (method === "GET" && registrationMatch) {
    const registration = registrations.find((item) => item.id === registrationMatch[1]);
    return registration
      ? response(config, registration)
      : response(config, { detail: "Không tìm thấy đăng ký." }, 404);
  }
  if (method === "DELETE" && registrationMatch) {
    const registration = registrations.find((item) => item.id === registrationMatch[1]);
    if (registration) registration.status = "CANCELLED";
    writeStorage(REGISTRATIONS_KEY, registrations);
    return response(config, registration || {});
  }

  const checkInMatch = path.match(/^\/checkins\/workshops\/([^/]+)$/);
  if (method === "GET" && checkInMatch) {
    return response(config, []);
  }

  const checkoutMatch = path.match(/^\/payments\/registrations\/([^/]+)\/checkout$/);
  if (method === "POST" && checkoutMatch) {
    const registration = registrations.find((item) => item.id === checkoutMatch[1]);
    if (!registration) return response(config, { detail: "Không tìm thấy đăng ký." }, 404);

    registration.status = "CONFIRMED";
    registration.payment_status = "COMPLETED";
    registration.qr_code = `QR-${registration.id}`;
    payments[registration.id] = { status: "COMPLETED", registration_id: registration.id };
    writeStorage(REGISTRATIONS_KEY, registrations);
    writeStorage(PAYMENTS_KEY, payments);

    const query = new URLSearchParams({
      code: "00",
      status: "PAID",
      orderCode: registration.id,
      workshopId: String(registration.workshop_id),
      registrationId: registration.id,
    });
    return response(config, { checkout_url: `${window.location.origin}/payment/result?${query}` });
  }

  const paymentMatch = path.match(/^\/payments\/registrations\/([^/]+)$/);
  if (method === "GET" && paymentMatch) {
    return response(config, payments[paymentMatch[1]] || { status: "PENDING" });
  }

  if (method === "POST" && /^\/auth\/(signin|signup)$/.test(path)) {
    return response(config, {
      accessToken: "mock-student-token",
      user: { fullName: "Sinh viên thử nghiệm", role: "STUDENT", email: "student@example.com" },
    });
  }

  throw new Error(`Mock API route chưa hỗ trợ: ${method} ${path}`);
}
