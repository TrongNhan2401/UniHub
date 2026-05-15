import React, { useState, useRef } from "react";
import { X, Calendar, MapPin, Users, Clock, CreditCard, Image as ImageIcon, Upload, Info, AlertCircle } from "lucide-react";
import { useCreateWorkshop } from "@/hooks/useWorkshops";

export default function CreateWorkshopModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    speakerName: "",
    speakerBio: "",
    description: "",
    room: "",
    date: "",
    startTime: "",
    endTime: "",
    totalSlots: 100,
    isFree: true,
    price: 0,
    image: null,
  });

  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const createMutation = useCreateWorkshop();

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const fd = new FormData();
      fd.append("title", formData.title);
      fd.append("description", formData.description);
      fd.append("speakerName", formData.speakerName);
      fd.append("speakerBio", formData.speakerBio);
      fd.append("room", formData.room);
      fd.append("startTime", `${formData.date}T${formData.startTime}`);
      fd.append("endTime", `${formData.date}T${formData.endTime}`);
      fd.append("totalSlots", String(formData.totalSlots));
      fd.append("isFree", String(formData.isFree));
      fd.append("price", String(formData.isFree ? 0 : formData.price));
      
      if (formData.image) {
        fd.append("image", formData.image);
      }

      await createMutation.mutateAsync(fd);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to create workshop:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300" 
        onClick={onClose} 
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all animate-in zoom-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-slate-100 px-8 py-6 bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create New Workshop</h2>
            <p className="text-sm font-medium text-slate-500">Design an engaging learning experience for students.</p>
          </div>
          <button
            onClick={onClose}
            className="group flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm"
          >
            <X className="h-5 w-5 transition-transform group-hover:rotate-90" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[75vh]">
          <div className="p-8 space-y-8">
            
            {/* Error Message */}
            {createMutation.isError && (
              <div className="flex items-center gap-3 rounded-2xl bg-rose-50 p-4 border border-rose-100 text-rose-700 animate-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm font-bold">{createMutation.error?.response?.data?.detail || "Something went wrong. Please check your data."}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Media & Meta */}
              <div className="lg:col-span-4 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Cover Image</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative group cursor-pointer aspect-[4/5] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden
                      ${previewUrl ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}`}
                  >
                    {previewUrl ? (
                      <>
                        <img src={previewUrl} alt="Preview" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload className="h-8 w-8 text-white animate-bounce" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-500 group-hover:text-blue-600 uppercase tracking-tighter">Upload Photo</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </div>

                <div className="space-y-4 rounded-2xl bg-slate-50 p-5 border border-slate-100">
                   <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-black text-slate-700 uppercase tracking-tight">Pricing</span>
                   </div>
                   <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isFree: true, price: 0 })}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.isFree ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:text-slate-900"}`}
                      >
                        Free
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isFree: false })}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!formData.isFree ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:text-slate-900"}`}
                      >
                        Paid
                      </button>
                   </div>

                   {!formData.isFree && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₫</span>
                        <input
                          type="number"
                          placeholder="Price"
                          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        />
                      </div>
                    </div>
                   )}
                </div>
              </div>

              {/* Right Column: Content Fields */}
              <div className="lg:col-span-8 space-y-6">
                {/* Basic Info */}
                <div className="grid gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Workshop Title</label>
                    <input
                      required
                      type="text"
                      placeholder="Enter a catchy title..."
                      className="w-full rounded-2xl border border-slate-200 px-5 py-3 text-lg font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">Speaker Name</label>
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          required
                          type="text"
                          placeholder="Dr. John Doe"
                          className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all shadow-sm"
                          value={formData.speakerName}
                          onChange={(e) => setFormData({ ...formData, speakerName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">Max Slots</label>
                      <input
                        required
                        type="number"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all shadow-sm"
                        value={formData.totalSlots}
                        onChange={(e) => setFormData({ ...formData, totalSlots: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Workshop Description</label>
                    <textarea
                      rows={4}
                      placeholder="What will students learn in this session?"
                      className="w-full rounded-2xl border border-slate-200 px-5 py-4 text-sm font-medium outline-none focus:border-blue-500 transition-all resize-none shadow-sm"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>

                {/* Logistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        required
                        type="text"
                        placeholder="Room A101"
                        className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all shadow-sm"
                        value={formData.room}
                        onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        required
                        type="date"
                        className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all shadow-sm"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Start Time</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        required
                        type="time"
                        className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all shadow-sm"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">End Time</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        required
                        type="time"
                        className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all shadow-sm"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-8 py-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-black text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                "Schedule Workshop"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
