import React, { useMemo, useState } from "react";
import {
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  GraduationCap,
  Users,
  ClipboardList,
  MoreVertical,
  Calendar,
  MapPin,
  Plus,
  Eye,
} from "lucide-react";
import AdminShell from "@/components/AdminShell";
import CreateWorkshopModal from "@/components/CreateWorkshopModal";
import { useWorkshopsList, useCancelWorkshop } from "@/hooks/useWorkshops";
import { useNavigate } from "react-router-dom";

const statusStyles = {
  Published: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Cancelled: "bg-rose-50 text-rose-700 border-rose-100",
  Draft: "bg-amber-50 text-amber-700 border-amber-100",
};

const statusLabels = {
  Published: "Đã xuất bản",
  Cancelled: "Đã hủy",
  Draft: "Bản nháp",
};

function toDateLabel(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function toTimeLabel(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function WorkshopsPage() {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  const { data: pagedData, isLoading, refetch } = useWorkshopsList({ pageNumber, pageSize });
  const cancelMutation = useCancelWorkshop();

  const filteredItems = useMemo(() => {
    const items = pagedData?.items || [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (w) => (w.title || "").toLowerCase().includes(q) || (w.speakerName || "").toLowerCase().includes(q),
    );
  }, [pagedData?.items, query]);

  const metrics = useMemo(() => {
    const total = pagedData?.totalCount || 0;
    const registrationCount = pagedData?.items?.reduce((sum, w) => sum + (Number(w.registeredCount) || 0), 0) || 0;
    const draftCount = pagedData?.items?.filter((w) => String(w.status) === "Draft").length || 0;
    return { total, registrationCount, draftCount };
  }, [pagedData]);

  const handleCancelWorkshop = async (id) => {
    // This function is kept for potential future use or for other UI elements
    // currently not rendered in the main table.
    if (!id) return;
    if (window.confirm("Bạn chắc chắn muốn hủy workshop này?")) {
      await cancelMutation.mutateAsync(id);
    }
  };

  return (
    <AdminShell activeTop="Quản lý Workshop">
      {/* Page Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Workshop Management</h1>
          <p className="mt-1.5 text-slate-500 max-w-2xl">
            Control and monitor academic workshops across the campus with ease.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200 active:scale-95"
        >
          <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
          Create Workshop
        </button>
      </div>

      {/* Main Content Area */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
        {/* Filters & Search Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-5">
          <div className="relative w-full max-w-md group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
              placeholder="Search by title or speaker..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2.5">
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300">
              <Filter className="h-4 w-4" /> Filters
            </button>
          </div>
        </div>

        {/* Workshops Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-xs font-bold uppercase tracking-widest text-slate-500">
                <th className="px-6 py-4">Workshop Info</th>
                <th className="px-6 py-4">Speaker</th>
                <th className="px-6 py-4">Schedule</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5" colSpan={6}>
                      <div className="h-10 bg-slate-100 rounded-lg w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center" colSpan={6}>
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Search className="h-12 w-12 mb-3 opacity-20" />
                      <p className="font-medium text-slate-500">No workshops found</p>
                      <p className="text-sm">Try adjusting your filters or search query.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="group transition-colors hover:bg-slate-50/80 cursor-pointer"
                    onClick={() => navigate(`/workshop/${item.id}`)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 font-bold">
                          {item.title.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{item.title}</p>
                          <p className="text-xs text-slate-500 font-mono">ID: {String(item.id).slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-medium text-slate-700">{item.speakerName}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {toDateLabel(item.startTime)}
                        </span>
                        <span className="text-xs text-slate-500 ml-5">{toTimeLabel(item.startTime)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {item.room}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold ${statusStyles[item.status] || "bg-slate-100 text-slate-700"}`}
                      >
                        {statusLabels[item.status] || item.status}
                      </span>
                    </td>
                    <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-all hover:bg-blue-100 hover:scale-110 active:scale-95"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/workshop/${item.id}`);
                          }}
                          title="Xem chi tiết"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/30 p-5">
          <p className="text-sm font-medium text-slate-500">
            Showing <span className="text-slate-900">{filteredItems.length}</span> of <span className="text-slate-900">{pagedData?.totalCount || 0}</span> workshops
          </p>
          <div className="flex items-center gap-2">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white transition-all hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white"
              onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
              disabled={pageNumber === 1 || isLoading}
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <div className="flex items-center px-4 font-bold text-sm text-slate-900">
              Page {pageNumber} of {pagedData?.totalPages || 1}
            </div>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white transition-all hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white"
              onClick={() => setPageNumber(prev => prev + 1)}
              disabled={pageNumber >= (pagedData?.totalPages || 1) || isLoading}
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sync Footer */}
      <div className="mt-8 inline-flex items-center gap-2.5 rounded-2xl bg-slate-900 px-5 py-3 text-sm text-white shadow-lg shadow-slate-200">
        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        Dashboard automatically synchronizes with the central schedule.
      </div>

      <CreateWorkshopModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          refetch();
        }}
      />
    </AdminShell>
  );
}

function StatCard({ icon, label, value, description, gradient, accent }) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1`}>
      <div className={`absolute top-0 right-0 h-24 w-24 bg-gradient-to-br ${gradient} opacity-50 rounded-bl-full transition-transform group-hover:scale-110`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-50`}>{icon}</div>
          <div className={`h-1.5 w-8 rounded-full ${accent} opacity-20`} />
        </div>
        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">{label}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-3xl font-black text-slate-900">{value}</p>
          <span className="text-xs font-medium text-slate-400">{description}</span>
        </div>
      </div>
    </div>
  );
}
