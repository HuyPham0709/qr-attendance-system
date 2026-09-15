// src/data/event.ts
//
// TRƯỚC: file này chứa EVENT, TICKET_TYPES, AGENDA hardcode — đó là lý do
// giao diện "chạy được" mà không hề gọi backend. Giờ EVENT/TICKET_TYPES/
// AGENDA lấy thật từ API (xem src/lib/api.ts + src/hooks/useEventData.ts).
//
// SPEAKERS và FAQS vẫn để tạm ở đây vì backend (server.zip) CHƯA có model
// nào cho "diễn giả" hay "câu hỏi thường gặp" — đây là khoảng trống thật sự
// giữa docx đặc tả và implementation, không phải lỗi của FE. Khi nào có
// model + API tương ứng thì chuyển 2 mảng này sang gọi API như event/ticket.

export const SPEAKERS = [
  { name: "Trần Minh Khôi", role: "CTO, VibeAI", topic: "AI & Âm Nhạc Tương Lai", avatar: "TMK" },
  { name: "Lê Ngọc Hương", role: "Head of Design, VN.DESIGN", topic: "Thiết kế trải nghiệm sự kiện", avatar: "LNH" },
  { name: "Nguyễn Anh Vũ", role: "DJ / Producer", topic: "Sản xuất âm nhạc điện tử", avatar: "NAV" },
];

export const FAQS = [
  {
    q: "Vé QR có thể dùng được bao nhiêu lần?",
    a: "Mỗi mã QR chỉ sử dụng được đúng 01 lần tại cổng check-in. Sau khi quét, vé sẽ bị vô hiệu hóa tự động.",
  },
  {
    q: "Tôi có thể chuyển nhượng vé không?",
    a: "Không. Vé được ràng buộc với thông tin người đăng ký và không thể chuyển nhượng.",
  },
  {
    q: "Nếu mất vé QR thì phải làm sao?",
    a: "Truy cập trang Tra Cứu Vé, nhập email để nhận lại mã QR qua email bất kỳ lúc nào.",
  },
  {
    q: "Sự kiện có bán vé tại cổng không?",
    a: "Không. Tất cả vé phải đăng ký trực tuyến trước giờ sự kiện.",
  },
];

export function formatPrice(price: number): string {
  if (price === 0) return "MIỄN PHÍ";
  return price.toLocaleString("vi-VN") + "đ";
}

/** vd "Thứ Năm, 15 Tháng 10, 2026" — dùng chung cho EventDetail và DigitalPass */
export function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** vd "18:00 – 23:00" */
export function formatTimeRangeLabel(startIso: string, endIso: string): string {
  const fmt = (d: Date) => d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${fmt(new Date(startIso))} – ${fmt(new Date(endIso))}`;
}
