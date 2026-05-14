import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { checkinService } from "../services/api";

const CheckinContext = createContext(null);

const STORAGE_KEYS = {
  selectedWorkshopId: "checkin_selected_workshop_id",
  cachedRegistrations: "checkin_cached_registrations",
  pendingCheckins: "checkin_pending_checkins",
  recentScans: "checkin_recent_scans",
  deviceId: "checkin_device_id",
};

const FALLBACK_WORKSHOP = {
  id: "",
  title: "Chưa có workshop",
  room: "-",
  start: "-",
};

function normalizeQr(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function toIso(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

function toDisplayTime(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function mapWorkshop(item) {
  return {
    id: String(item?.id || ""),
    title: item?.title || "Workshop",
    room: item?.room || "-",
    start: toDisplayTime(item?.startTime),
  };
}

function mapRegistration(item, workshopId) {
  return {
    registration_id: String(item?.registration_id || item?.registrationId || ""),
    qr_code: normalizeQr(item?.qr_code || item?.qrCode),
    student_name: item?.student_name || item?.studentName || "Sinh vien",
    student_id: item?.student_id || item?.studentId || "",
    student_email: item?.student_email || item?.studentEmail || "",
    workshop_id: String(workshopId || item?.workshop_id || item?.workshopId || ""),
    cached_at: new Date().toISOString(),
  };
}

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function buildSyncKey(deviceId, qrCode, checkedInAt) {
  const datePart = toIso(checkedInAt).slice(0, 10);
  return `${deviceId}:${qrCode}:${datePart}`;
}

function mapApiError(error) {
  const code = error?.response?.data?.code || error?.response?.data?.extensions?.code;
  const detail = error?.response?.data?.detail;

  if (detail) {
    return { code, message: detail };
  }

  return {
    code,
    message: "Không thể kết nối đến máy chủ. Vui lòng thử lại.",
  };
}

async function loadJson(key, fallback) {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function CheckinProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const [deviceId, setDeviceId] = useState("DEVICE-LOCAL");
  const [workshops, setWorkshops] = useState([]);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState("");
  const [cachedRegistrations, setCachedRegistrations] = useState([]);
  const [pendingCheckins, setPendingCheckins] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const [lastSyncSummary, setLastSyncSummary] = useState(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const [storedWorkshopId, storedCache, storedPending, storedRecent, storedDeviceId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.selectedWorkshopId),
        loadJson(STORAGE_KEYS.cachedRegistrations, []),
        loadJson(STORAGE_KEYS.pendingCheckins, []),
        loadJson(STORAGE_KEYS.recentScans, []),
        AsyncStorage.getItem(STORAGE_KEYS.deviceId),
      ]);

      if (!mounted) return;

      const nextDeviceId = storedDeviceId || `DEVICE-${Date.now()}`;
      setDeviceId(nextDeviceId);
      setSelectedWorkshopId(storedWorkshopId || "");
      setCachedRegistrations(Array.isArray(storedCache) ? storedCache : []);
      setPendingCheckins(Array.isArray(storedPending) ? storedPending : []);
      setRecentScans(Array.isArray(storedRecent) ? storedRecent : []);

      if (!storedDeviceId) {
        await AsyncStorage.setItem(STORAGE_KEYS.deviceId, nextDeviceId);
      }

      await refreshWorkshops(storedWorkshopId || "");
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.selectedWorkshopId, selectedWorkshopId || "");
  }, [selectedWorkshopId]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.cachedRegistrations, JSON.stringify(cachedRegistrations));
  }, [cachedRegistrations]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.pendingCheckins, JSON.stringify(pendingCheckins));
  }, [pendingCheckins]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.recentScans, JSON.stringify(recentScans));
  }, [recentScans]);

  // NetInfo listener - auto detect network state changes
  const prevOnlineRef = useRef(true);

  useEffect(() => {
    // Subscribe tới NetInfo state changes
    const unsubscribe = NetInfo.addEventListener(({ isConnected, isInternetReachable }) => {
      const isOnlineNow = isConnected && isInternetReachable !== false;
      setIsOnline(isOnlineNow);
      prevOnlineRef.current = isOnlineNow;
    });

    // Lấy trạng thái ban đầu
    NetInfo.fetch().then(({ isConnected, isInternetReachable }) => {
      const isOnlineNow = isConnected && isInternetReachable !== false;
      setIsOnline(isOnlineNow);
      prevOnlineRef.current = isOnlineNow;
    });

    return () => unsubscribe();
  }, []);

  // Auto-sync khi từ offline chuyển sang online
  useEffect(() => {
    if (isOnline && pendingCheckins.length > 0) {
      // Delay 500ms để tránh race condition khi mạng vừa kết nối
      const timer = setTimeout(() => {
        syncNow();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingCheckins.length]);

  async function refreshWorkshops(preferredWorkshopId = "") {
    try {
      const response = await checkinService.getWorkshops({ pageNumber: 1, pageSize: 100 });
      const mapped = toArray(response.data)
        .map(mapWorkshop)
        .filter((w) => w.id);

      setWorkshops(mapped);

      if (!mapped.length) {
        setSelectedWorkshopId("");
        return;
      }

      const preferred = preferredWorkshopId || selectedWorkshopId;
      const found = mapped.some((w) => w.id === preferred);
      setSelectedWorkshopId(found ? preferred : mapped[0].id);
    } catch {
      setWorkshops([]);
    }
  }

  const selectedWorkshop = useMemo(() => {
    return workshops.find((w) => w.id === selectedWorkshopId) || workshops[0] || FALLBACK_WORKSHOP;
  }, [selectedWorkshopId, workshops]);

  const markRecent = (record) => {
    setRecentScans((prev) => [record, ...prev].slice(0, 20));
  };

  const syncNow = async () => {
    if (!isOnline) {
      return { ok: false, message: "Đang ngoại tuyến. Không thể đồng bộ." };
    }

    const queue = pendingCheckins.filter((p) => p.sync_status === "PENDING");
    if (!queue.length) {
      const summary = { total: 0, inserted: 0, duplicates: 0, failed: 0 };
      setLastSyncSummary(summary);
      return { ok: true, summary };
    }

    try {
      const response = await checkinService.sync(
        queue.map((item) => ({
          registration_id: item.registration_id,
          workshop_id: item.workshop_id,
          device_id: item.device_id,
          checked_in_at: toIso(item.checked_in_at),
          sync_key: item.sync_key,
        })),
      );

      const summary = response.data || {
        total: queue.length,
        inserted: 0,
        duplicates: 0,
        failed: queue.length,
      };

      const removableSyncKeys = new Set(
        (summary.results || [])
          .filter((result) => result.status === "inserted" || result.status === "duplicate")
          .map((result) => result.sync_key),
      );

      setPendingCheckins((prev) => prev.filter((item) => !removableSyncKeys.has(item.sync_key)));
      setLastSyncSummary(summary);
      return { ok: true, summary };
    } catch (error) {
      const mappedError = mapApiError(error);
      return { ok: false, message: mappedError.message };
    }
  };

  const preloadForWorkshop = async (workshopId) => {
    if (!workshopId) {
      return { success: false, total: 0, message: "Chưa chọn workshop." };
    }

    try {
      const response = await checkinService.preloadRegistrations(workshopId);
      const rows = toArray(response.data)
        .map((item) => mapRegistration(item, workshopId))
        .filter((r) => r.registration_id && r.qr_code);

      setSelectedWorkshopId(String(workshopId));
      setCachedRegistrations(rows);

      return { success: true, total: rows.length };
    } catch (error) {
      const mappedError = mapApiError(error);
      return { success: false, total: 0, message: mappedError.message };
    }
  };

  const processQr = async (qrRaw) => {
    const now = new Date().toISOString();
    const qrCode = normalizeQr(qrRaw);

    if (!qrCode) {
      return { ok: false, status: "INVALID", message: "Mã QR không hợp lệ." };
    }

    const found = cachedRegistrations.find(
      (r) => normalizeQr(r.qr_code) === qrCode && String(r.workshop_id) === String(selectedWorkshop.id),
    );

    const duplicateInPending = pendingCheckins.some(
      (p) => String(p.registration_id) === String(found?.registration_id) && p.sync_status !== "FAILED",
    );
    const duplicateInRecent = recentScans.some(
      (r) => String(r.registration_id) === String(found?.registration_id) && r.result === "SUCCESS",
    );

    if (found && (duplicateInPending || duplicateInRecent)) {
      return {
        ok: false,
        status: "ALREADY_CHECKED",
        message: "Sinh viên này đã được quét trước đó.",
        payload: found,
      };
    }

    if (isOnline) {
      try {
        if (found?.registration_id) {
          const validate = await checkinService.validateRegistration(found.registration_id, selectedWorkshop.id);
          if (validate.data?.already_checked_in) {
            return {
              ok: false,
              status: "ALREADY_CHECKED",
              message: "Sinh viên này đã check-in trước đó.",
              payload: {
                registration_id: found.registration_id,
                student_name: validate.data.student_name || found.student_name,
                student_id: validate.data.student_id || found.student_id,
              },
            };
          }
        }

        const payloadQr = found?.qr_code || qrCode;
        const checkinResponse = await checkinService.checkin({ qr_code: payloadQr });
        const payload = checkinResponse.data || {};

        const successRecord = {
          registration_id: String(payload.registration_id || found?.registration_id || ""),
          student_name: found?.student_name || "Sinh viên",
          student_id: found?.student_id || "",
          checked_in_at: payload.checked_in_at || now,
          workshop_id: String(payload.workshop_id || selectedWorkshop.id),
          result: "SUCCESS",
          mode: "ONLINE",
        };

        markRecent(successRecord);

        return {
          ok: true,
          status: "SUCCESS",
          message: `${successRecord.student_name} check-in thành công (trực tuyến).`,
          payload: successRecord,
        };
      } catch (error) {
        const mappedError = mapApiError(error);
        if (mappedError.code === "already_checked_in") {
          return {
            ok: false,
            status: "ALREADY_CHECKED",
            message: mappedError.message,
          };
        }

        if (mappedError.code === "registration_not_found") {
          return {
            ok: false,
            status: "NOT_FOUND",
            message: mappedError.message,
          };
        }

        return {
          ok: false,
          status: "FAILED",
          message: mappedError.message,
        };
      }
    }

    if (!found) {
      return {
        ok: false,
        status: "NOT_IN_WORKSHOP",
        message: "Mã QR không thuộc workshop đang check-in hoặc chưa tải trước dữ liệu.",
      };
    }

    const syncKey = buildSyncKey(deviceId, qrCode, now);
    const pending = {
      registration_id: found.registration_id,
      workshop_id: selectedWorkshop.id,
      device_id: deviceId,
      checked_in_at: now,
      sync_key: syncKey,
      sync_status: "PENDING",
      student_name: found.student_name,
      student_id: found.student_id,
    };

    setPendingCheckins((prev) => [pending, ...prev]);
    markRecent({
      registration_id: found.registration_id,
      student_name: found.student_name,
      student_id: found.student_id,
      checked_in_at: now,
      workshop_id: selectedWorkshop.id,
      result: "PENDING_SYNC",
      mode: "OFFLINE",
    });

    return {
      ok: true,
      status: "PENDING_SYNC",
      message: `${found.student_name} đã được lưu ngoại tuyến, chờ đồng bộ.`,
      payload: pending,
    };
  };

  const value = {
    isOnline,
    setIsOnline,
    workshops,
    selectedWorkshop,
    selectedWorkshopId,
    setSelectedWorkshopId,
    cachedRegistrations,
    pendingCheckins,
    recentScans,
    lastSyncSummary,
    preloadForWorkshop,
    processQr,
    syncNow,
    refreshWorkshops,
  };

  return <CheckinContext.Provider value={value}>{children}</CheckinContext.Provider>;
}

export function useCheckin() {
  const ctx = useContext(CheckinContext);
  if (!ctx) {
    throw new Error("useCheckin must be used within CheckinProvider");
  }
  return ctx;
}
