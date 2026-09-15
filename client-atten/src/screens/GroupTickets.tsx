import { useState } from "react";
import DigitalPass from "./DigitalPass";
import { formatDateLabel } from "../data/event";
import type { ApiEvent, CheckoutResult } from "../types";

interface Props {
  event: ApiEvent;
  result: CheckoutResult;
  onBack: () => void;
}

/**
 * Hiển thị khi 1 phiên checkout tạo ra NHIỀU hơn 1 Attendee (mua nhiều vé /
 * nhiều loại vé cùng lúc — xem ghi chú trong CheckoutModal.tsx: mỗi người
 * = 1 lần gọi POST /api/attendees/register riêng). Nếu chỉ có đúng 1 vé
 * thành công và không có vé nào lỗi, App.tsx sẽ đi thẳng vào DigitalPass
 * như cũ, không qua màn hình này.
 */
export default function GroupTickets({ event, result, onBack }: Props) {
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);

  if (viewingIndex !== null) {
    return (
      <DigitalPass
        attendee={result.succeeded[viewingIndex]}
        event={event}
        onBack={() => setViewingIndex(null)}
      />
    );
  }

  return (
    <div className="min-h-full pb-12">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">
        <div className="text-center fade-up">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/25">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M6 14l5.5 5.5L22 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white">
            Đã đăng ký {result.succeeded.length} vé thành công
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {event.name} · {formatDateLabel(event.startAt)}
          </p>
        </div>

        {/* Danh sách vé thành công */}
        <div className="space-y-3 fade-up">
          {result.succeeded.map((a, i) => (
            <div
              key={a.attendeeId}
              className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-4 flex items-center gap-4"
            >
              <img
                src={a.qrDataUrl}
                alt="Mã QR"
                className="w-14 h-14 rounded-lg bg-white p-1 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{a.name}</p>
                <p className="text-xs text-slate-400 truncate">{a.email}</p>
                <p className="text-xs text-indigo-400 font-medium mt-0.5">{a.ticketName}</p>
              </div>
              <button
                onClick={() => setViewingIndex(i)}
                className="flex-shrink-0 px-3.5 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold hover:bg-indigo-500/25 transition-colors"
              >
                Xem vé
              </button>
            </div>
          ))}
        </div>

        {/* Danh sách vé thất bại (nếu có) */}
        {result.failed.length > 0 && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-3 fade-up">
            <p className="font-semibold text-rose-400 text-sm">
              {result.failed.length} vé chưa đăng ký được
            </p>
            <div className="space-y-2">
              {result.failed.map((f, i) => (
                <div key={i} className="rounded-xl bg-slate-900/40 p-3 text-xs">
                  <p className="text-white font-medium">
                    {f.fullName || "(chưa có tên)"} · {f.ticketName}
                  </p>
                  <p className="text-slate-500">{f.email || "(chưa có email)"}</p>
                  <p className="text-rose-400 mt-1">{f.message}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Quay lại trang sự kiện và đăng ký lại riêng cho những người này (vd sửa email trùng, hoặc thử lại nếu vé vừa hết chỗ).
            </p>
          </div>
        )}

        <button
          onClick={onBack}
          className="w-full py-3.5 rounded-2xl bg-violet-500/10 border border-violet-500/30 hover:bg-violet-500/18 transition-all text-violet-300 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] fade-up"
        >
          ← Về trang sự kiện
        </button>
      </div>
    </div>
  );
}
