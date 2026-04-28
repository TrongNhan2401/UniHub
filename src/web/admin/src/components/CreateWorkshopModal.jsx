import React, { useState } from "react";
import { X, Calendar, MapPin, Users, Clock, CreditCard, Image as ImageIcon, Upload, Info } from "lucide-react";

export default function CreateWorkshopModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    title: "",
    speaker: "",
    description: "",
    room: "",
    date: "",
    startTime: "",
    endTime: "",
    totalSlots: 100,
    isFree: true,
    price: 0,
    status: "Draft"
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Creating workshop:", formData);
    // In a real app, this would call an API
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Tạo Workshop Mới</h2>
            <p className="text-sm text-slate-500">Điền thông tin chi tiết để lên lịch sự kiện mới.</p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="grid gap-6">
            {/* Title */}
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-slate-700">Tiêu đề Workshop</label>
              <input
                required
                type="text"
                placeholder="VD: Các mẫu thiết kế React nâng cao"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Speaker & Slots */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700">Tên diễn giả</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    required
                    type="text"
                    placeholder="Họ và tên"
                    className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={formData.speaker}
                    onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700">Tổng số chỗ</label>
                <input
                  required
                  type="number"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  value={formData.totalSlots}
                  onChange={(e) => setFormData({ ...formData, totalSlots: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-slate-700">Mô tả</label>
              <textarea
                rows={3}
                placeholder="Sinh viên sẽ học được gì trong workshop này?"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Location & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700">Phòng / Địa điểm</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    required
                    type="text"
                    placeholder="VD: Hội trường A1"
                    className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700">Ngày</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    required
                    type="date"
                    className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700">Giờ bắt đầu</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    required
                    type="time"
                    className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700">Giờ kết thúc</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    required
                    type="time"
                    className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">Chi phí đăng ký</span>
                </div>
                <div className="flex bg-white p-1 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isFree: true, price: 0 })}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${formData.isFree ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                  >
                    Miễn phí
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isFree: false })}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${!formData.isFree ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                  >
                    Có phí
                  </button>
                </div>
              </div>
              
              {!formData.isFree && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Lệ phí (VNĐ)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₫</span>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-200 pl-8 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* AI Summary Info */}
            <div className="flex gap-3 rounded-xl bg-blue-50 p-4 border border-blue-100/50">
              <div className="mt-0.5">
                <Info className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-xs text-blue-700 leading-relaxed">
                <span className="font-bold">Xử lý AI:</span> Sau khi bạn tải lên file PDF giới thiệu, AI của chúng tôi sẽ tự động tạo bản tóm tắt cho trang chi tiết workshop.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 flex items-center justify-end gap-3 border-t pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
            >
              Tạo Workshop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
