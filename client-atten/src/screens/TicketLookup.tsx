import { useState } from "react";
import { formatDateLabel } from "../data/event";
import { lookupTickets, resendQrEmail, ApiError } from "../lib/api";
import type { LookupAttendeeResult } from "../types";

interface Props {
  /** Thu hẹp tra cứu về đúng sự kiện đang hiển thị thay vì mọi sự kiện của email này */
  eventId?: string;
}

export default function TicketLookup({ eventId }: Props) {
  const [email, setEmail] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<LookupAttendeeResult[]>([]);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const showToast = (text: string, ok: boolean) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSearch = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setLoading(true);
    setSearchError(null);
    try {
      const data = await lookupTickets(email.trim().toLowerCase(), eventId);
      setResults(data);
      setSearched(true);
    } catch (err) {
      setSearchError(err instanceof ApiError ? err.message : "Tra cứu thất bại, vui lòng thử lại.");
      setSearched(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (attendeeId: string) => {
    setSendingId(attendeeId);
    try {
      const res = await resendQrEmail(attendeeId);
      showToast(
        res.emailSent
          ? "Đã gửi lại email chứa mã QR thành công!"
          : "Yêu cầu đã ghi nhận, nhưng hệ thống email chưa được cấu hình nên chưa gửi được thật.",
        res.emailSent
      );
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Gửi lại email thất bại.", false);
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="min-h-full pb-12">
      {/* Toast — màu/nội dung đổi theo emailSent thật từ backend */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 toast-slide w-[calc(100%-2rem)] max-w-md">
          <div
            className={`flex items-start gap-3 rounded-2xl px-5 py-3.5 backdrop-blur-sm shadow-xl border ${
              toast.ok ? "bg-emerald-500/15 border-emerald-500/40" : "bg-amber-500/15 border-amber-500/40"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                toast.ok ? "bg-emerald-500" : "bg-amber-500"
              }`}
            >
              {toast.ok ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l3 3 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">
        {/* Header */}
        <div className="text-center fade-up">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/30">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="2" />
              <path d="M17 17l5 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white">Tra Cứu Vé</h1>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            Nhập email bạn đã dùng khi đăng ký để tra cứu và quản lý vé.
          </p>
        </div>

        {/* Search Card */}
        <div
          className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-5 fade-up"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)" }}
        >
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Địa chỉ Email đã dùng khi đăng ký vé
          </label>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M1 5l7 5 7-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (searched) setSearched(false);
                  if (searchError) setSearchError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="your@email.com"
                className="w-full bg-slate-900/60 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
              />
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !email.trim()}
            className="w-full mt-3 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm hover:from-indigo-400 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="spin-slow" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                  <path d="M14 8a6 6 0 01-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Đang tìm kiếm...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="white" strokeWidth="1.8" />
                  <path d="M11 11l3 3" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
                TRA CỨU VÉ
              </>
            )}
          </button>
          {searchError && <p className="mt-2 text-xs text-rose-400 text-center">{searchError}</p>}
        </div>

        {/* Results */}
        {searched && (
          <div className="space-y-3 fade-up">
            {results.length === 0 ? (
              <div className="rounded-2xl bg-slate-800/40 border border-slate-700/40 p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="#4b5563" strokeWidth="1.5" />
                    <path d="M9 9l6 6M15 9l-6 6" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="font-semibold text-slate-400">Không tìm thấy vé nào</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Không có vé nào được đăng ký với email này. Kiểm tra lại địa chỉ email.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Tìm thấy {results.length} vé</p>
                  <span className="text-xs text-emerald-400 font-medium">{email}</span>
                </div>

                {results.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-4 space-y-3"
                    style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}
                  >
                    {/* Event + Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-white text-sm">{r.event.name}</p>
                        {r.ticketType && (
                          <p className="text-xs text-indigo-400 font-medium mt-0.5">{r.ticketType.name}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-0.5">{formatDateLabel(r.event.startAt)}</p>
                      </div>
                      <span
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap flex-shrink-0 ${
                          r.status === "cancelled"
                            ? "bg-rose-400/12 border-rose-400/35 text-rose-400"
                            : r.isCheckedIn
                              ? "bg-emerald-400/12 border-emerald-400/35 text-emerald-400"
                              : "bg-amber-400/12 border-amber-400/35 text-amber-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            r.status === "cancelled"
                              ? "bg-rose-400"
                              : r.isCheckedIn
                                ? "bg-emerald-400"
                                : "bg-amber-400 badge-blink"
                          }`}
                        />
                        {r.status === "cancelled" ? "Đã huỷ" : r.isCheckedIn ? "Đã check-in" : "Đã đăng ký"}
                      </span>
                    </div>

                    {/* Mã vé thân thiện — không còn lộ Attendee._id kỹ thuật */}
                    <div className="flex items-center gap-2 bg-slate-900/50 rounded-xl px-3 py-2 border border-slate-700/50">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <rect x="1" y="1" width="10" height="10" rx="2" stroke="#6366f1" strokeWidth="1.2" />
                        <path d="M3 4h6M3 6h4M3 8h5" stroke="#6366f1" strokeWidth="1" strokeLinecap="round" />
                      </svg>
                      <span className="font-mono text-sm font-bold text-slate-200 tracking-[0.2em]">
                        {r.ticketCode || "—"}
                      </span>
                    </div>

                    {/* Expanded QR preview */}
                    {expandedId === r.id && r.qrDataUrl && (
                      <div className="flex justify-center py-2">
                        <img src={r.qrDataUrl} alt="Mã QR" className="w-32 h-32 rounded-xl bg-white p-2" />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleResend(r.id)}
                        disabled={sendingId === r.id || r.status === "cancelled"}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-500/12 border border-indigo-500/30 text-indigo-400 text-xs font-semibold hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
                      >
                        {sendingId === r.id ? (
                          <>
                            <svg className="spin-slow" width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 6" />
                            </svg>
                            Đang gửi...
                          </>
                        ) : (
                          <>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <rect x="1" y="3" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                              <path d="M1 4.5l5 3.5 5-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                            </svg>
                            Gửi lại QR
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                        disabled={!r.qrDataUrl}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-700/50 border border-slate-600/40 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M6 1v6M3.5 4.5L6 7l2.5-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M1 9h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                        {expandedId === r.id ? "Ẩn vé" : "Mở vé"}
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Info footer */}
        {!searched && (
          <div className="grid grid-cols-3 gap-3 fade-up">
            {[
              { icon: "🔒", title: "Bảo mật", desc: "Dữ liệu mã hóa HMAC" },
              { icon: "⚡", title: "Tức thì", desc: "Gửi email dưới 30 giây" },
              { icon: "♾️", title: "Miễn phí", desc: "Không giới hạn lần tra cứu" },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl bg-slate-800/40 border border-slate-700/40 p-3.5 text-center">
                <div className="text-xl mb-1.5">{f.icon}</div>
                <p className="font-semibold text-white text-xs">{f.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
