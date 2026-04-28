import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Users, Filter, Plus, CalendarDays } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { workshops } from "@/data/mockData";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(24); // Default to 24th
  const [currentMonth, setCurrentMonth] = useState(9); // October
  const [currentYear, setCurrentYear] = useState(2026);

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Mock workshops for the calendar view
  const events = workshops.map(w => ({
    ...w,
    day: parseInt(w.dateLabel.split(' ')[0]) || 24 
  }));

  const filteredEvents = events.filter(e => e.day === selectedDate);

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

        <div className="grid gap-8 lg:grid-cols-[380px_1fr] flex-1 min-h-[600px]">
          {/* Left: Date Selection Panel */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">{monthNames[currentMonth]}, {currentYear}</h2>
                <div className="flex gap-1">
                  <button className="p-2 hover:bg-white hover:shadow-md rounded-xl text-slate-400 transition-all"><ChevronLeft size={18} /></button>
                  <button className="p-2 hover:bg-white hover:shadow-md rounded-xl text-slate-400 transition-all"><ChevronRight size={18} /></button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 text-center mb-2">
                {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map(d => (
                  <div key={d} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {/* Simplified compact picker */}
                {days.map(day => {
                  const hasEvents = events.some(e => e.day === day);
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
                  <p className="text-sm font-medium text-amber-900">Kiểm tra lại danh sách đăng ký cho hội trường A1 trước 5h chiều.</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p className="text-sm font-medium text-blue-900">Liên hệ diễn giả TS. Nguyễn Văn A để xác nhận tài liệu trình chiếu.</p>
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
                {filteredEvents.length} Workshop được tìm thấy
              </span>
            </div>

            {filteredEvents.length > 0 ? (
              <div className="grid gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
                {filteredEvents.map(event => (
                  <div key={event.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl hover:shadow-2xl hover:border-blue-200 transition-all group flex gap-6">
                    <div className="w-24 h-24 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                      <img src="https://images.unsplash.com/photo-1591115765373-520b7a08b52f?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="workshop" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase">{event.shortTime}</span>
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase">{event.room}</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">{event.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5"><Users size={14} className="text-slate-400" /> Diễn giả: {event.speaker}</span>
                        <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> Thời gian: 2 giờ</span>
                      </div>
                    </div>
                    <div className="flex items-center px-4">
                      <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:bg-blue-600 hover:text-white transition-all active:scale-90">
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
