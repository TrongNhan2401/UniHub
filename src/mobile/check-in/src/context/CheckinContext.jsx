import React, { createContext, useContext, useMemo, useState } from "react";

const CheckinContext = createContext(null);

const WORKSHOPS = [
  {
    id: 5,
    title: "AI Basics for Students",
    room: "Hall B-12",
    start: "08:30",
  },
  {
    id: 6,
    title: "Career CV Clinic",
    room: "Lab 402",
    start: "14:00",
  },
];

const REGISTRATIONS = {
  5: [
    { registration_id: 1001, qr_code: "REG-1001", student_name: "Nguyen Van A", student_id: "SV2024001" },
    { registration_id: 1002, qr_code: "REG-1002", student_name: "Tran Thi B", student_id: "SV2024002" },
    { registration_id: 1003, qr_code: "REG-1003", student_name: "Le Quang C", student_id: "SV2024003" },
  ],
  6: [
    { registration_id: 2001, qr_code: "REG-2001", student_name: "Pham Gia D", student_id: "SV2023001" },
    { registration_id: 2002, qr_code: "REG-2002", student_name: "Hoang Minh E", student_id: "SV2023002" },
  ],
};

function buildSyncKey(deviceId, registrationId, checkedInAt) {
  const datePart = checkedInAt.slice(0, 10);
  return `${deviceId}:REG-${registrationId}:${datePart}`;
}

function parseRegistrationId(qrRaw) {
  const value = String(qrRaw || "")
    .trim()
    .toUpperCase();
  const matched = /^REG-(\d+)$/.exec(value);
  if (!matched) return null;
  return Number(matched[1]);
}

export function CheckinProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState(WORKSHOPS[0].id);
  const [cachedRegistrations, setCachedRegistrations] = useState([]);
  const [pendingCheckins, setPendingCheckins] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const [lastSyncSummary, setLastSyncSummary] = useState(null);

  const selectedWorkshop = useMemo(
    () => WORKSHOPS.find((w) => w.id === selectedWorkshopId) || WORKSHOPS[0],
    [selectedWorkshopId],
  );

  const preloadForWorkshop = (workshopId) => {
    const rows = REGISTRATIONS[workshopId] || [];
    setSelectedWorkshopId(workshopId);
    setCachedRegistrations(
      rows.map((r) => ({
        ...r,
        workshop_id: workshopId,
        cached_at: new Date().toISOString(),
      })),
    );
    return { success: true, total: rows.length };
  };

  const markRecent = (record) => {
    setRecentScans((prev) => [record, ...prev].slice(0, 20));
  };

  const processQr = (qrRaw) => {
    const now = new Date().toISOString();
    const registrationId = parseRegistrationId(qrRaw);
    if (!registrationId) {
      return { ok: false, status: "INVALID", message: "QR khong hop le. Dinh dang dung: REG-xxxx" };
    }

    const found = cachedRegistrations.find((r) => r.registration_id === registrationId);
    if (!found) {
      return {
        ok: false,
        status: "NOT_IN_WORKSHOP",
        message: "QR khong thuoc workshop dang check-in hoac chua preload du lieu.",
      };
    }

    const duplicateInPending = pendingCheckins.some(
      (p) => p.registration_id === registrationId && p.sync_status !== "FAILED",
    );
    const duplicateInRecent = recentScans.some((r) => r.registration_id === registrationId && r.result === "SUCCESS");
    if (duplicateInPending || duplicateInRecent) {
      return {
        ok: false,
        status: "ALREADY_CHECKED",
        message: "Sinh vien nay da duoc quet truoc do.",
        payload: found,
      };
    }

    if (isOnline) {
      const successRecord = {
        registration_id: registrationId,
        student_name: found.student_name,
        student_id: found.student_id,
        checked_in_at: now,
        workshop_id: selectedWorkshop.id,
        result: "SUCCESS",
        mode: "ONLINE",
      };
      markRecent(successRecord);
      return {
        ok: true,
        status: "SUCCESS",
        message: `${found.student_name} check-in thanh cong (online).`,
        payload: successRecord,
      };
    }

    const deviceId = "DEVICE-ABC";
    const syncKey = buildSyncKey(deviceId, registrationId, now);
    const pending = {
      registration_id: registrationId,
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
      registration_id: registrationId,
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
      message: `${found.student_name} da duoc luu offline, cho dong bo.`,
      payload: pending,
    };
  };

  const syncNow = () => {
    if (!isOnline) {
      return { ok: false, message: "Dang offline. Khong the dong bo." };
    }

    const queue = pendingCheckins.filter((p) => p.sync_status === "PENDING");
    if (!queue.length) {
      const summary = { total: 0, inserted: 0, duplicates: 0, failed: 0 };
      setLastSyncSummary(summary);
      return { ok: true, summary };
    }

    const summary = {
      total: queue.length,
      inserted: queue.length,
      duplicates: 0,
      failed: 0,
    };

    setPendingCheckins([]);
    setLastSyncSummary(summary);
    return { ok: true, summary };
  };

  const value = {
    isOnline,
    setIsOnline,
    workshops: WORKSHOPS,
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
