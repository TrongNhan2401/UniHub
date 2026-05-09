import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, Plus, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminShell from "@/components/AdminShell";
import { workshopService } from "@/services/adminService";

export default function CalendarPage() {
  const navigate = useNavigate();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [allWorkshops, setAllWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    let ignore = false;

    const fetchAllWorkshops = async () => {
      setLoading(true);
      setError("");
      try {
        const pageSize = 100;
        const firstRes = await workshopService.getAll({ pageNumber: 1, pageSize });
        const firstData = firstRes?.data || {};
        let items = firstData.items || [];
        const totalPages = Number(firstData.totalPages || 1);

        for (let page = 2; page <= totalPages; page += 1) {
          const res = await workshopService.getAll({ pageNumber: page, pageSize });
          items = items.concat(res?.data?.items || []);
        }

        if (!ignore) {
          setAllWorkshops(items);
        }
      } catch (err) {
        if (!ignore) {
          setError(err?.response?.data?.detail || err?.response?.data?.message || "Khong tai duoc lich workshop.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchAllWorkshops();

    return () => {
      ignore = true;
    };
  }, []);

  const events = useMemo(() => {
    return allWorkshops
      .map((w) => {
        const start = new Date(w.startTime);
        const end = new Date(w.endTime);
        if (Number.isNaN(start.getTime())) return null;

        const durationHours = !Number.isNaN(end.getTime())
          ? Math.max(0.5, (end.getTime() - start.getTime()) / (1000 * 60 * 60))
          : 2;

        return {
          id: w.id,
          title: w.title,
          speaker: w.speakerName || "Chua cap nhat",
          room: w.room || "TBA",
          day: start.getDate(),
          month: start.getMonth(),
          year: start.getFullYear(),
          shortTime: start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          durationHours,
        };
      })
      .filter(Boolean);
  }, [allWorkshops]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => e.day === selectedDate && e.month === currentMonth && e.year === currentYear);
  }, [events, selectedDate, currentMonth, currentYear]);

  const goPrevMonth = () => {
    setSelectedDate(1);
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const goNextMonth = () => {
    setSelectedDate(1);
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  return (
    <AdminShell activeTop="Lịch trình">
      <div className="flex flex-col gap-8 h-full">
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Lịch trình chi tiết</h1>
            <p className="text-slate-500 font-medium">Chọn một ngày để xem danh sách các workshop diễn ra.</p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95">
            <Plus size={20} /> Tạo Workshop Mới
          </button>
        </div>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[380px_1fr] flex-1 min-h-[600px]">
          {/* Left: Date Selection Panel */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  {monthNames[currentMonth]}, {currentYear}
                </h2>
                <div className="flex gap-1">
                  <button
                    onClick={goPrevMonth}
                    className="p-2 hover:bg-white hover:shadow-md rounded-xl text-slate-400 transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={goNextMonth}
                    className="p-2 hover:bg-white hover:shadow-md rounded-xl text-slate-400 transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center mb-2">
                {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d) => (
                  <div key={d} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {/* Simplified compact picker */}
                {days.map((day) => {
                  const hasEvents = events.some(
                    (e) => e.day === day && e.month === currentMonth && e.year === currentYear,
                  );
                  const isSelected = selectedDate === day;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(day)}
                      className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-bold transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-100 scale-110 z-10"
                          : "text-slate-600 hover:bg-white hover:shadow-sm"
                      }`}
                    >
                      {day}
                      {hasEvents && !isSelected && (
                        <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-blue-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-8 flex-1 overflow-y-auto">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Ghi chú hôm nay</h3>
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <p className="text-sm font-medium text-amber-900">
                    Kiểm tra lại danh sách đăng ký cho hội trường A1 trước 5h chiều.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p className="text-sm font-medium text-blue-900">
                    Liên hệ diễn giả TS. Nguyễn Văn A để xác nhận tài liệu trình chiếu.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Daily Workshop List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <CalendarDays className="text-blue-600" />
                Workshop Ngày {selectedDate} {monthNames[currentMonth]}
              </h2>
              <span className="text-sm font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
                {loading ? "Dang tai..." : `${filteredEvents.length} Workshop duoc tim thay`}
              </span>
            </div>

            {loading ? (
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-20 flex flex-col items-center justify-center text-center">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Dang tai lich workshop...</h3>
                <p className="text-slate-500 max-w-xs">Vui long doi trong giay lat.</p>
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="grid gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl hover:shadow-2xl hover:border-blue-200 transition-all group flex gap-6"
                  >
                    <div className="w-24 h-24 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1591115765373-520b7a08b52f?q=80&w=2070&auto=format&fit=crop"
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                        alt="workshop"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase">
                          {event.shortTime}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase">
                          {event.room}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Users size={14} className="text-slate-400" /> Diễn giả: {event.speaker}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} className="text-slate-400" /> Thời gian: {event.durationHours.toFixed(1)} giờ
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center px-4">
                      <button
                        onClick={() => navigate(`/workshop/${event.id}`)}
                        className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-20 flex flex-col items-center justify-center text-center opacity-60">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <CalendarIcon className="text-slate-300" size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Không có Workshop nào</h3>
                <p className="text-slate-500 max-w-xs">Ngày {selectedDate} chưa có workshop nào được lên lịch trình.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
