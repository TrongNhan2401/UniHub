import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit3, FileText, History, Save, Upload, X } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { checkinService, workshopService } from "@/services/adminService";

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
  const map = { Draft: "Bản nháp", Published: "Đã xuất bản", Cancelled: "Đã hủy" };
  return map[status] || status || "-";
}

const statusStyles = {
  Published: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Cancelled: "bg-rose-50 text-rose-700 border-rose-100",
  Draft: "bg-amber-50 text-amber-700 border-amber-100",
};

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
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState(""); // "pdf" or "image"
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [workshop, setWorkshop] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [checkins, setCheckins] = useState([]);

  const loadDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await workshopService.getById(id);

      setWorkshop(data);
      setCheckins(data.attendances || []);
      setEditFormData({
        ...data,
        startTime: toLocalInput(data?.startTime),
        endTime: toLocalInput(data?.endTime),
      });
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || "Không thể tải chi tiết workshop.");
    } finally {
      setLoading(false);
    }
  };

  const handlePublishWorkshop = async () => {
    if (!id) return;
    if (!window.confirm("Bạn có chắc chắn muốn xuất bản workshop này? Sau khi xuất bản, người dùng có thể nhìn thấy và đăng ký.")) return;
    setPublishing(true);
    setMessage("");
    setError("");
    try {
      await workshopService.publish(id);
      setMessage("Đã xuất bản workshop thành công.");
      await loadDetail();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || "Không thể xuất bản workshop.");
    } finally {
      setPublishing(false);
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
    const attendances = checkins.length;
    const regs = Number(workshop.registeredCount || 0);
    if (!regs) return 0;
    return (attendances / regs) * 100;
  }, [workshop, checkins]);

  const handleSaveWorkshop = async () => {
    if (!id || !editFormData) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await workshopService.update(id, makeUpdateFormData(editFormData));
      setIsModalOpen(false);
      setMessage("Cập nhật workshop thành công.");
      await loadDetail();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || "Không thể cập nhật workshop.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelWorkshop = async () => {
    if (!id) return;
    if (!window.confirm("Bạn có chắc chắn muốn hủy workshop này?")) return;
    setCanceling(true);
    setMessage("");
    setError("");
    try {
      await workshopService.cancel(id);
      setMessage("Đã hủy workshop thành công.");
      await loadDetail();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || "Không thể hủy workshop.");
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
    setUploadType("pdf");
    setMessage("");
    setError("");
    try {
      await workshopService.uploadPdf(id, fd);
      await loadDetail();
    } catch (err) {
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    if (!window.confirm("Bạn có chắc chắn muốn thay đổi ảnh bìa cho workshop này?")) {
      e.target.value = "";
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    setUploadType("image");
    setMessage("");
    setError("");
    try {
      await workshopService.uploadImage(id, fd);
      setMessage("Cập nhật ảnh bìa thành công.");
      await loadDetail();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || "Tải ảnh bìa thất bại.");
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
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
        </button>
        <div className="flex gap-3">
          {workshop?.status === "Draft" && (
            <button
              onClick={handlePublishWorkshop}
              disabled={publishing || !workshop}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" /> {publishing ? "Đang xuất bản..." : "Xuất bản workshop"}
            </button>
          )}
          {workshop?.status !== "Cancelled" && (
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={!workshop}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Edit3 className="h-4 w-4" /> Chỉnh sửa thông tin
            </button>
          )}
          {workshop?.status !== "Cancelled" && (
            <button
              onClick={handleCancelWorkshop}
              disabled={canceling || !workshop}
              className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
            >
              {canceling ? "Đang hủy..." : "Hủy workshop"}
            </button>
          )}
        </div>
      </div>

      {error ? <p className="mb-4 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{message}</p> : null}

      {uploading && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-all">
          <div className="flex flex-col items-center rounded-3xl bg-white p-10 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100">
            <div className="mb-6 relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-100 border-t-blue-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-pulse rounded-full bg-blue-100"></div>
              </div>
            </div>
            <p className="text-xl font-black text-slate-900">
              {uploadType === "pdf" ? "UniHub AI" : "Cập nhật ảnh"}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-600 text-center max-w-[240px]">
              {uploadType === "pdf"
                ? "Đang phân tích PDF và tạo bản tóm tắt nội dung..."
                : "Đang tải ảnh lên hệ thống..."}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border bg-white p-10 text-center text-slate-500">Đang tải chi tiết workshop...</div>
      ) : null}

      {!loading && workshop ? (
        <>
          <div className="mb-6 flex gap-8 border-b border-slate-200">
            <TabButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              label="Thông tin chung"
              icon={<FileText size={18} />}
            />
            <TabButton
              active={activeTab === "attendees"}
              onClick={() => setActiveTab("attendees")}
              label={`Đăng ký (${workshop.registrations?.length || 0})`}
              icon={<History size={18} />}
            />
            <TabButton
              active={activeTab === "checkins"}
              onClick={() => setActiveTab("checkins")}
              label={`Check-in (${checkins.length})`}
              icon={<History size={18} />}
            />
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              {activeTab === "overview" ? (
                <>
                  <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                    {/* Cover Image Section */}
                    <div className="relative aspect-[16/7] w-full bg-slate-900 border-b overflow-hidden group/cover">
                      {/* Blurred background layer */}
                      <div className="absolute inset-0 transition-transform duration-700 group-hover/cover:scale-110">
                        <img
                          src={workshop.imageUrl || import.meta.env.VITE_DEFAULT_WORKSHOP_IMAGE}
                          alt=""
                          className="h-full w-full object-cover blur-2xl opacity-40"
                        />
                        <div className="absolute inset-0 bg-slate-900/20" />
                      </div>

                      {/* Main image layer */}
                      <img
                        src={workshop.imageUrl || import.meta.env.VITE_DEFAULT_WORKSHOP_IMAGE}
                        alt={workshop.title}
                        className={`relative z-10 h-full w-full ${workshop.imageUrl ? "object-contain p-4" : "object-contain p-12"} transition-all duration-500`}
                      />
                      <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                        <label className="cursor-pointer rounded-lg bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm backdrop-blur-sm hover:bg-white">
                          <Upload className="inline-block mr-1 h-3 w-3" /> Đổi ảnh bìa
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={uploading}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[workshop.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                          {statusLabel(workshop.status)}
                        </span>
                        {workshop.endTime && new Date(workshop.endTime) < new Date() && (
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                            Đã kết thúc
                          </span>
                        )}
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-100">
                          {workshop.isFree ? "Miễn phí" : `${Number(workshop.price || 0).toLocaleString("vi-VN")} VNĐ`}
                        </span>
                      </div>
                      <h1 className="text-3xl font-black text-slate-900">{workshop.title}</h1>
                      <p className="mt-3 text-slate-600">{workshop.description || "Chưa có mô tả."}</p>
                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <InfoItem label="Diễn giả" value={workshop.speakerName} />
                        <InfoItem label="Phòng" value={workshop.room} />
                        <InfoItem label="Bắt đầu" value={toDateTimeLabel(workshop.startTime)} />
                        <InfoItem label="Kết thúc" value={toDateTimeLabel(workshop.endTime)} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-white p-6">
                    <h3 className="mb-3 font-bold text-slate-800">Tài liệu PDF và AI Summary</h3>
                    {workshop.aiSummaryError ? (
                      <div className="rounded-xl bg-rose-50 p-4 border border-rose-100 text-rose-700">
                        <p className="text-sm font-bold flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" /> Lỗi tạo AI Summary
                        </p>
                        <p className="mt-1 text-xs">{workshop.aiSummaryError}</p>
                      </div>
                    ) : (
                      <div
                        className="ai-summary-content text-sm text-slate-700 leading-relaxed
                          [&>h3]:text-base [&>h3]:font-black [&>h3]:text-slate-900 [&>h3]:mt-5 [&>h3]:mb-2 [&>h3]:flex [&>h3]:items-center [&>h3]:gap-2
                          [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1 [&>ul]:mb-4
                          [&>li]:text-slate-600
                          first:[&>h3]:mt-0"
                        dangerouslySetInnerHTML={{
                          __html: workshop.aiSummary || "Chưa có AI Summary. Vui lòng tải lên file PDF để bắt đầu tóm tắt."
                        }}
                      />
                    )}
                    <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      <Upload className="h-4 w-4" /> {uploading ? "Đang tải..." : "Tải PDF mới"}
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
                  headers={["Họ tên", "MSSV", "Email", "Trạng thái", "Ngày đăng ký"]}
                  rows={(workshop.registrations || []).map((r) => [
                    r.userFullName || "-",
                    r.studentId || "-",
                    r.userEmail || "-",
                    r.status || "-",
                    toDateTimeLabel(r.createdAt),
                  ])}
                  emptyText="Chưa có đăng ký."
                />
              ) : null}

              {activeTab === "checkins" ? (
                <SimpleTable
                  headers={["Họ tên", "MSSV", "Email", "Trạng thái", "Thời gian check-in"]}
                  rows={checkins.map((a) => [
                    a.userFullName || "-",
                    a.studentId || "-",
                    a.userEmail || "-",
                    a.status || "-",
                    toDateTimeLabel(a.checkedInAt),
                  ])}
                  emptyText="Chưa có dữ liệu check-in."
                />
              ) : null}
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl bg-slate-900 p-6 text-white">
                <p className="text-xs uppercase text-slate-400">Đăng ký</p>
                <p className="text-3xl font-black">{workshop.registeredCount || 0}</p>
                <p className="mt-2 text-xs text-slate-400">Tổng chỗ: {workshop.totalSlots || 0}</p>
                <div className="mt-3 h-2 rounded-full bg-slate-700">
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(100, occupancyRate)}%` }} />
                </div>
                <p className="mt-2 text-xs text-emerald-300">Lấp đầy: {occupancyRate.toFixed(1)}%</p>
              </div>
              <div className="rounded-2xl border bg-white p-6">
                <p className="text-xs uppercase text-slate-500">Check-in</p>
                <p className="text-3xl font-black text-slate-900">{checkins.length}</p>
                <p className="mt-2 text-sm text-slate-500">Tỷ lệ check-in: {checkinRate.toFixed(1)}%</p>
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
              <h2 className="text-xl font-bold">Chỉnh sửa Workshop</h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tiêu đề">
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  value={editFormData.title || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                />
              </Field>
              <Field label="Diễn giả">
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  value={editFormData.speakerName || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, speakerName: e.target.value })}
                />
              </Field>
              <Field label="Phòng">
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  value={editFormData.room || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, room: e.target.value })}
                />
              </Field>
              <Field label="Tổng chỗ">
                <input
                  type="number"
                  className="w-full rounded-lg border px-3 py-2"
                  value={editFormData.totalSlots || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, totalSlots: Number(e.target.value) || 0 })}
                />
              </Field>
              <Field label="Bắt đầu">
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border px-3 py-2"
                  value={editFormData.startTime || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                />
              </Field>
              <Field label="Kết thúc">
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border px-3 py-2"
                  value={editFormData.endTime || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Mô tả">
                <textarea
                  rows={4}
                  className="w-full rounded-lg border px-3 py-2"
                  value={editFormData.description || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                />
              </Field>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className={`flex items-center gap-2 text-sm ${workshop.status === "Published" ? "text-slate-400 cursor-not-allowed" : ""}`}>
                  <input
                    type="checkbox"
                    disabled={workshop.status === "Published"}
                    checked={Boolean(editFormData.isFree)}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        isFree: e.target.checked,
                        price: e.target.checked ? 0 : editFormData.price,
                      })
                    }
                  />
                  Miễn phí
                </label>
                {!editFormData.isFree ? (
                  <input
                    type="number"
                    disabled={workshop.status === "Published"}
                    className="w-44 rounded-lg border px-3 py-2 disabled:bg-slate-50 disabled:text-slate-400"
                    value={editFormData.price || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, price: Number(e.target.value) || 0 })}
                  />
                ) : null}
              </div>
              {workshop.status === "Published" && (
                <p className="text-[10px] text-amber-600 font-bold italic">
                  * Không thể thay đổi loại phí/giá sau khi workshop đã được xuất bản.
                </p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="px-5 py-2 font-semibold text-slate-500" onClick={() => setIsModalOpen(false)}>
                Hủy
              </button>
              <button
                disabled={saving}
                onClick={handleSaveWorkshop}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white disabled:opacity-60"
              >
                <Save className="h-4 w-4" /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
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
