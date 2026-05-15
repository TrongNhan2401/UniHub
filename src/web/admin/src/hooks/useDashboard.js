import { useState, useEffect, useMemo } from "react";
import { workshopService } from "@/services/adminService";

function normalizeStatus(raw) {
  const value = String(raw || "").trim().toUpperCase();
  if (!value) return "PENDING";
  return value;
}

export function useDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workshops, setWorkshops] = useState([]);
  const [workshopDetails, setWorkshopDetails] = useState([]);

  useEffect(() => {
    let ignore = false;

    const loadDashboard = async () => {
      console.log("[useDashboard] Starting load...");
      setLoading(true);
      setError("");

      try {
        const pageSize = 100;
        const firstRes = await workshopService.getAll({ pageNumber: 1, pageSize });
        const firstData = firstRes?.data || {};
        let allWorkshops = firstData.items || [];
        const totalPages = Number(firstData.totalPages || 1);

        console.log(`[useDashboard] Found ${totalPages} pages of workshops.`);

        for (let page = 2; page <= totalPages; page += 1) {
          const res = await workshopService.getAll({ pageNumber: page, pageSize });
          allWorkshops = allWorkshops.concat(res?.data?.items || []);
        }

        console.log(`[useDashboard] Fetching details for ${allWorkshops.length} workshops...`);

        const detailResponses = await Promise.all(
          allWorkshops.map((w) => workshopService.getById(w.id).catch(() => null))
        );

        const details = detailResponses.map((res) => res?.data).filter(Boolean);

        if (!ignore) {
          console.log("[useDashboard] Loading complete. Setting state.");
          setWorkshops(allWorkshops);
          setWorkshopDetails(details);
        }
      } catch (err) {
        console.error("[useDashboard] Error loading dashboard:", err);
        if (!ignore) {
          setError(
            err?.response?.data?.detail || 
            err?.response?.data?.message || 
            "Không tải được số liệu dashboard."
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  const metrics = useMemo(() => {
    const totalWorkshops = workshops.length;
    const totalRegistrations = workshops.reduce(
      (sum, w) => sum + (Number(w.registeredCount) || 0), 
      0
    );
    const publishedWorkshops = workshops.filter((w) => w.status === "Published").length;
    return { totalWorkshops, totalRegistrations, publishedWorkshops };
  }, [workshops]);

  const allRegistrations = useMemo(() => {
    const registrations = [];
    workshopDetails.forEach((w) => {
      const workshopTitle = w?.title || "Workshop";
      (w?.registrations || []).forEach((r) => {
        registrations.push({
          id: r.id,
          userId: r.userId,
          userEmail: r.userEmail,
          status: normalizeStatus(r.status),
          createdAt: r.createdAt,
          workshopTitle,
        });
      });
    });
    return registrations;
  }, [workshopDetails]);

  return {
    loading,
    error,
    workshops,
    workshopDetails,
    metrics,
    allRegistrations,
    refresh: () => { /* Logic to refresh if needed */ }
  };
}
