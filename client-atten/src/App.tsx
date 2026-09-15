import { useEffect, useState } from "react";
import EventDetail from "./screens/EventDetail";
import DigitalPass from "./screens/DigitalPass";
import GroupTickets from "./screens/GroupTickets";
import TicketLookup from "./screens/TicketLookup";
import CheckoutModal from "./components/CheckoutModal";
import { useEventData } from "./hooks/useEventData";
import type { TicketCounts, CheckoutResult } from "./types";

type Screen = "event" | "pass" | "lookup";

const EVENT_ID = import.meta.env.VITE_EVENT_ID;

export default function App() {
  const [screen, setScreen] = useState<Screen>("event");
  const [lang, setLang] = useState<"VI" | "EN">("VI");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [tickets, setTickets] = useState<TicketCounts>({});
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);

  const { event, ticketTypes, loading, error, reload } = useEventData(EVENT_ID);

  // Khởi tạo bộ đếm số lượng vé mỗi khi danh sách ticketTypes thật về —
  // trước đây DEFAULT_TICKETS = { vip: 0, standard: 1, earlybird: 0 } là
  // hardcode theo 3 id giả; giờ ticketTypes._id là ObjectId động nên phải
  // build object rỗng {ticketTypeId: 0} sau khi biết danh sách thật.
  useEffect(() => {
    if (ticketTypes.length > 0) {
      setTickets(Object.fromEntries(ticketTypes.map((t) => [t._id, 0])));
    }
  }, [ticketTypes]);

  const handleBuyTickets = () => {
    const total = Object.values(tickets).reduce((s, v) => s + v, 0);
    if (total === 0) return;
    setIsCheckoutOpen(true);
  };

  const handleCheckoutComplete = (result: CheckoutResult) => {
    setCheckoutResult(result);
    setIsCheckoutOpen(false);
    setScreen("pass");
  };

  const handleBackToEvent = () => {
    setScreen("event");
    setTickets(Object.fromEntries(ticketTypes.map((t) => [t._id, 0])));
    setCheckoutResult(null);
  };

  return (
    <div
      className="min-h-full"
      style={{ background: "radial-gradient(ellipse at top, #12172b 0%, #0f172a 60%)" }}
    >
      {/* Navigation */}
      <nav
        className="sticky top-0 z-40 border-b border-slate-800/60"
        style={{
          background: "rgba(15,23,42,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <button
            onClick={() => {
              if (screen !== "event") handleBackToEvent();
            }}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 11l5-9 5 9H3z"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  fill="rgba(255,255,255,0.2)"
                />
                <path d="M5.5 11v2h5v-2" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-black text-white text-lg tracking-tight hidden sm:block">
              Vibe<span className="text-indigo-400">Ticket</span>
            </span>
          </button>

          {/* Nav links + controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setScreen("lookup")}
              className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
                screen === "lookup"
                  ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Tra Cứu Vé
            </button>

            {/* Lang toggle */}
            <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700/60 p-0.5">
              {(["VI", "EN"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    lang === l
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Cart badge (desktop) */}
            {screen === "event" && event && (
              <button
                onClick={handleBuyTickets}
                className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm hover:from-indigo-400 hover:to-violet-500 transition-all active:scale-[0.97] shadow-lg shadow-indigo-500/20"
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path
                    d="M1.5 5.5v-2A1 1 0 012.5 2.5h10a1 1 0 011 1v2a1.2 1.2 0 000 2.4v2A1 1 0 0112.5 11h-10a1 1 0 01-1-1v-2a1.2 1.2 0 000-2.4z"
                    stroke="white"
                    strokeWidth="1.3"
                    strokeLinejoin="round"
                  />
                  <path d="M6 2.5v8" stroke="white" strokeWidth="1.2" strokeDasharray="1.4 1.4" />
                </svg>
                Đăng Ký
              </button>
            )}

            {screen === "pass" && (
              <button
                onClick={handleBackToEvent}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-medium transition-all"
              >
                ← Về trang sự kiện
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Loading state khi đang gọi GET /api/events/:id + /api/ticket-types.
          Trước đây chỉ là 1 dòng text canh giữa — thay bằng skeleton phác
          đúng hình dạng trang thật (hero + 2 khối info + 2 ticket card) để
          không bị "giật" bố cục khi dữ liệu thật load xong. */}
      {screen === "event" && loading && (
        <div className="animate-pulse">
          <div className="w-full bg-slate-800/60" style={{ height: "clamp(300px, 45vw, 520px)" }} />
          <div className="max-w-5xl mx-auto px-4 lg:px-8 pt-8 space-y-8">
            <div className="h-28 rounded-2xl bg-slate-800/60" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="h-32 rounded-2xl bg-slate-800/50" />
              <div className="h-32 rounded-2xl bg-slate-800/50" />
            </div>
            <div className="space-y-4">
              <div className="h-6 w-40 rounded bg-slate-800/60" />
              <div className="h-24 rounded-2xl bg-slate-800/50" />
              <div className="h-24 rounded-2xl bg-slate-800/50" />
            </div>
          </div>
        </div>
      )}

      {/* Lỗi gọi API — sai VITE_API_URL/VITE_EVENT_ID, CORS chưa mở, hoặc sự kiện không tồn tại */}
      {screen === "event" && !loading && error && (
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <p className="text-rose-400 font-semibold mb-2">Không tải được sự kiện</p>
          <p className="text-slate-400 text-sm mb-5">{error}</p>
          <button
            onClick={reload}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Screen content */}
      {screen === "event" && !loading && !error && event && (
        <EventDetail
          event={event}
          ticketTypes={ticketTypes}
          tickets={tickets}
          onTicketsChange={setTickets}
          onBuyTickets={handleBuyTickets}
        />
      )}

      {screen === "pass" && checkoutResult && event && (
        checkoutResult.succeeded.length === 1 && checkoutResult.failed.length === 0 ? (
          <DigitalPass attendee={checkoutResult.succeeded[0]} event={event} onBack={handleBackToEvent} />
        ) : (
          <GroupTickets event={event} result={checkoutResult} onBack={handleBackToEvent} />
        )
      )}

      {screen === "lookup" && <TicketLookup eventId={EVENT_ID} />}

      {/* Checkout modal */}
      {isCheckoutOpen && event && (
        <CheckoutModal
          eventId={event._id}
          eventName={event.name}
          ticketTypes={ticketTypes}
          tickets={tickets}
          onComplete={handleCheckoutComplete}
          onClose={() => setIsCheckoutOpen(false)}
        />
      )}
    </div>
  );
}
