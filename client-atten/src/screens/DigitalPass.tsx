import { useEffect, useState } from "react";
import { formatDateLabel } from "../data/event";
import { resendQrEmail, lookupTickets, ApiError } from "../lib/api";
import type { AttendeeInfo, ApiEvent } from "../types";

interface Props {
  attendee: AttendeeInfo;
  event: ApiEvent;
  onBack: () => void;
}

type TicketStatus = "pending" | "checked-in" | "revoked";

// Khoảng cách giữa 2 lần tự làm mới trạng thái check-in.
const STATUS_POLL_MS = 20000;

export default function DigitalPass({ attendee, event, onBack }: Props) {
  // Cập nhật trạng thái bằng CÁCH POLL định kỳ GET /api/attendees/lookup,
  // KHÔNG dùng Socket.io real-time của backend — lý do: kênh Socket.io hiện
  // có (server/src/sockets/index.js) bắt buộc xác thực bằng access-token
  // cookie httpOnly của tài khoản NỘI BỘ (Admin/Organizer/Scanner). Trang
  // attendee này công khai, không đăng nhập, nên KHÔNG có cookie đó và
  // không join được room `event:<id>` — dựng thêm 1 kênh public riêng (và
  // đảm bảo nó không lộ dữ liệu người khác) là việc thiết kế bảo mật mới,
  // ngoài phạm vi đợt sửa này. Poll bằng endpoint public sẵn có là cách an
  // toàn và đơn giản nhất để có trạng thái "gần real-time".
  const [status, setStatus] = useState<TicketStatus>("pending");
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refreshStatus = async () => {
      try {
        const results = await lookupTickets(attendee.email, event._id);
        const mine = results.find((r) => r.id === attendee.attendeeId);
        if (!mine || cancelled) return;
        if (mine.status === "cancelled") setStatus("revoked");
        else if (mine.isCheckedIn) setStatus("checked-in");
        else setStatus("pending");
      } catch {
        // Lỗi mạng tạm thời khi poll — bỏ qua, giữ nguyên trạng thái hiện
        // tại và thử lại ở lượt poll kế tiếp, không làm phiền người dùng
        // bằng thông báo lỗi cho một hành vi chạy nền.
      }
    };

    refreshStatus();
    const id = setInterval(refreshStatus, STATUS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [attendee.email, attendee.attendeeId, event._id]);

  const handleResendEmail = async () => {
    setResending(true);
    setResendError(null);
    try {
      const res = await resendQrEmail(attendee.attendeeId);
      // res.emailSent === false nghĩa là backend đang ở dev-mode (chưa cấu
      // hình SMTP_HOST trong .env) — email CHƯA thực sự được gửi, chỉ log
      // ra console server (xem services/email.service.js). Trước đây FE
      // luôn hiện "đã gửi thành công" bất kể giá trị này, khiến người dùng
      // tưởng có email trong hộp thư trong khi thực ra không có gì được
      // gửi đi cả — sửa lại để trung thực với trạng thái thật.
      setToast(
        res.emailSent
          ? { text: "Đã gửi lại email chứa mã QR thành công!", ok: true }
          : {
              text: "Yêu cầu đã ghi nhận, nhưng hệ thống email chưa được cấu hình nên chưa gửi được thật. Vui lòng liên hệ ban tổ chức nếu cần vé gấp.",
              ok: false
            }
      );
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      setResendError(err instanceof ApiError ? err.message : "Gửi lại email thất bại.");
    } finally {
      setResending(false);
    }
  };

  const statusConfig = {
    "pending": {
      label: "CHỜ CHECK-IN",
      color: "text-amber-400",
      bg: "bg-amber-400/12 border-amber-400/35",
      dot: "bg-amber-400",
      blink: true,
    },
    "checked-in": {
      label: "ĐÃ CHECK-IN",
      color: "text-emerald-400",
      bg: "bg-emerald-400/12 border-emerald-400/35",
      dot: "bg-emerald-400",
      blink: false,
    },
    "revoked": {
      label: "VÉ ĐÃ HUỶ",
      color: "text-rose-400",
      bg: "bg-rose-400/12 border-rose-400/35",
      dot: "bg-rose-400",
      blink: false,
    },
  };

  const sc = statusConfig[status];

  return (
    <div className="min-h-full pb-12">
      {/* Toast — màu/nội dung đổi theo emailSent thật từ backend, không còn cố định "thành công" */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 toast-slide w-[calc(100%-2rem)] max-w-sm">
          <div
            className={`flex items-start gap-2.5 rounded-2xl px-5 py-3.5 backdrop-blur-sm shadow-xl border ${
              toast.ok ? "bg-emerald-500/15 border-emerald-500/40" : "bg-amber-500/15 border-amber-500/40"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                toast.ok ? "bg-emerald-500" : "bg-amber-500"
              }`}
            >
              {toast.ok ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l2.5 2.5 5.5-5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span className="text-white text-xs font-bold">!</span>
              )}
            </div>
            <span className={`font-semibold text-sm leading-snug ${toast.ok ? "text-emerald-300" : "text-amber-300"}`}>
              {toast.text}
            </span>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        {/* Page header */}
        <div className="text-center fade-up">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/25 rounded-full px-4 py-1.5 mb-3">
            <div className="w-2 h-2 rounded-full bg-indigo-400 badge-blink" />
            <span className="text-xs text-indigo-300 font-semibold uppercase tracking-widest">
              Vé Điện Tử
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">{event.name}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {formatDateLabel(event.startAt)}
            {event.location?.address ? ` · ${event.location.address}` : ""}
          </p>
        </div>

        {/* Ticket Card */}
        <div
          className="rounded-3xl overflow-visible relative fade-up"
          style={{
            background: "linear-gradient(145deg, #1e293b 0%, #162033 100%)",
            border: "1px solid rgba(99,102,241,0.3)",
            boxShadow: "0 8px 40px rgba(99,102,241,0.2), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Top gradient accent */}
          <div
            className="absolute top-0 left-0 right-0 h-px rounded-t-3xl"
            style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.6), rgba(139,92,246,0.6), transparent)" }}
          />

          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <span className="font-black text-white text-[10px]">
                    {event.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <span className="font-black text-white text-lg tracking-tight">{event.name}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${sc.bg} ${sc.color}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${sc.blink ? "badge-blink" : ""}`} />
                {sc.label}
              </span>
            </div>
          </div>

          {/* QR Code Section — ảnh QR thật (data URL) trả về từ
              POST /api/attendees/register, đã ký HMAC ở backend
              (qrEngine.service.js), không còn là SVG vẽ giả nữa. */}
          <div className="px-6 py-4 flex flex-col items-center">
            <div className="w-[200px] h-[200px] rounded-2xl bg-white p-3 flex items-center justify-center overflow-hidden">
              <img src={attendee.qrDataUrl} alt="Mã QR check-in" className="w-full h-full object-contain" />
            </div>
            <p className="mt-4 text-[10px] font-mono text-slate-500 tracking-widest uppercase">
              Quét mã để check-in
            </p>
          </div>

          {/* Dashed separator with notches */}
          <div className="relative mx-5 my-2">
            <div className="absolute -left-9 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950 border border-slate-700/40" />
            <div className="border-t-2 border-dashed border-indigo-500/25" />
            <div className="absolute -right-9 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950 border border-slate-700/40" />
          </div>

          {/* Attendee stub */}
          <div className="px-6 pb-6 pt-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Họ và tên</p>
                <p className="font-bold text-white text-sm mt-0.5">{attendee.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Loại vé</p>
                <p className="font-bold text-indigo-300 text-sm mt-0.5">{attendee.ticketName}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Mã vé</p>
                <p className="font-mono font-bold text-white text-base mt-0.5 tracking-[0.2em]">
                  {attendee.ticketCode}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Ngày sự kiện</p>
                <p className="font-medium text-slate-300 text-sm mt-0.5">{formatDateLabel(event.startAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet & Export Actions */}
        <div className="space-y-3 fade-up">
          {resendError && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 text-center">
              {resendError}
            </div>
          )}

          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest text-center">
            Lưu & Chia sẻ vé
          </p>

          {/* Apple/Google Wallet: chưa có tích hợp thật ở backend (mục 1.4
              "Nâng cao" trong docx) — giữ nguyên là placeholder như bản gốc. */}
          <div className="grid grid-cols-2 gap-3">
            <button
              disabled
              title="Chưa triển khai — cần backend sinh file .pkpass"
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/40 text-slate-500 font-semibold text-sm cursor-not-allowed"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1" y="3" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="1.3" />
                <path d="M5 9h3M5 12h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <circle cx="13" cy="9" r="1.5" fill="currentColor" />
              </svg>
              Apple Wallet
            </button>
            <button
              disabled
              title="Chưa triển khai — cần backend sinh Google Wallet pass"
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/40 text-slate-500 font-semibold text-sm cursor-not-allowed"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3" />
                <path d="M9 6v6M6 9h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Google Wallet
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* "Lưu QR" hoạt động thật: ảnh QR đã là data URL thật nên tải
                trực tiếp từ trình duyệt được, không cần gọi thêm API. */}
            <a
              href={attendee.qrDataUrl}
              download={`qr-${attendee.attendeeId}.png`}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/40 transition-all text-slate-300 hover:text-white text-xs font-medium active:scale-[0.96]"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.3" />
                <path d="M6 9h6M9 6v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Lưu QR
            </a>
            <button
              onClick={handleResendEmail}
              disabled={resending}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/40 transition-all text-slate-300 hover:text-white text-xs font-medium active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
                <path d="M2 6l7 5 7-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              {resending ? "Đang gửi..." : "Gửi lại Email"}
            </button>
          </div>

          <button
            onClick={onBack}
            className="w-full py-3.5 rounded-2xl bg-violet-500/10 border border-violet-500/30 hover:bg-violet-500/18 transition-all text-violet-300 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            ← Về trang sự kiện
          </button>
        </div>

        {/* Security notice */}
        <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-4 flex gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/12 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1l1.5 3h3l-2.5 2 1 3.5L7 8l-3 1.5 1-3.5L2.5 4h3L7 1z" stroke="#f59e0b" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-400">Bảo mật HMAC</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Mã QR này được ký bằng thuật toán HMAC-SHA256. Mỗi mã chỉ có giá trị sử dụng 01 lần tại cổng check-in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
