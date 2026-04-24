import React, { useState } from "react";
import { Upload, ChevronRight, Sparkles } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { processingQueue, recentSummaries } from "@/data/mockData";

export default function AISummaryPage() {
  const [queue, setQueue] = useState(processingQueue);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    // File handling sẽ nối API thực sau
  };

  return (
    <AdminShell activeTop="Browse">
      <h1 className="text-4xl font-bold">AI Summary Portal</h1>
      <p className="mt-1 text-slate-500">
        Upload academic materials to generate intelligent summaries and study guides using our advanced AI engine.
      </p>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="space-y-5">
          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-14 text-center transition-colors ${dragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white"}`}
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Upload className="h-7 w-7 text-blue-600" />
            </div>
            <p className="text-2xl font-semibold text-slate-700">Drag and drop PDF materials</p>
            <p className="mt-2 text-sm text-slate-500">
              Support for course syllabi, research papers, and lecture notes (Max 50MB per file)
            </p>
            <button className="mt-6 rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700">
              Select Files from Device
            </button>
          </div>

          {/* Processing queue */}
          <div className="rounded-2xl border bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xl font-semibold">Current Processing Queue</p>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                {queue.filter((q) => q.state === "processing").length} Active Tasks
              </span>
            </div>

            <div className="space-y-4">
              {queue.map((item) => (
                <div key={item.id}>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-sm">📄</div>
                      <div>
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className="text-xs text-slate-500">
                          {item.label} • {item.size}
                        </p>
                      </div>
                    </div>
                    {item.state === "done" ? (
                      <button className="text-sm font-semibold text-blue-700">View Result</button>
                    ) : (
                      <span className="text-sm font-semibold text-slate-600">{item.progress}%</span>
                    )}
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${item.state === "done" ? "bg-emerald-500" : "bg-blue-500"}`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Impact card */}
          <div className="rounded-2xl bg-blue-600 p-5 text-white">
            <p className="mb-3 text-sm font-semibold text-blue-100">Your Impact</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-blue-200">TIME SAVED</p>
                <p className="mt-1 text-3xl font-bold">12.5 hrs</p>
              </div>
              <div>
                <p className="text-xs text-blue-200">FILES PROCESSED</p>
                <p className="mt-1 text-3xl font-bold">48</p>
              </div>
            </div>
          </div>

          {/* Recent summaries */}
          <div className="rounded-2xl border bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">Recent Summaries</p>
              <button className="text-xs font-semibold text-blue-700 hover:underline">VIEW ALL</button>
            </div>
            <div className="space-y-2">
              {recentSummaries.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border p-3 hover:bg-slate-50 cursor-pointer"
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.time}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Premium banner */}
          <div className="relative overflow-hidden rounded-2xl">
            <img
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80"
              alt="premium"
              className="h-44 w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-xs text-slate-300">PREMIUM FEATURE</p>
              <p className="mt-1 text-lg font-bold">Interactive Quiz Generator</p>
              <p className="mt-1 text-xs text-slate-300">
                Turn any summary into a set of practice questions automatically.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button className="fixed bottom-8 right-8 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700">
        <Sparkles className="h-5 w-5" />
      </button>
    </AdminShell>
  );
}
