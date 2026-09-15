// ---------------------------------------------------------------------------
// Kiểu dữ liệu nội bộ UI (giữ nguyên hành vi cũ, dùng ở CheckoutModal/DigitalPass)
// ---------------------------------------------------------------------------

/**
 * Số lượng vé đang chọn, key theo ticketType._id thật từ backend
 * (KHÔNG còn là "vip" | "standard" | "earlybird" cứng như bản mock cũ,
 * vì loại vé giờ do Organizer tạo động qua POST /api/ticket-types).
 */
export type TicketCounts = Record<string, number>;

export interface AttendeeInfo {
  name: string;
  email: string;
  phone: string;
  tshirt: string;
  org: string;
  /** id thật của Attendee trong MongoDB — cần để gọi resend QR sau này */
  attendeeId: string;
  ticketCode: string;
  ticketTypeId: string;
  ticketName: string;
  qty: number;
  /** QR thật (data:image/png;base64,...) trả về từ POST /api/attendees/register */
  qrDataUrl: string;
}

/** 1 lượt đăng ký thất bại trong checkout nhiều người (vd 1 email trong nhóm đã đăng ký trước đó) */
export interface FailedRegistration {
  fullName: string;
  email: string;
  ticketName: string;
  message: string;
}

/**
 * Kết quả của cả phiên checkout — có thể gồm nhiều Attendee vì mỗi lần gọi
 * POST /api/attendees/register chỉ tạo được 1 Attendee (xem CheckoutModal.tsx).
 * Chọn 3 vé cùng lúc = 3 lần gọi register = tối đa 3 phần tử succeeded,
 * một vài lượt có thể fail riêng lẻ (vd email trùng) mà không chặn các vé còn lại.
 */
export interface CheckoutResult {
  succeeded: AttendeeInfo[];
  failed: FailedRegistration[];
}

// ---------------------------------------------------------------------------
// Kiểu dữ liệu khớp response backend (server/src/controllers/*)
// ---------------------------------------------------------------------------

export interface ApiEventAgendaItem {
  time?: string;
  title: string;
  description?: string;
}

export interface ApiEvent {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  banner?: string;
  gallery: string[];
  highlights: string[];
  agenda: ApiEventAgendaItem[];
  organizerInfo?: { name?: string; logo?: string; description?: string };
  tags: string[];
  location?: {
    address?: string;
    geo?: { lat: number; lng: number };
    geoFenceRadiusMeters?: number;
  };
  startAt: string;
  endAt: string;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  stats: { totalRegistered: number; totalCheckedIn: number };
}

export interface ApiTicketType {
  _id: string;
  eventId: string;
  name: string;
  quantityLimit: number | null;
  quantitySold: number;
  price: number;
  description?: string;
  perks: string[];
}

export interface ApiAnnouncement {
  _id: string;
  eventId: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface RegisterAttendeePayload {
  eventId: string;
  ticketTypeId?: string;
  fullName: string;
  email: string;
  phone?: string;
  customFields?: {
    tshirtSize?: string;
    organization?: string;
  };
}

export interface ApiAttendeePublic {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: 'registered' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  isCheckedIn: boolean;
  checkInAt: string | null;
  /** Mã ngắn cho người đọc (vd "K7X9Q2") — dùng để hiển thị, KHÔNG dùng để xác thực check-in */
  ticketCode: string | null;
  customFields: { tshirtSize?: string; organization?: string } | null;
  event: {
    id: string;
    name: string;
    startAt: string;
    endAt: string;
    address: string | null;
    status: string;
  };
  ticketType: { id: string; name: string } | null;
}

export interface RegisterAttendeeResponse {
  attendee: ApiAttendeePublic;
  qrDataUrl: string;
  emailSent: boolean;
}

export interface LookupAttendeeResult extends ApiAttendeePublic {
  qrDataUrl: string | null;
}

export interface ResendQrResponse {
  emailSent: boolean;
  qrDataUrl: string;
}
