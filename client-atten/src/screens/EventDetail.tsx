import { useState } from "react";
import CountdownTimer from "../components/CountdownTimer";
import { SPEAKERS, FAQS, formatPrice, formatDateLabel, formatTimeRangeLabel } from "../data/event";
import type { ApiEvent, ApiTicketType, TicketCounts } from "../types";

interface Props {
  event: ApiEvent;
  ticketTypes: ApiTicketType[];
  tickets: TicketCounts;
  onTicketsChange: (t: TicketCounts) => void;
  onBuyTickets: () => void;
}

type Tab = "agenda" | "speakers" | "rules" | "faq";

function MiniMap({ label }: { label: string }) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/60" style={{ height: 156 }}>
      <svg viewBox="0 0 320 156" className="w-full h-full" aria-label="Bản đồ địa điểm sự kiện">
        <rect width="320" height="156" fill="#0a1120" />
        {/* Street grid */}
        <rect x="0" y="34" width="320" height="14" fill="#162032" />
        <rect x="0" y="96" width="320" height="14" fill="#162032" />
        <rect x="72" y="0" width="14" height="156" fill="#162032" />
        <rect x="196" y="0" width="14" height="156" fill="#162032" />
        {/* Street center lines */}
        <line x1="0" y1="41" x2="320" y2="41" stroke="#1e3a5a" strokeWidth="1" strokeDasharray="8 6" />
        <line x1="0" y1="103" x2="320" y2="103" stroke="#1e3a5a" strokeWidth="1" strokeDasharray="8 6" />
        <line x1="79" y1="0" x2="79" y2="156" stroke="#1e3a5a" strokeWidth="1" strokeDasharray="8 6" />
        <line x1="203" y1="0" x2="203" y2="156" stroke="#1e3a5a" strokeWidth="1" strokeDasharray="8 6" />
        {/* Buildings */}
        <rect x="8" y="6" width="55" height="22" rx="3" fill="#1e293b" />
        <rect x="8" y="54" width="55" height="36" rx="3" fill="#1e293b" />
        <rect x="94" y="6" width="90" height="22" rx="3" fill="#1e293b" />
        <rect x="94" y="54" width="40" height="36" rx="3" fill="#1e293b" />
        <rect x="140" y="54" width="44" height="36" rx="3" fill="#1e293b" />
        <rect x="218" y="6" width="92" height="22" rx="3" fill="#1e293b" />
        <rect x="218" y="54" width="92" height="36" rx="3" fill="#1e293b" />
        <rect x="8" y="116" width="55" height="34" rx="3" fill="#1e293b" />
        <rect x="94" y="116" width="90" height="34" rx="3" fill="#1e293b" />
        <rect x="218" y="116" width="92" height="34" rx="3" fill="#1e293b" />
        {/* Geo-fence ring */}
        <circle cx="160" cy="78" r="58" fill="rgba(99,102,241,0.07)" stroke="rgba(99,102,241,0.45)" strokeWidth="1.5" strokeDasharray="5 3" />
        <circle cx="160" cy="78" r="42" fill="rgba(99,102,241,0.04)" stroke="rgba(99,102,241,0.2)" strokeWidth="1" strokeDasharray="3 4" />
        {/* Venue highlight */}
        <circle cx="160" cy="78" r="16" fill="rgba(99,102,241,0.2)" />
        <circle cx="160" cy="78" r="7" fill="#6366f1" />
        <circle cx="160" cy="78" r="3" fill="white" />
        {/* Pin drop */}
        <path d="M160 64 Q166 68 164 75 L160 81 L156 75 Q154 68 160 64Z" fill="#6366f1" opacity="0.7" />
      </svg>
      <div className="absolute bottom-2 right-2 bg-slate-900/90 backdrop-blur-sm rounded-lg px-2.5 py-1 text-[10px] text-slate-400 border border-slate-700/60">
        📍 Geo-fence 200m
      </div>
      <div className="absolute top-2 left-2 bg-indigo-600/90 backdrop-blur-sm rounded-lg px-2.5 py-1 text-[10px] text-white font-medium">
        {label}
      </div>
    </div>
  );
}

function TicketCard({
  ticket,
  qty,
  onQtyChange,
}: {
  ticket: ApiTicketType;
  qty: number;
  onQtyChange: (delta: number) => void;
}) {
  // quantityLimit === null nghĩa là KHÔNG giới hạn (đúng convention backend,
  // xem TicketType.model.js) — khác với bản mock cũ luôn có 1 con số cứng.
  const unlimited = ticket.quantityLimit == null;
  const available = unlimited ? Infinity : ticket.quantityLimit! - ticket.quantitySold;
  const soldOut = !unlimited && available <= 0;
  const urgent = !unlimited && available > 0 && available <= 3;
  const maxQty = Math.min(unlimited ? 5 : available, 5);
  const [bouncing, setBouncing] = useState(false);

  const handleQtyChange = (delta: number) => {
    if (soldOut) return;
    if (qty + delta < 0) return;
    if (qty + delta > maxQty) return;
    setBouncing(true);
    setTimeout(() => setBouncing(false), 350);
    onQtyChange(delta);
  };

  return (
    <div
      className={`relative rounded-2xl border p-5 transition-all duration-200 ${
        soldOut
          ? "border-slate-700/40 bg-slate-800/30 opacity-60"
          : qty > 0
            ? "border-indigo-500/50 bg-slate-800/70 shadow-lg shadow-indigo-500/10"
            : "border-slate-700/60 bg-slate-800/50 hover:border-slate-600/80"
      }`}
    >
      {soldOut && (
        <div className="absolute inset-0 rounded-2xl flex items-center justify-center z-10">
          <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl px-4 py-2">
            <span className="text-rose-400 font-bold text-sm tracking-wider">HẾT VÉ / SOLD OUT</span>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-bold text-base ${soldOut ? "text-slate-500" : "text-white"}`}>
              {ticket.name}
            </h3>
          </div>

          {ticket.description && (
            <p className={`text-sm mt-1.5 leading-relaxed ${soldOut ? "text-slate-600" : "text-slate-400"}`}>
              {ticket.description}
            </p>
          )}

          {ticket.perks.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {ticket.perks.map((perk) => (
                <span
                  key={perk}
                  className={`text-[11px] px-2 py-0.5 rounded-full border ${
                    soldOut
                      ? "border-slate-700/40 text-slate-600"
                      : "border-slate-600/50 text-slate-400"
                  }`}
                >
                  {perk}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-3 flex-shrink-0">
          <div className="text-right">
            <p className={`font-bold text-xl ${soldOut ? "text-slate-500" : "text-white"}`}>
              {ticket.price === 0 ? (
                <span className="text-emerald-400">FREE</span>
              ) : (
                formatPrice(ticket.price)
              )}
            </p>
            <div className="mt-1">
              {soldOut ? (
                <span className="text-xs text-rose-400/70 font-medium">Hết vé</span>
              ) : unlimited ? (
                <span className="text-xs text-emerald-400 font-medium">Không giới hạn</span>
              ) : urgent ? (
                <span className="text-xs text-amber-400 font-semibold badge-blink">
                  ⚡ Chỉ còn {available} vé!
                </span>
              ) : (
                <span className="text-xs text-emerald-400 font-medium">Còn {available} vé</span>
              )}
            </div>
          </div>

          {!soldOut && (
            <div className="flex items-center gap-3 bg-slate-900/60 rounded-xl p-1 border border-slate-700/50">
              <button
                onClick={() => handleQtyChange(-1)}
                disabled={qty === 0}
                className="w-8 h-8 rounded-lg bg-slate-700/80 hover:bg-slate-600/80 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-lg transition-all active:scale-90 flex items-center justify-center"
              >
                −
              </button>
              <span
                className={`w-6 text-center font-bold text-white font-mono text-base ${bouncing ? "counter-bounce" : ""}`}
              >
                {qty}
              </span>
              <button
                onClick={() => handleQtyChange(1)}
                disabled={qty >= maxQty}
                className="w-8 h-8 rounded-lg bg-indigo-600/80 hover:bg-indigo-500/80 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-lg transition-all active:scale-90 flex items-center justify-center"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabContent({ tab, event }: { tab: Tab; event: ApiEvent }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  if (tab === "agenda") {
    if (event.agenda.length === 0) {
      return <p className="text-sm text-slate-400 py-3">Chương trình chi tiết sẽ được cập nhật sớm.</p>;
    }
    return (
      <div className="space-y-1">
        {event.agenda.map((item, i) => (
          <div key={i} className="flex gap-4 py-3 border-b border-slate-800/60 last:border-0">
            <div className="w-14 flex-shrink-0 font-mono text-sm font-semibold text-indigo-400 pt-0.5">
              {item.time}
            </div>
            <div>
              <p className="font-semibold text-white text-sm">{item.title}</p>
              {item.description && (
                <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tab === "speakers") {
    // Backend chưa có model "diễn giả" — dữ liệu tĩnh tạm thời (xem data/event.ts)
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SPEAKERS.map((s) => (
          <div key={s.name} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-3">
              <span className="font-bold text-white text-sm">{s.avatar}</span>
            </div>
            <p className="font-bold text-white text-sm">{s.name}</p>
            <p className="text-xs text-indigo-400 font-medium mt-0.5">{s.role}</p>
            <p className="text-xs text-slate-500 mt-1.5">{s.topic}</p>
          </div>
        ))}
      </div>
    );
  }

  if (tab === "rules") {
    const rules = [
      "Xuất trình mã QR để check-in, không chấp nhận ảnh chụp màn hình.",
      "Không mang thức ăn, đồ uống từ bên ngoài vào khu vực sự kiện.",
      "Nghiêm cấm quay phim, chụp ảnh sân khấu bằng thiết bị chuyên nghiệp.",
      "Khán giả dưới 16 tuổi phải có người lớn đi kèm.",
      "Không mang vật sắc nhọn, chất lỏng > 100ml vào cổng.",
      "Tuân thủ hướng dẫn của nhân viên bảo vệ và ban tổ chức.",
      "Ban tổ chức có quyền từ chối phục vụ người say xỉn / gây rối.",
    ];
    return (
      <ul className="space-y-2.5">
        {rules.map((r, i) => (
          <li key={i} className="flex gap-3 text-sm text-slate-300">
            <span className="w-5 h-5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">
              {i + 1}
            </span>
            {r}
          </li>
        ))}
      </ul>
    );
  }

  // Backend chưa có model "FAQ" — dữ liệu tĩnh tạm thời (xem data/event.ts)
  return (
    <div className="space-y-2">
      {FAQS.map((faq, i) => (
        <div key={i} className="rounded-xl border border-slate-700/60 overflow-hidden">
          <button
            onClick={() => setOpenFaq(openFaq === i ? null : i)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left bg-slate-800/50 hover:bg-slate-800/80 transition-colors"
          >
            <span className="font-medium text-sm text-white">{faq.q}</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={`flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
            >
              <path d="M4 6l4 4 4-4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {openFaq === i && (
            <div className="px-4 py-3 bg-slate-800/20 border-t border-slate-700/40">
              <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function EventDetail({ event, ticketTypes, tickets, onTicketsChange, onBuyTickets }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("agenda");

  const totalTickets = Object.values(tickets).reduce((s, v) => s + v, 0);
  const totalPrice = ticketTypes.reduce((s, t) => s + t.price * (tickets[t._id] || 0), 0);

  const prices = ticketTypes.map((t) => t.price);
  const priceRangeLabel =
    prices.length === 0
      ? "—"
      : Math.min(...prices) === Math.max(...prices)
        ? formatPrice(prices[0])
        : `${formatPrice(Math.min(...prices))} – ${formatPrice(Math.max(...prices))}`;

  const tabs: { id: Tab; label: string }[] = [
    { id: "agenda", label: "Lịch trình" },
    { id: "speakers", label: "Diễn giả" },
    { id: "rules", label: "Quy định" },
    { id: "faq", label: "FAQ" },
  ];

  return (
    <div className="min-h-full pb-32 lg:pb-0">
      {/* Hero Banner */}
      <div className="relative w-full overflow-hidden" style={{ height: "clamp(300px, 45vw, 520px)" }}>
        {event.banner ? (
          <img src={event.banner} alt={event.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10">
          <div className="max-w-4xl">
            {event.tags.length > 0 && (
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {event.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-bold bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 px-3 py-1 rounded-full uppercase tracking-wider"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight leading-none">
              {event.name}
            </h1>
            {event.description && (
              <p className="text-slate-300 text-base lg:text-lg mt-2">{event.description}</p>
            )}
            {event.organizerInfo?.name && (
              <div className="flex items-center gap-2.5 mt-3">
                {event.organizerInfo.logo ? (
                  <img
                    src={event.organizerInfo.logo}
                    alt={event.organizerInfo.name}
                    className="w-7 h-7 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-[11px] font-bold text-indigo-200">
                    {event.organizerInfo.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <p className="text-slate-400 text-sm">
                  Tổ chức bởi{" "}
                  <span className="text-indigo-300 font-semibold">{event.organizerInfo.name}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 pt-8 space-y-8">
        {/* Countdown + CTA */}
        <div
          className="rounded-2xl border border-indigo-500/25 bg-slate-800/60 backdrop-blur-sm p-5 lg:p-6"
          style={{ boxShadow: "0 4px 24px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.04)" }}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mb-3">
                Sự kiện bắt đầu sau
              </p>
              <CountdownTimer targetDate={event.startAt} />
            </div>
            <div className="flex flex-col items-start lg:items-end gap-2 w-full lg:w-auto">
              <p className="text-xs text-slate-500">Giá vé từ</p>
              <p className="text-2xl font-black text-white">
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  {priceRangeLabel}
                </span>
              </p>
              <button
                onClick={onBuyTickets}
                className="w-full lg:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-black text-base hover:from-indigo-400 hover:to-violet-500 transition-all active:scale-[0.97] shadow-xl shadow-indigo-500/30 tracking-wide"
              >
                ĐĂNG KÝ NGAY →
              </button>
            </div>
          </div>
        </div>

        {/* Event Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Date & Time */}
          <div className="rounded-2xl bg-slate-800/50 border border-slate-700/60 p-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="4" width="16" height="14" rx="3" stroke="#6366f1" strokeWidth="1.5" />
                  <path d="M2 8h16" stroke="#6366f1" strokeWidth="1.5" />
                  <path d="M7 2v3M13 2v3" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="6" y="11" width="3" height="3" rx="1" fill="#6366f1" opacity="0.6" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
                  Ngày & Giờ
                </p>
                <p className="font-bold text-white">{formatDateLabel(event.startAt)}</p>
                <p className="text-slate-400 text-sm mt-0.5">
                  {formatTimeRangeLabel(event.startAt, event.endAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="rounded-2xl bg-slate-800/50 border border-slate-700/60 p-5">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-11 h-11 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M10 2C7.24 2 5 4.24 5 7c0 4.25 5 11 5 11s5-6.75 5-11c0-2.76-2.24-5-5-5z"
                    stroke="#8b5cf6"
                    strokeWidth="1.5"
                    fill="rgba(139,92,246,0.15)"
                  />
                  <circle cx="10" cy="7" r="1.5" fill="#8b5cf6" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
                  Địa điểm
                </p>
                <p className="text-slate-400 text-sm mt-0.5 leading-relaxed">
                  {event.location?.address || "Chưa cập nhật địa điểm"}
                </p>
              </div>
            </div>
            <MiniMap label={event.location?.address || event.name} />
          </div>
        </div>

        {/* Highlights — dữ liệu thật từ event.highlights (Event.model.js), trước đây có sẵn ở backend nhưng FE chưa dùng tới */}
        {event.highlights.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Điểm nổi bật</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {event.highlights.map((h, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl bg-slate-800/40 border border-slate-700/40 p-3.5"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l2.5 2.5 5.5-5.5" stroke="#818cf8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{h}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery — dữ liệu thật từ event.gallery, tương tự chưa được dùng trước đây */}
        {event.gallery.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Hình ảnh sự kiện</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {event.gallery.slice(0, 6).map((src, i) => (
                <a
                  key={i}
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="block aspect-square rounded-xl overflow-hidden bg-slate-800 border border-slate-700/40 hover:opacity-90 transition-opacity"
                >
                  <img src={src} alt={`${event.name} ${i + 1}`} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Ticket Selection */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-white">Chọn Loại Vé</h2>
              <p className="text-slate-500 text-sm mt-0.5">Tối đa 5 vé mỗi loại</p>
            </div>
            {totalTickets > 0 && (
              <div className="text-right">
                <p className="text-xs text-slate-500">Đang chọn</p>
                <p className="font-bold text-white">
                  {totalTickets} vé · <span className="text-indigo-400">{formatPrice(totalPrice)}</span>
                </p>
              </div>
            )}
          </div>

          {ticketTypes.length === 0 ? (
            <p className="text-sm text-slate-400">Sự kiện chưa mở loại vé nào.</p>
          ) : (
            <div className="space-y-4">
              {ticketTypes.map((ticket) => (
                <TicketCard
                  key={ticket._id}
                  ticket={ticket}
                  qty={tickets[ticket._id] || 0}
                  onQtyChange={(delta) =>
                    onTicketsChange({ ...tickets, [ticket._id]: (tickets[ticket._id] || 0) + delta })
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Tabbed Info Section */}
        <div>
          <div className="flex gap-1 p-1 bg-slate-800/60 rounded-2xl mb-5 border border-slate-700/40">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === t.id
                    ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5">
            <TabContent tab={activeTab} event={event} />
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] text-slate-500 font-medium">
              {totalTickets > 0 ? `${totalTickets} vé đã chọn` : "Chưa chọn vé"}
            </p>
            <p className="font-bold text-white text-lg leading-tight">
              {totalTickets > 0 ? (
                formatPrice(totalPrice)
              ) : (
                <span className="text-slate-400 text-sm font-normal">Chọn vé để tiếp tục</span>
              )}
            </p>
          </div>
          <button
            onClick={onBuyTickets}
            disabled={totalTickets === 0}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:from-indigo-400 hover:to-violet-500 transition-all active:scale-[0.97] shadow-lg shadow-indigo-500/25"
          >
            {totalTickets === 0 ? "CHỌN VÉ" : "ĐĂNG KÝ NGAY →"}
          </button>
        </div>
      </div>
    </div>
  );
}
