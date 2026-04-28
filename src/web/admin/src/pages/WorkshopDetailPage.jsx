import React, { useState } from "react";
import {
  Calendar, MapPin, Users, Clock, ShieldCheck, FileText, Sparkles,
  ArrowLeft, Save, Edit3, Trash2, Upload, ExternalLink, TrendingUp,
  CheckCircle2, CreditCard, Search, Mail, Download, History, X, Info
} from "lucide-react";
import AdminShell from "@/components/AdminShell";

export default function AdminWorkshopDetailPage() {
  const [activeTab, setActiveTab] = useState("overview"); // overview, attendees, checkins
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [workshop, setWorkshop] = useState({
    id: 1,
    title: "Mẫu Thiết kế React Nâng cao & Micro-frontends",
    speakerName: "TS. Nguyễn Văn A",
    speakerBio: "Chuyên gia Kiến trúc Frontend với hơn 10 năm kinh nghiệm.",
    description: "Workshop này đi sâu vào tối ưu hóa hiệu suất, kiến trúc custom hooks và cách quản lý micro-frontends trong các ứng dụng quy mô lớn năm 2026.",
    room: "Hội trường A1 - Tầng 2",
    startTime: "2026-10-24T09:00",
    endTime: "2026-10-24T11:30",
    price: 50000.00,
    isFree: false,
    status: "Published",
    totalSlots: 100,
    bookedSlots: 85,
    checkedInCount: 42,
    imageUrl: "https://images.unsplash.com/photo-1591115765373-520b7a08b52f?q=80&w=2070&auto=format&fit=crop",
    aiSummary: "Workshop tập trung vào Module Federation và Atomic design. Người học sẽ nắm vững cách chia nhỏ hệ thống thành các Micro-frontends độc lập, tối ưu hóa Re-render thông qua các Custom Hooks nâng cao và quản lý State quy mô lớn.",
  });

  const [attendees] = useState([
    { id: "SV001", name: "Nguyễn Văn A", email: "vana@gmail.com", status: "Confirmed", time: "20-10-2026" },
    { id: "SV002", name: "Trần Thị B", email: "thib@gmail.com", status: "Pending", time: "21-10-2026" },
  ]);

  const [checkins] = useState([
    { id: "SV001", name: "Nguyễn Văn A", checkinTime: "08:45 SA", method: "Mã QR" },
  ]);

  const [editFormData, setEditFormData] = useState({ ...workshop });

  const statusLabels = {
    Published: "Đã xuất bản",
    Draft: "Bản nháp",
  };

  const attendeeStatusLabels = {
    Confirmed: "Đã xác nhận",
    Pending: "Đang chờ",
  };

  const handleOpenModal = () => {
    setEditFormData({ ...workshop });
    setIsModalOpen(true);
  };

  const handleSaveWorkshop = () => {
    setWorkshop({ ...editFormData });
    setIsModalOpen(false);
  };

  const handleFileUpload = (e) => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      alert("AI đã phân tích nội dung PDF thành công!");
    }, 2000);
  };

  const occupancyRate = (workshop.bookedSlots / workshop.totalSlots) * 100;
  const checkInRate = (workshop.checkedInCount / workshop.bookedSlots) * 100;

  return (
    <AdminShell activeTop="Quản lý Workshop">
      {/* --- HEADER BAR --- */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button className="flex w-fit items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
        </button>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <Download className="h-4 w-4" /> Xuất báo cáo
          </button>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
          >
            <Edit3 className="h-4 w-4" /> Chỉnh sửa thông tin
          </button>
        </div>
      </div>

      {/* --- TABS NAVIGATION --- */}
      <div className="mb-8 flex gap-8 border-b border-slate-200">
        <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} label="Thông tin chung" icon={<FileText size={18} />} />
        <TabButton active={activeTab === "attendees"} onClick={() => setActiveTab("attendees")} label={`Đăng ký (${workshop.bookedSlots})`} icon={<Users size={18} />} />
        <TabButton active={activeTab === "checkins"} onClick={() => setActiveTab("checkins")} label={`Check-in (${workshop.checkedInCount})`} icon={<History size={18} />} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* --- LEFT CONTENT --- */}
        <div className="min-h-[500px]">
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="relative rounded-[2.5rem] border-4 border-white shadow-xl aspect-video overflow-hidden bg-slate-100">
                <img src={workshop.imageUrl} className="h-full w-full object-cover" alt="Ảnh bìa" />
              </div>

              {/* AI Summary Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] p-8 text-white shadow-xl">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                      <Sparkles className="text-amber-300" size={20} />
                    </div>
                    <h3 className="font-black text-lg">Phân tích chuyên sâu từ AI</h3>
                  </div>
                  <p className="text-indigo-50 leading-relaxed font-medium">{workshop.aiSummary}</p>
                </div>
                <Sparkles className="absolute -right-4 -bottom-4 text-white/10" size={160} />
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 space-y-4">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${workshop.status === 'Published' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{statusLabels[workshop.status]}</span>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase">
                    {workshop.isFree ? "Miễn phí" : `${workshop.price.toLocaleString()} VND`}
                  </span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 leading-tight">{workshop.title}</h1>
                <p className="text-slate-600 leading-relaxed italic border-l-4 border-slate-100 pl-4">{workshop.description}</p>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                    <Users className="text-blue-500" size={20} />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Diễn giả</p>
                      <p className="font-bold text-slate-700">{workshop.speakerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                    <MapPin className="text-blue-500" size={20} />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Phòng học</p>
                      <p className="font-bold text-slate-700">{workshop.room}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI PDF Upload Area */}
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-8 transition-all hover:border-blue-400 group text-center">
                <div className={`mx-auto w-16 h-16 flex items-center justify-center rounded-full mb-4 transition-colors ${isUploading ? 'bg-blue-100 animate-pulse' : 'bg-white shadow-sm group-hover:bg-blue-50'}`}>
                  <Upload className={isUploading ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'} size={28} />
                </div>
                <h3 className="font-bold text-slate-800">Cập nhật tài liệu AI (PDF)</h3>
                <p className="text-sm text-slate-500 mb-6">Tải lên file PDF để AI cập nhật lại phần tóm tắt nội dung chuyên sâu.</p>
                <label className="cursor-pointer bg-white border border-slate-200 px-6 py-2.5 rounded-xl font-bold text-slate-700 hover:shadow-md transition-all inline-block">
                  {isUploading ? "Đang phân tích..." : "Chọn File PDF"}
                  <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={isUploading} />
                </label>
              </div>
            </div>
          )}

          {activeTab === "attendees" && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border-none text-sm font-medium" placeholder="Tìm sinh viên..." />
                </div>
              </div>
              <AdminTable
                headers={["MSSV", "Họ tên", "Email", "Trạng thái", "Ngày ĐK"]}
                data={attendees.map(a => [
                  <span className="font-bold text-slate-900" key={a.id}>{a.id}</span>,
                  a.name, a.email,
                  <span key={a.id} className={`px-2 py-1 rounded-lg text-[10px] font-bold ${a.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{attendeeStatusLabels[a.status]}</span>,
                  a.time
                ])}
              />
            </div>
          )}

          {activeTab === "checkins" && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4">
              <AdminTable
                headers={["Họ tên", "Thời gian quét", "Hình thức", "Hành động"]}
                data={checkins.map(c => [
                  <span className="font-bold text-slate-900" key={c.id}>{c.name}</span>,
                  <span className="font-mono text-blue-600 font-bold" key={c.id}>{c.checkinTime}</span>,
                  c.method,
                  <button key={c.id} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg">Hủy điểm danh</button>
                ])}
              />
            </div>
          )}
        </div>

        {/* --- SIDEBAR --- */}
        <aside className="space-y-6">
          <div className="sticky top-6 space-y-6">
            <div className="rounded-[2.5rem] bg-slate-900 p-8 text-white shadow-2xl overflow-hidden relative">
              <h3 className="text-lg font-bold mb-6 text-blue-400 flex items-center gap-2"><TrendingUp size={20} /> Hiệu suất</h3>
              <div className="space-y-6 relative z-10">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-4xl font-black">{workshop.bookedSlots}</p>
                    <p className="text-emerald-400 font-bold">{occupancyRate.toFixed(1)}%</p>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${occupancyRate}%` }} />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 tracking-widest">Đã đăng ký / {workshop.totalSlots} chỗ</p>
                </div>
                <div className="pt-6 border-t border-slate-800 grid grid-cols-2 gap-4 text-center">
                  <div><p className="text-[10px] font-bold text-slate-500 uppercase">Tham dự</p><p className="text-xl font-black text-emerald-400">{workshop.checkedInCount}</p></div>
                  <div><p className="text-[10px] font-bold text-slate-500 uppercase">Tỷ lệ</p><p className="text-xl font-black text-white">{checkInRate.toFixed(0)}%</p></div>
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-blue-600 p-6 text-white shadow-xl shadow-blue-200">
              <button className="w-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 py-3 rounded-2xl font-bold transition-all active:scale-95">
                <Mail size={18} /> Gửi Email nhắc lịch học
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* --- MODAL EDIT (DESCRIPTION MOVED TO BOTTOM) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-[2.5rem] shadow-2xl animate-in zoom-in-95">
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900">Chỉnh sửa Workshop</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={24} /></button>
            </div>

            <div className="p-8 space-y-6">
              {/* Row 1: Title & Speaker */}
              <div className="grid gap-6 md:grid-cols-2">
                <FormGroup label="Tiêu đề Workshop">
                  <input className="form-input" value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} />
                </FormGroup>
                <FormGroup label="Tên diễn giả">
                  <input className="form-input" value={editFormData.speakerName} onChange={(e) => setEditFormData({ ...editFormData, speakerName: e.target.value })} />
                </FormGroup>
              </div>

              {/* Row 2: Location, Capacity, Status */}
              <div className="grid gap-6 md:grid-cols-3">
                <FormGroup label="Phòng học">
                  <input className="form-input" value={editFormData.room} onChange={(e) => setEditFormData({ ...editFormData, room: e.target.value })} />
                </FormGroup>
                <FormGroup label="Tổng số chỗ">
                  <input type="number" className="form-input" value={editFormData.totalSlots} onChange={(e) => setEditFormData({ ...editFormData, totalSlots: Number(e.target.value) })} />
                </FormGroup>
                <FormGroup label="Trạng thái">
                  <select className="form-input" value={editFormData.status} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}>
                    <option value="Published">Đã xuất bản</option>
                    <option value="Draft">Bản nháp</option>
                  </select>
                </FormGroup>
              </div>

              {/* Row 3: Pricing Config */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm text-blue-600"><CreditCard size={20} /></div>
                  <span className="font-bold text-slate-800 tracking-tight">Cấu hình chi phí</span>
                </div>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 rounded-md border-slate-300" checked={editFormData.isFree} onChange={(e) => setEditFormData({ ...editFormData, isFree: e.target.checked })} />
                    <span className="text-sm font-bold text-slate-600">Miễn phí</span>
                  </label>
                  {!editFormData.isFree && (
                    <input type="number" className="w-32 bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold text-blue-600 outline-none" value={editFormData.price} onChange={(e) => setEditFormData({ ...editFormData, price: Number(e.target.value) })} />
                  )}
                </div>
              </div>

              {/* Row 4: Description (Moved to Bottom) */}
              <FormGroup label="Mô tả chi tiết nội dung">
                <textarea
                  rows={5}
                  className="form-input resize-none"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Nhập nội dung chi tiết cho workshop..."
                />
              </FormGroup>
            </div>

            <div className="sticky bottom-0 bg-slate-50 px-8 py-6 flex justify-end gap-3 border-t border-slate-100">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-400">Hủy</button>
              <button onClick={handleSaveWorkshop} className="bg-slate-900 text-white px-10 py-2.5 rounded-xl font-bold flex items-center gap-2">
                <Save size={18} /> Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .form-input { @apply w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all; }
      `}</style>
    </AdminShell>
  );
}

// Helpers Components
function TabButton({ active, onClick, label, icon }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-all ${active ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
      {icon} {label}
    </button>
  );
}

function AdminTable({ headers, data }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <tr>{headers.map((h, i) => <th key={i} className="px-6 py-4">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50/50 transition-colors">{row.map((cell, j) => <td key={j} className="px-6 py-4 text-slate-600 font-medium">{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FormGroup({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5 ml-1"><Info size={12} /> {label}</label>
      {children}
    </div>
  );
}