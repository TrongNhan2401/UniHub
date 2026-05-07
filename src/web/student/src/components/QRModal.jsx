import React, { useRef } from "react";
import { X, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function QRModal({ open, onClose, workshop }) {
  const svgRef = useRef(null);

  if (!open || !workshop) return null;

  const handleDownload = () => {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    const serialized = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([serialized], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-checkin-${workshop.qrCode}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between bg-blue-600 p-4 text-white">
          <div>
            <h3 className="text-2xl font-semibold">Mã QR Check-in</h3>
            <p className="text-sm text-blue-100">Quét mã này tại cổng vào khu vực workshop</p>
          </div>
          <button onClick={onClose} aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5 text-center">
          <div
            ref={svgRef}
            className="mx-auto flex w-fit items-center justify-center rounded-2xl border-2 border-blue-100 bg-white p-3"
          >
            <QRCodeSVG
              value={workshop.qrCode}
              size={200}
              level="H"
              includeMargin={false}
              fgColor="#1e293b"
              bgColor="#ffffff"
            />
          </div>

          <div>
            <h4 className="text-2xl font-bold">{workshop.title}</h4>
            <p className="mt-1 text-sm text-slate-500">
              Mã đăng ký: <span className="font-mono font-semibold text-blue-700">{workshop.qrCode}</span>
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-blue-200 py-3 font-semibold text-blue-700 hover:bg-blue-50"
            >
              <Download className="h-4 w-4" /> Tải QR
            </button>
            <button onClick={onClose} className="flex-1 rounded-lg bg-blue-600 py-3 font-semibold text-white">
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
