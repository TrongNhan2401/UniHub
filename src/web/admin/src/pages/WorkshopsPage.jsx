import React, { useEffect, useMemo, useState } from "react";
import {
  Pencil,
  Trash2,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  GraduationCap,
  Users,
  ClipboardList,
} from "lucide-react";
import AdminShell from "@/components/AdminShell";
import CreateWorkshopModal from "@/components/CreateWorkshopModal";
import { workshopService } from "@/services/adminService";

const statusStyles = {
  Published: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-rose-100 text-rose-700",
  Draft: "bg-amber-100 text-amber-700",
};

const statusLabels = {
  Published: "Đã xuất bản",
  Cancelled: "Đã hủy",
  Draft: "Bản nháp",
};

function toLocalDateTimeInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function toDateLabel(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
}

function toTimeLabel(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function buildWorkshopFormData(workshop, overrides = {}) {
  const merged = { ...workshop, ...overrides };
  const fd = new FormData();
  fd.append("title", merged.title || "");
  fd.append("description", merged.description || "");
  fd.append("speakerName", merged.speakerName || "");
  fd.append("speakerBio", merged.speakerBio || "");
  fd.append("room", merged.room || "");
  fd.append("roomMapUrl", merged.roomMapUrl || "");
  fd.append("startTime", merged.startTime || "");
  fd.append("endTime", merged.endTime || "");
  fd.append("totalSlots", String(Number(merged.totalSlots) || 0));
  fd.append("isFree", String(Boolean(merged.isFree)));
  fd.append("price", String(Number(merged.price) || 0));
  return fd;
}

export default function WorkshopsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [cancelingId, setCancelingId] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;
  const [paged, setPaged] = useState({
    items: [],
    totalCount: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
    pageNumber: 1,
    pageSize,
  });

  const loadWorkshops = async (targetPage = pageNumber) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await workshopService.getAll({ pageNumber: targetPage, pageSize });
      setPaged({
        items: data?.items || [],
        totalCount: data?.totalCount || 0,
        totalPages: data?.totalPages || 1,
        hasPreviousPage: Boolean(data?.hasPreviousPage),
        hasNextPage: Boolean(data?.hasNextPage),
        pageNumber: data?.pageNumber || targetPage,
        pageSize: data?.pageSize || pageSize,
      });
      setPageNumber(data?.pageNumber || targetPage);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || "Không tải được danh sách workshop.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkshops(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return paged.items;
    return paged.items.filter(
      (w) => (w.title || "").toLowerCase().includes(q) || (w.speakerName || "").toLowerCase().includes(q),
    );
  }, [paged.items, query]);

  const metrics = useMemo(() => {
    const total = paged.totalCount || 0;
    const registrationCount = paged.items.reduce((sum, w) => sum + (Number(w.registeredCount) || 0), 0);
    const draftCount = paged.items.filter((w) => String(w.status) === "Draft").length;
    return { total, registrationCount, draftCount };
  }, [paged]);

  const handleCreateWorkshop = async (form) => {
    setCreating(true);
    setSubmitError("");
    try {
      const fd = new FormData();
      fd.append("title", form.title || "");
      fd.append("description", form.description || "");
      fd.append("speakerName", form.speaker || "");
      fd.append("speakerBio", "");
      fd.append("room", form.room || "");
      fd.append("roomMapUrl", "");
      fd.append("startTime", `${form.date}T${form.startTime}`);
      fd.append("endTime", `${form.date}T${form.endTime}`);
      fd.append("totalSlots", String(Number(form.totalSlots) || 0));
      fd.append("isFree", String(Boolean(form.isFree)));
      fd.append("price", String(form.isFree ? 0 : Number(form.price) || 0));
      await workshopService.create(fd);
      setIsCreateModalOpen(false);
      await loadWorkshops(1);
    } catch (err) {
      setSubmitError(err?.response?.data?.detail || err?.response?.data?.message || "Không tạo được workshop.");
    } finally {
      setCreating(false);
    }
  };

  const handleQuickEditTitle = async (id) => {
    if (!id) return;
    setUpdatingId(id);
    setError("");
    try {
      const { data: detail } = await workshopService.getById(id);
      const nextTitle = window.prompt("Nhập tiêu đề mới", detail?.title || "");
      if (nextTitle === null) return;
      const fd = buildWorkshopFormData(detail, {
        title: nextTitle.trim() || detail?.title || "",
        startTime: toLocalDateTimeInput(detail?.startTime),
        endTime: toLocalDateTimeInput(detail?.endTime),
      });
      await workshopService.update(id, fd);
      await loadWorkshops(pageNumber);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || "Không cập nhật được workshop.");
    } finally {
      setUpdatingId("");
    }
  };

  const handleCancelWorkshop = async (id) => {
    if (!id) return;
    if (!window.confirm("Bạn chắc chắn muốn hủy workshop này?")) return;
    setCancelingId(id);
    setError("");
    try {
      await workshopService.cancel(id);
      await loadWorkshops(pageNumber);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || "Không hủy được workshop.");
    } finally {
      setCancelingId("");
    }
  };

  const goToPrevPage = () => {
    if (paged.hasPreviousPage) loadWorkshops(pageNumber - 1);
  };

  const goToNextPage = () => {
    if (paged.hasNextPage) loadWorkshops(pageNumber + 1);
  };

  return (
    <AdminShell activeTop="Quản lý Workshop">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-5xl font-bold tracking-tight">Quản lý Workshop</h1>
          <p className="mt-1 text-slate-500">
            Kiểm soát và theo dõi tất cả các workshop học thuật trong khuôn viên trường.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
        >
          + Thêm Workshop Mới
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<GraduationCap className="h-6 w-6 text-blue-600" />}
          label="TỔNG WORKSHOP"
          value={String(metrics.total)}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<Users className="h-6 w-6 text-emerald-600" />}
          label="LƯỢT ĐĂNG KÝ"
          value={metrics.registrationCount.toLocaleString("vi-VN")}
          bg="bg-emerald-50"
        />
        <StatCard
          icon={<ClipboardList className="h-6 w-6 text-amber-600" />}
          label="CHỜ PHÊ DUYỆT"
          value={String(metrics.draftCount)}
          bg="bg-amber-50"
        />
      </div>

      {error ? <p className="mb-4 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p> : null}

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex w-full max-w-sm items-center rounded-lg border px-3 py-2">
            <Search className="mr-2 h-4 w-4 text-slate-400" />
            <input
              className="w-full text-sm outline-none"
              placeholder="Lọc theo tiêu đề hoặc diễn giả..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
              <Filter className="h-4 w-4" /> Bộ lọc
            </button>
            <button className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
              <Download className="h-4 w-4" /> Xuất file
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border-t">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium text-xs tracking-wider">TIÊU ĐỀ</th>
                <th className="px-5 py-3 font-medium text-xs tracking-wider">DIỄN GIẢ</th>
                <th className="px-5 py-3 font-medium text-xs tracking-wider">NGÀY</th>
                <th className="px-5 py-3 font-medium text-xs tracking-wider">PHÒNG</th>
                <th className="px-5 py-3 font-medium text-xs tracking-wider">TRẠNG THÁI</th>
                <th className="px-5 py-3 font-medium text-xs tracking-wider">THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-5 py-8 text-center text-slate-500" colSpan={6}>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : null}
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td className="px-5 py-8 text-center text-slate-500" colSpan={6}>
                    Không có workshop phù hợp.
                  </td>
                </tr>
              ) : null}
              {filtered.map((item) => (
                <tr key={item.id} className="border-t hover:bg-slate-50/50">
                  <td className="px-5 py-4">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs text-slate-500">ID: {String(item.id).slice(0, 8)}</p>
                  </td>
                  <td className="px-5 py-4">{item.speakerName}</td>
                  <td className="px-5 py-4">
                    <p>{toDateLabel(item.startTime)}</p>
                    <p className="text-xs text-slate-500">{toTimeLabel(item.startTime)}</p>
                  </td>
                  <td className="px-5 py-4">{item.room}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[item.status] || "bg-slate-100 text-slate-700"}`}
                    >
                      {statusLabels[item.status] || item.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-3 text-slate-400">
                      <button
                        className="hover:text-blue-600 disabled:opacity-40"
                        onClick={() => handleQuickEditTitle(item.id)}
                        disabled={updatingId === item.id || cancelingId === item.id}
                        title="Cập nhật nhanh tiêu đề"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        className="hover:text-red-600 disabled:opacity-40"
                        onClick={() => handleCancelWorkshop(item.id)}
                        disabled={cancelingId === item.id || updatingId === item.id}
                        title="Hủy workshop"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t px-5 py-3 text-sm text-slate-500">
          <p>
            Hiển thị {filtered.length} trong tổng số {paged.totalCount} kết quả (trang {pageNumber}/
            {paged.totalPages || 1})
          </p>
          <div className="flex items-center gap-1">
            <button
              className="rounded-md border p-1.5 hover:bg-slate-50 disabled:opacity-40"
              onClick={goToPrevPage}
              disabled={!paged.hasPreviousPage || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="rounded-md border border-blue-600 bg-blue-600 px-3 py-1.5 text-white">
              {pageNumber}
            </button>
            <button
              className="rounded-md border p-1.5 hover:bg-slate-50 disabled:opacity-40"
              onClick={goToNextPage}
              disabled={!paged.hasNextPage || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm text-white">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        Bảng điều khiển tự động đồng bộ với lịch trình chính.
      </div>

      <CreateWorkshopModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSubmitError("");
        }}
        onSubmit={handleCreateWorkshop}
        loading={creating}
        error={submitError}
      />
    </AdminShell>
  );
}

function StatCard({ icon, label, value, bg }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>{icon}</div>
      <div>
        <p className="text-xs tracking-widest text-slate-500">{label}</p>
        <p className="text-4xl font-bold">{value}</p>
      </div>
    </div>
  );
}
