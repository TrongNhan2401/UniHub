import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit3, FileText, History, Save, Upload, X } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { workshopService } from "@/services/adminService";

function toDateTimeLabel(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function toLocalInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function statusLabel(status) {
  const map = { Draft: "Ban nhap", Published: "Da xuat ban", Cancelled: "Da huy" };
  return map[status] || status || "-";
}

function makeUpdateFormData(form) {
  const fd = new FormData();
  fd.append("title", form.title || "");
  fd.append("description", form.description || "");
  fd.append("speakerName", form.speakerName || "");
  fd.append("speakerBio", form.speakerBio || "");
  fd.append("room", form.room || "");
  fd.append("roomMapUrl", form.roomMapUrl || "");
  fd.append("startTime", form.startTime || "");
  fd.append("endTime", form.endTime || "");
  fd.append("totalSlots", String(Number(form.totalSlots) || 0));
  fd.append("isFree", String(Boolean(form.isFree)));
  fd.append("price", String(Number(form.price) || 0));
  return fd;
}

export default function AdminWorkshopDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [workshop, setWorkshop] = useState(null);
  const [editFormData, setEditFormData] = useState(null);

  const loadDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await workshopService.getById(id);
      setWorkshop(data);
      setEditFormData({
        ...data,
        startTime: toLocalInput(data?.startTime),
        endTime: toLocalInput(data?.endTime),
      });
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || "Khong tai duoc chi tiet workshop.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const occupancyRate = useMemo(() => {
    if (!workshop) return 0;
    if (!workshop.totalSlots) return 0;
    return (Number(workshop.registeredCount || 0) / Number(workshop.totalSlots)) * 100;
  }, [workshop]);

  const checkinRate = useMemo(() => {
    if (!workshop) return 0;
    const attendances = workshop.attendances?.length || 0;
    const regs = Number(workshop.registeredCount || 0);
    if (!regs) return 0;
    return (attendances / regs) * 100;
  }, [workshop]);

  const handleSaveWorkshop = async () => {
    if (!id || !editFormData) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await workshopService.update(id, makeUpdateFormData(editFormData));
      setIsModalOpen(false);
      setMessage("Cap nhat workshop thanh cong.");
      await loadDetail();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || "Khong cap nhat duoc workshop.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelWorkshop = async () => {
    if (!id) return;
    if (!window.confirm("Ban chac chan muon huy workshop nay?")) return;
    setCanceling(true);
    setMessage("");
    setError("");
    try {
      await workshopService.cancel(id);
      setMessage("Da huy workshop.");
      await loadDetail();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || "Khong huy duoc workshop.");
    } finally {
      setCanceling(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    setMessage("");
    setError("");
    try {
      await workshopService.uploadPdf(id, fd);
      setMessage("Tai PDF thanh cong.");
      await loadDetail();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || "Tai PDF that bai.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <AdminShell activeTop="Quan ly Workshop">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => navigate("/workshops")}
          className="flex w-fit items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lai danh sach
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!workshop}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Edit3 className="h-4 w-4" /> Chinh sua thong tin
          </button>
          <button
            onClick={handleCancelWorkshop}
            disabled={canceling || !workshop}
            className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
          >
            {canceling ? "Dang huy..." : "Huy workshop"}
          </button>
        </div>
      </div>

      {error ? <p className="mb-4 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{message}</p> : null}

      {loading ? (
        <div className="rounded-xl border bg-white p-10 text-center text-slate-500">Dang tai chi tiet workshop...</div>
      ) : null}

      {!loading && workshop ? (
        <>
          <div className="mb-6 flex gap-8 border-b border-slate-200">
            <TabButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              label="Thong tin chung"
              icon={<FileText size={18} />}
            />
            <TabButton
              active={activeTab === "attendees"}
              onClick={() => setActiveTab("attendees")}
              label={`Dang ky (${workshop.registrations?.length || 0})`}
              icon={<History size={18} />}
            />
            <TabButton
              active={activeTab === "checkins"}
              onClick={() => setActiveTab("checkins")}
              label={`Check-in (${workshop.attendances?.length || 0})`}
              icon={<History size={18} />}
            />
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              {activeTab === "overview" ? (
                <>
                  <div className="rounded-2xl border bg-white p-6">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        {statusLabel(workshop.status)}
                      </span>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        {workshop.isFree ? "Mien phi" : `${Number(workshop.price || 0).toLocaleString("vi-VN")} VND`}
                      </span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900">{workshop.title}</h1>
                    <p className="mt-3 text-slate-600">{workshop.description || "Chua co mo ta."}</p>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <InfoItem label="Dien gia" value={workshop.speakerName} />
                      <InfoItem label="Phong" value={workshop.room} />
                      <InfoItem label="Bat dau" value={toDateTimeLabel(workshop.startTime)} />
                      <InfoItem label="Ket thuc" value={toDateTimeLabel(workshop.endTime)} />
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-white p-6">
                    <h3 className="mb-3 font-bold text-slate-800">Tai lieu PDF va AI Summary</h3>
                    <p className="mb-3 text-sm text-slate-500">{workshop.aiSummary || "Chua co AI Summary."}</p>
                    {workshop.pdfUrl ? (
                      <a
                        className="text-sm font-semibold text-blue-600 underline"
                        href={workshop.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Mo file PDF hien tai
                      </a>
                    ) : (
                      <p className="text-sm text-slate-400">Chua co file PDF.</p>
                    )}
                    <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      <Upload className="h-4 w-4" /> {uploading ? "Dang tai..." : "Tai PDF moi"}
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </>
              ) : null}

              {activeTab === "attendees" ? (
                <SimpleTable
                  headers={["User", "Email", "Trang thai", "Ngay dang ky"]}
                  rows={(workshop.registrations || []).map((r) => [
                    String(r.userId || "-").slice(0, 8),
                    r.userEmail || "-",
                    r.status || "-",
                    toDateTimeLabel(r.createdAt),
                  ])}
                  emptyText="Chua co dang ky."
                />
              ) : null}

              {activeTab === "checkins" ? (
                <SimpleTable
                  headers={["User", "Email", "Trang thai", "Thoi gian check-in"]}
                  rows={(workshop.attendances || []).map((a) => [
                    String(a.userId || "-").slice(0, 8),
                    a.userEmail || "-",
                    a.status || "-",
                    toDateTimeLabel(a.checkedInAt),
                  ])}
                  emptyText="Chua co du lieu check-in."
                />
              ) : null}
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl bg-slate-900 p-6 text-white">
                <p className="text-xs uppercase text-slate-400">Dang ky</p>
                <p className="text-3xl font-black">{workshop.registeredCount || 0}</p>
                <p className="mt-2 text-xs text-slate-400">Tong cho: {workshop.totalSlots || 0}</p>
                <div className="mt-3 h-2 rounded-full bg-slate-700">
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(100, occupancyRate)}%` }} />
                </div>
                <p className="mt-2 text-xs text-emerald-300">Lap day: {occupancyRate.toFixed(1)}%</p>
              </div>
              <div className="rounded-2xl border bg-white p-6">
                <p className="text-xs uppercase text-slate-500">Check-in</p>
                <p className="text-3xl font-black text-slate-900">{workshop.attendances?.length || 0}</p>
                <p className="mt-2 text-sm text-slate-500">Ty le check-in: {checkinRate.toFixed(1)}%</p>
              </div>
            </aside>
          </div>
        </>
      ) : null}

      {isModalOpen && workshop && editFormData ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-bold">Chinh sua Workshop</h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tieu de">
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  value={editFormData.title || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                />
              </Field>
              <Field label="Dien gia">
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  value={editFormData.speakerName || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, speakerName: e.target.value })}
                />
              </Field>
              <Field label="Phong">
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  value={editFormData.room || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, room: e.target.value })}
                />
              </Field>
              <Field label="Tong cho">
                <input
                  type="number"
                  className="w-full rounded-lg border px-3 py-2"
                  value={editFormData.totalSlots || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, totalSlots: Number(e.target.value) || 0 })}
                />
              </Field>
              <Field label="Bat dau">
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border px-3 py-2"
                  value={editFormData.startTime || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                />
              </Field>
              <Field label="Ket thuc">
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border px-3 py-2"
                  value={editFormData.endTime || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Mo ta">
                <textarea
                  rows={4}
                  className="w-full rounded-lg border px-3 py-2"
                  value={editFormData.description || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                />
              </Field>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(editFormData.isFree)}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      isFree: e.target.checked,
                      price: e.target.checked ? 0 : editFormData.price,
                    })
                  }
                />
                Mien phi
              </label>
              {!editFormData.isFree ? (
                <input
                  type="number"
                  className="w-44 rounded-lg border px-3 py-2"
                  value={editFormData.price || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, price: Number(e.target.value) || 0 })}
                />
              ) : null}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="px-5 py-2 font-semibold text-slate-500" onClick={() => setIsModalOpen(false)}>
                Huy
              </button>
              <button
                disabled={saving}
                onClick={handleSaveWorkshop}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white disabled:opacity-60"
              >
                <Save className="h-4 w-4" /> {saving ? "Dang luu..." : "Luu thay doi"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}

function TabButton({ active, onClick, label, icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-all ${active ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
    >
      {icon} {label}
    </button>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[11px] font-bold uppercase text-slate-400">{label}</p>
      <p className="font-semibold text-slate-800">{value || "-"}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase text-slate-500">{label}</p>
      {children}
    </div>
  );
}

function SimpleTable({ headers, rows, emptyText }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-6 py-4">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.length === 0 ? (
            <tr>
              <td className="px-6 py-6 text-slate-500" colSpan={headers.length}>
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/50">
                {row.map((cell, j) => (
                  <td key={j} className="px-6 py-4 text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
