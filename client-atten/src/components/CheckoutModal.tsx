import { useState } from "react";
import type { TicketCounts, AttendeeInfo, ApiTicketType, CheckoutResult, FailedRegistration } from "../types";
import { formatPrice } from "../data/event";
import { registerAttendee, ApiError } from "../lib/api";

interface Props {
  eventId: string;
  eventName: string;
  ticketTypes: ApiTicketType[];
  tickets: TicketCounts;
  onComplete: (result: CheckoutResult) => void;
  onClose: () => void;
}

interface PersonContact {
  fullName: string;
  email: string;
  phone: string;
}

const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CheckoutModal({ eventId, eventName, ticketTypes, tickets, onComplete, onClose }: Props) {
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ done: 0, total: 0 });
  const [agreed, setAgreed] = useState(false);
  // Size áo / tổ chức: áp dụng CHUNG cho cả nhóm đăng ký trong phiên checkout
  // này (đơn giản hoá UX — mỗi người vẫn có tên/email riêng, xem `contacts`
  // bên dưới). Backend lưu 2 field này vào Attendee.customFields (Mixed),
  // xem validators/attendee.validator.js + controllers/attendee.controller.js.
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    tshirt: "M",
    org: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const selectedLines = ticketTypes
    .filter((t) => (tickets[t._id] || 0) > 0)
    .map((t) => ({ ...t, qty: tickets[t._id] || 0 }));

  const subtotal = selectedLines.reduce((s, t) => s + t.price * t.qty, 0);

  // Mỗi ĐƠN VỊ vé (1 người) cần đăng ký riêng vì backend
  // (attendeeSchema.index({ eventId, email }, { unique: true })) bắt buộc
  // 1 email = 1 Attendee/event. Chọn 2 VIP + 1 Standard => 3 "units", cần
  // 3 tên + 3 email khác nhau, không thể gộp vào 1 request duy nhất.
  const units = selectedLines.flatMap((t) =>
    Array.from({ length: t.qty }, () => ({ ticketTypeId: t._id, ticketName: t.name }))
  );
  const isGroup = units.length > 1;

  const [contacts, setContacts] = useState<PersonContact[]>(() =>
    units.map(() => ({ fullName: "", email: "", phone: "" }))
  );

  // units.length có thể đổi nếu người dùng đóng modal, sửa số lượng ở trang
  // sự kiện rồi mở lại (component unmount/mount lại nên state reset — chỉ
  // cần guard cho trường hợp hiếm props đổi mà component không remount).
  if (contacts.length !== units.length) {
    setContacts(units.map((_, i) => contacts[i] || { fullName: "", email: "", phone: "" }));
  }

  const updateContact = (index: number, patch: Partial<PersonContact>) => {
    setContacts((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
    const key = `contact_${index}`;
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (isGroup) {
      contacts.forEach((c, i) => {
        if (!c.fullName.trim() || !c.email.trim() || !EMAIL_RE.test(c.email)) {
          e[`contact_${i}`] = "Cần họ tên và email hợp lệ cho từng người";
        }
      });
    } else {
      if (!form.name.trim()) e.name = "Vui lòng nhập họ và tên";
      if (!form.email.trim() || !EMAIL_RE.test(form.email)) e.email = "Email không hợp lệ";
    }
    if (!agreed) e.agreed = "Vui lòng đồng ý với điều khoản";
    return e;
  };

  // Đăng ký TUẦN TỰ từng người (không Promise.all song song) — cố ý: nếu 1
  // loại vé sắp hết mà 3 người trong nhóm cùng giành vé cuối, xử lý tuần tự
  // giữ đúng thứ tự "ai bấm trước trong danh sách được ưu tiên trước", dễ
  // giải thích cho người dùng hơn là kết quả ngẫu nhiên do race của
  // Promise.all. Mỗi người thất bại KHÔNG chặn những người còn lại trong
  // nhóm — gom vào `failed` để báo rõ ràng ở màn hình kết quả.
  const handleConfirm = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setStep(3);
    setProcessing(true);
    setApiError(null);

    const people = isGroup
      ? contacts.map((c, i) => ({ ...units[i], ...c }))
      : [{ ...units[0], fullName: form.name, email: form.email, phone: form.phone }];

    setProcessingProgress({ done: 0, total: people.length });

    const succeeded: AttendeeInfo[] = [];
    const failed: FailedRegistration[] = [];

    for (const person of people) {
      try {
        const result = await registerAttendee({
          eventId,
          ticketTypeId: person.ticketTypeId,
          fullName: person.fullName,
          email: person.email,
          phone: person.phone || undefined,
          customFields: {
            tshirtSize: form.tshirt,
            organization: form.org || undefined,
          },
        });
        succeeded.push({
          name: result.attendee.fullName,
          email: result.attendee.email,
          phone: result.attendee.phone || "",
          tshirt: form.tshirt,
          org: form.org,
          attendeeId: result.attendee.id,
          ticketCode: result.attendee.ticketCode || result.attendee.id,
          ticketTypeId: person.ticketTypeId,
          ticketName: person.ticketName,
          qty: 1,
          qrDataUrl: result.qrDataUrl,
        });
      } catch (err) {
        failed.push({
          fullName: person.fullName,
          email: person.email,
          ticketName: person.ticketName,
          message: err instanceof ApiError ? err.message : "Đăng ký thất bại, vui lòng thử lại.",
        });
      }
      setProcessingProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setProcessing(false);

    if (succeeded.length === 0) {
      // Toàn bộ thất bại (vd cả nhóm dùng chung 1 email trùng) — quay lại
      // form để sửa thay vì đẩy sang màn hình kết quả trống trơn.
      setStep(2);
      setApiError(failed[0]?.message || "Đăng ký thất bại, vui lòng thử lại.");
      return;
    }

    onComplete({ succeeded, failed });
  };

  const stepLabels = ["Chọn vé", "Điền thông tin", "Nhận vé QR"];

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={step < 3 ? onClose : undefined}
        style={{ animation: "fadeIn 0.2s ease both" }}
      />

      {/* Sheet / Modal */}
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/60 rounded-t-3xl lg:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden slide-up lg:modal-in"
        style={{
          boxShadow:
            "0 -8px 40px rgba(99,102,241,0.2), 0 0 0 1px rgba(99,102,241,0.1)",
        }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-4 flex-shrink-0 border-b border-slate-800">
          <div>
            <h2 className="font-bold text-white text-lg">
              {step < 3 ? "Đăng Ký Vé" : "Đang xử lý..."}
            </h2>
            {step < 3 && (
              <p className="text-xs text-slate-500 mt-0.5">{eventName}</p>
            )}
          </div>
          {step < 3 && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center text-slate-400 hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M1 1l12 12M13 1L1 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Step progress */}
        {step < 3 && (
          <div className="px-6 py-3 flex-shrink-0">
            <div className="flex items-center gap-0">
              {stepLabels.map((label, i) => {
                const s = i + 1;
                const active = s === step;
                const done = s < step;
                return (
                  <div key={label} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                          done
                            ? "bg-indigo-500 text-white"
                            : active
                              ? "bg-indigo-600 text-white ring-2 ring-indigo-500/40 ring-offset-1 ring-offset-slate-900"
                              : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {done ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2 6l3 3 5-5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          s
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-medium whitespace-nowrap ${active ? "text-indigo-400" : done ? "text-slate-400" : "text-slate-600"}`}
                      >
                        {label}
                      </span>
                    </div>
                    {i < stepLabels.length - 1 && (
                      <div
                        className={`flex-1 h-px mx-2 mb-4 transition-colors duration-300 ${done ? "bg-indigo-500" : "bg-slate-700"}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
          {/* STEP 1: xác nhận vé — KHÔNG dùng khung "đơn hàng/thanh toán" vì
              hệ thống này là ĐĂNG KÝ (docx không có payment gateway nào,
              price ở TicketType chỉ mang tính thông tin). Trước đây badge
              "Phí dịch vụ - ZERO FEE" giả vờ có 1 khoản phí rồi miễn nó đi —
              gây hiểu lầm là có giao dịch tiền thật xảy ra trong khi thực
              tế không có bước thu tiền nào cả. */}
          {step === 1 && (
            <div className="space-y-4 fade-up">
              <h3 className="font-semibold text-white text-sm">Xác nhận vé đăng ký</h3>
              <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 divide-y divide-slate-700/50 overflow-hidden">
                {selectedLines.map((t) => (
                  <div key={t._id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-semibold text-white text-sm">{t.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">x{t.qty} vé</p>
                    </div>
                    <div className="text-right">
                      {t.price === 0 ? (
                        <span className="text-emerald-400 font-bold text-sm">MIỄN PHÍ</span>
                      ) : (
                        <span className="font-bold text-white text-sm">
                          {formatPrice(t.price * t.qty)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {subtotal === 0 ? (
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-4 flex items-center justify-between">
                  <span className="text-sm text-slate-300">Tổng chi phí</span>
                  <span className="font-bold text-emerald-400 text-lg">MIỄN PHÍ</span>
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-800/40 border border-slate-700/40 p-4 space-y-2">
                  <div className="flex justify-between font-bold text-white">
                    <span>Số tiền cần chuẩn bị</span>
                    <span className="text-lg">{formatPrice(subtotal)}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Hệ thống chỉ ghi nhận đăng ký, không thu tiền trực tuyến.
                    Vui lòng liên hệ ban tổ chức để biết cách thanh toán cho vé có phí.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Attendee Form */}
          {step === 2 && (
            <div className="space-y-4 fade-up">
              <h3 className="font-semibold text-white text-sm">
                {isGroup ? `Thông tin ${units.length} người tham dự` : "Thông tin người tham dự"}
              </h3>

              {apiError && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  {apiError}
                </div>
              )}

              {isGroup ? (
                // Mỗi ticket-unit cần 1 tên + 1 email RIÊNG (backend chặn
                // trùng email trong cùng 1 event) — không thể gộp chung 1
                // form như lúc chỉ mua 1 vé.
                <div className="space-y-3">
                  {units.map((u, i) => (
                    <div key={i} className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-3.5 space-y-2.5">
                      <p className="text-xs font-semibold text-indigo-300">
                        Người #{i + 1} · {u.ticketName}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <input
                            type="text"
                            value={contacts[i]?.fullName || ""}
                            onChange={(e) => updateContact(i, { fullName: e.target.value })}
                            placeholder="Họ và tên"
                            className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors ${errors[`contact_${i}`] ? "border-rose-500/60" : "border-slate-700 focus:border-indigo-500/60"}`}
                          />
                        </div>
                        <div>
                          <input
                            type="email"
                            value={contacts[i]?.email || ""}
                            onChange={(e) => updateContact(i, { email: e.target.value })}
                            placeholder="email@example.com"
                            className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors ${errors[`contact_${i}`] ? "border-rose-500/60" : "border-slate-700 focus:border-indigo-500/60"}`}
                          />
                        </div>
                      </div>
                      <input
                        type="tel"
                        value={contacts[i]?.phone || ""}
                        onChange={(e) => updateContact(i, { phone: e.target.value })}
                        placeholder="Số điện thoại (tùy chọn)"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
                      />
                      {errors[`contact_${i}`] && (
                        <p className="text-xs text-rose-400">{errors[`contact_${i}`]}</p>
                      )}
                    </div>
                  ))}
                  <p className="text-xs text-slate-500">
                    Mỗi người cần một email khác nhau — hệ thống chỉ cho phép 1 email đăng ký 1 lần cho mỗi sự kiện.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Họ và tên <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <svg
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
                        <path
                          d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => {
                          setForm({ ...form, name: e.target.value });
                          if (errors.name) setErrors({ ...errors, name: "" });
                        }}
                        placeholder="Nguyễn Văn An"
                        className={`w-full bg-slate-800 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors ${errors.name ? "border-rose-500/60 focus:border-rose-500" : "border-slate-700 focus:border-indigo-500/60"}`}
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-xs text-rose-400">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Email nhận vé <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <svg
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <rect
                          x="1"
                          y="3"
                          width="14"
                          height="10"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M1 5l7 5 7-5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => {
                          setForm({ ...form, email: e.target.value });
                          if (errors.email) setErrors({ ...errors, email: "" });
                        }}
                        placeholder="email@example.com"
                        className={`w-full bg-slate-800 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors ${errors.email ? "border-rose-500/60 focus:border-rose-500" : "border-slate-700 focus:border-indigo-500/60"}`}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs text-rose-400">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Số điện thoại{" "}
                      <span className="text-slate-600 font-normal">(tùy chọn)</span>
                    </label>
                    <div className="relative">
                      <svg
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <rect
                          x="4"
                          y="1"
                          width="8"
                          height="14"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <circle cx="8" cy="12" r="0.75" fill="currentColor" />
                      </svg>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="0912 345 678"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Size áo</label>
                  <select
                    value={form.tshirt}
                    onChange={(e) => setForm({ ...form, tshirt: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/60 transition-colors appearance-none cursor-pointer"
                  >
                    {TSHIRT_SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {isGroup && (
                    <p className="mt-1 text-[11px] text-slate-600">Áp dụng chung cho cả nhóm</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Tổ chức / Công ty
                  </label>
                  <input
                    type="text"
                    value={form.org}
                    onChange={(e) => setForm({ ...form, org: e.target.value })}
                    placeholder="Tên công ty..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
                  />
                </div>
              </div>

              {/* Anti-fraud agreement */}
              <label
                className={`flex gap-3 items-start p-4 rounded-xl border cursor-pointer transition-colors ${agreed ? "border-indigo-500/40 bg-indigo-500/8" : errors.agreed ? "border-rose-500/40 bg-rose-500/5" : "border-slate-700 bg-slate-800/40"}`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${agreed ? "bg-indigo-500 border-indigo-500" : "border-slate-600"}`}
                    onClick={() => {
                      setAgreed(!agreed);
                      if (errors.agreed) setErrors({ ...errors, agreed: "" });
                    }}
                  >
                    {agreed && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M1.5 5l2.5 2.5 5-5"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tôi hiểu rằng{" "}
                  <span className="text-indigo-400 font-semibold">
                    vé QR này chỉ sử dụng 01 lần duy nhất
                  </span>{" "}
                  và sẽ bị vô hiệu hóa sau khi check-in. Nghiêm cấm sao chép, chia sẻ hoặc
                  bán lại mã QR.
                </p>
              </label>
              {errors.agreed && (
                <p className="text-xs text-rose-400 -mt-2">{errors.agreed}</p>
              )}
            </div>
          )}

          {/* STEP 3: Processing */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-12 gap-6 fade-up">
              {processing ? (
                <>
                  <div className="relative w-20 h-20">
                    <svg
                      className="spin-slow absolute inset-0"
                      viewBox="0 0 80 80"
                      fill="none"
                    >
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="url(#grad)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="60 160"
                      />
                      <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#6366f1" />
                          <stop offset="1" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path
                            d="M3 10a7 7 0 1014 0A7 7 0 003 10z"
                            stroke="white"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M10 7v3l2 2"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-white text-lg">Đang tạo vé QR...</p>
                    <p className="text-sm text-slate-400 mt-1">
                      {processingProgress.total > 1
                        ? `Đã xử lý ${processingProgress.done}/${processingProgress.total} người`
                        : "Mã bảo mật HMAC đang được ký"}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-indigo-500"
                        style={{
                          animation: `badge-blink 1.2s ease-in-out infinite`,
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {step < 3 && (
          <div className="flex gap-3 px-6 py-4 border-t border-slate-800 flex-shrink-0">
            {step === 1 ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-semibold text-sm hover:bg-slate-800 transition-colors"
                >
                  Quay lại
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm hover:from-indigo-400 hover:to-violet-500 transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/25"
                >
                  Tiếp theo →
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-semibold text-sm hover:bg-slate-800 transition-colors"
                >
                  ← Quay lại
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm hover:from-indigo-400 hover:to-violet-500 transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/25"
                >
                  XÁC NHẬN ĐĂNG KÝ ✓
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
