import React, { useState } from "react";
import {
  Pencil,
  Trash2,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Users,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { workshops } from "@/data/mockData";
import CreateWorkshopModal from "@/components/CreateWorkshopModal";

const statusStyles = {
  Active: "bg-emerald-100 text-emerald-700",
  Scheduled: "bg-blue-100 text-blue-700",
  Completed: "bg-slate-200 text-slate-700",
  Draft: "bg-amber-100 text-amber-700",
};

const statusLabels = {
  Active: "Đang diễn ra",
  Scheduled: "Đã lên lịch",
  Completed: "Đã kết thúc",
  Draft: "Bản nháp",
};

export default function WorkshopsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = workshops.filter(
    (w) => w.title.toLowerCase().includes(query.toLowerCase()) || w.speaker.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <AdminShell activeTop="Quản lý Workshop">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-5xl font-bold tracking-tight">Quản lý Workshop</h1>
          <p className="mt-1 text-slate-500">Kiểm soát và theo dõi tất cả các workshop học thuật trong khuôn viên trường.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
        >
          + Thêm Workshop Mới
        </button>
      </div>

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
              {filtered.map((item) => (
                <tr key={item.id} className="border-t hover:bg-slate-50/50">
                  <td className="px-5 py-4">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs text-slate-500">Code: {item.code}</p>
                  </td>
                  <td className="px-5 py-4">{item.speaker}</td>
                  <td className="px-5 py-4">
                    <p>{item.dateLabel}</p>
                    <p className="text-xs text-slate-500">{item.shortTime}</p>
                  </td>
                  <td className="px-5 py-4">{item.room}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[item.status]}`}>
                      {statusLabels[item.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-3 text-slate-400">
                      <button className="hover:text-blue-600">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="hover:text-red-600">
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
          <p>Hiển thị 1 đến {filtered.length} trong tổng số 24 kết quả</p>
          <div className="flex items-center gap-1">
            <button className="rounded-md border p-1.5 hover:bg-slate-50">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                className={`rounded-md border px-3 py-1.5 ${n === 1 ? "bg-blue-600 text-white border-blue-600" : "hover:bg-slate-50"}`}
              >
                {n}
              </button>
            ))}
            <button className="rounded-md border p-1.5 hover:bg-slate-50">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<GraduationCap className="h-6 w-6 text-blue-600" />}
          label="TỔNG WORKSHOP"
          value="142"
          bg="bg-blue-50"
        />
        <StatCard
          icon={<Users className="h-6 w-6 text-emerald-600" />}
          label="LƯỢT ĐĂNG KÝ"
          value="2,840"
          bg="bg-emerald-50"
        />
        <StatCard
          icon={<ClipboardList className="h-6 w-6 text-amber-600" />}
          label="CHỜ PHÊ DUYỆT"
          value="18"
          bg="bg-amber-50"
        />
      </div>

      <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-800/90 px-4 py-2.5 text-sm text-white">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        Bảng điều khiển tự động đồng bộ với lịch trình chính.
      </div>

      <CreateWorkshopModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
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
