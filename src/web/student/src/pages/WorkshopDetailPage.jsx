import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarDays, Clock3, MapPin, CheckCircle2, Sparkles } from "lucide-react";
import StudentShell from "@/components/StudentShell";
import SuccessModal from "@/components/SuccessModal";
import { workshops } from "@/data/mockData";

export default function WorkshopDetailPage() {
  const { id } = useParams();
  const [openSuccess, setOpenSuccess] = useState(false);

  const workshop = useMemo(() => {
    return workshops.find((item) => String(item.id) === id) || workshops[0];
  }, [id]);

  const canRegister = workshop.status === "OPEN" && workshop.slotsLeft > 0;

  return (
    <StudentShell activeTop="Browse">
      <section>
        <div className="relative h-[320px] overflow-hidden rounded-2xl bg-slate-900 md:h-[360px]">
          <img src={workshop.image} alt={workshop.title} className="h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="mb-3 flex gap-2">
              <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold">{workshop.code}</span>
              <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold">{workshop.status}</span>
            </div>
            <h1 className="max-w-4xl text-5xl font-bold">{workshop.title}</h1>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-200">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-4 w-4" /> {workshop.dateLabel}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-4 w-4" /> {workshop.timeLabel}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {workshop.room}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
          <div>
            <h2 className="text-4xl font-bold">About this workshop</h2>
            <p className="mt-4 text-slate-600">{workshop.description}</p>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {workshop.aboutPoints.map((point) => (
                <p key={point} className="inline-flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  {point}
                </p>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border bg-blue-50/60 p-5">
              <p className="inline-flex items-center gap-2 text-xl font-semibold text-blue-700">
                <Sparkles className="h-5 w-5" /> AI Insights
              </p>
              <p className="mt-3 text-sm italic text-slate-600">"{workshop.aiSummary}"</p>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border bg-white p-5">
              <button
                onClick={() => setOpenSuccess(true)}
                disabled={!canRegister}
                className="w-full rounded-lg bg-blue-600 py-3 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {canRegister ? "Dang ky ngay" : "Khong the dang ky"}
              </button>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Price</span>
                  <span className="font-semibold">{workshop.price}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Availability</span>
                  <span className="rounded bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">
                    {workshop.slotsLeft}/{workshop.capacity} cho
                  </span>
                </div>
                {!canRegister ? (
                  <p className="text-xs text-rose-700">Workshop da day cho hoac khong con mo dang ky.</p>
                ) : null}
              </div>

              <div className="mt-5 border-t pt-4">
                <p className="text-xs tracking-widest text-slate-500">SPEAKER</p>
                <p className="mt-1 text-xl font-semibold">{workshop.speaker}</p>
                <p className="text-sm text-slate-500">{workshop.speakerRole}</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5">
              <p className="text-xs tracking-widest text-slate-500">LOCATION</p>
              <div className="mt-3 h-44 rounded-xl bg-slate-100" />
              <p className="mt-3 text-sm">{workshop.location}</p>
              <a
                href={workshop.roomMapUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block w-full rounded-lg border py-2 text-center text-sm font-medium text-blue-700"
              >
                Xem so do phong
              </a>
            </div>

            <div className="rounded-2xl border bg-white p-5">
              <p className="text-xs tracking-widest text-slate-500">MATERIALS INCLUDED</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {workshop.materials.map((material) => (
                  <li key={material}>• {material}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <section className="mt-16">
          <h3 className="text-4xl font-bold">Similar Workshops</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {workshops.slice(1, 4).map((item) => (
              <article key={item.id} className="overflow-hidden rounded-xl border bg-white">
                <img src={item.image} alt={item.title} className="h-44 w-full object-cover" />
                <div className="p-4">
                  <p className="text-2xl font-semibold">{item.title}</p>
                  <p className="text-sm text-slate-500">
                    {item.dateLabel} · {item.room}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <SuccessModal open={openSuccess} onClose={() => setOpenSuccess(false)} workshop={workshop} />
    </StudentShell>
  );
}
