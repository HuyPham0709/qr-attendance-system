// src/lib/api.ts
//
// Lớp gọi API duy nhất cho toàn bộ client-attendee. Mọi màn hình (EventDetail,
// CheckoutModal, DigitalPass, TicketLookup) đều đi qua đây thay vì tự gọi
// fetch() rải rác — để đổi base URL, xử lý lỗi, hay thêm header chỉ cần sửa
// 1 chỗ.
//
// Backend luôn trả JSON dạng:
//   thành công: { success: true, data: <...> }
//   thất bại:   { success: false, message: string, code: string, details?: any }
// (xem server/src/utils/apiResponse.js). ApiError bên dưới đóng gói lại 3
// trường message/code/details để UI hiển thị đúng lỗi tiếng Việt backend trả
// về thay vì tự bịa thông báo lỗi.

import type {
  ApiEvent,
  ApiTicketType,
  ApiAnnouncement,
  RegisterAttendeePayload,
  RegisterAttendeeResponse,
  LookupAttendeeResult,
  ResendQrResponse
} from '../types';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | undefined>;
}

function buildUrl(path: string, query?: Record<string, string | undefined>): string {
  const url = new URL(`${BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!BASE_URL) {
    // Fail sớm và rõ ràng thay vì để trình duyệt báo lỗi network mơ hồ khi
    // ai đó quên tạo file .env từ .env.example.
    throw new ApiError(
      'Thiếu cấu hình VITE_API_URL — tạo file .env từ .env.example rồi restart dev server.',
      'MISSING_API_URL',
      0
    );
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method || 'GET',
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  } catch (err) {
    // Lỗi network thật (server sập, sai CORS origin, sai URL...) — fetch()
    // không trả response mà throw thẳng TypeError trong trường hợp này.
    throw new ApiError(
      'Không kết nối được tới server. Kiểm tra VITE_API_URL và cấu hình CORS (CLIENT_ATTENDEE_ORIGIN) ở backend.',
      'NETWORK_ERROR',
      0,
      err
    );
  }

  const json = await response.json().catch(() => null);

  if (!response.ok || !json || json.success === false) {
    throw new ApiError(
      json?.message || `Yêu cầu thất bại (HTTP ${response.status})`,
      json?.code || 'UNKNOWN_ERROR',
      response.status,
      json?.details
    );
  }

  return json.data as T;
}

// ---------------------------------------------------------------------------
// Event & Ticket types (public)
// ---------------------------------------------------------------------------

export function getEvent(eventId: string): Promise<ApiEvent> {
  return request<ApiEvent>(`/api/events/${eventId}`);
}

export function getTicketTypes(eventId: string): Promise<{ data: ApiTicketType[] }> {
  // GET /api/ticket-types trả { data, pagination } — không phải mảng trực
  // tiếp, xem ticketType.controller.js -> ok(res, { data: ..., pagination }).
  return request<{ data: ApiTicketType[] }>('/api/ticket-types', {
    query: { eventId, limit: '100' }
  });
}

export function getAnnouncements(eventId: string): Promise<ApiAnnouncement[]> {
  return request<ApiAnnouncement[]>('/api/announcements', { query: { eventId } });
}

// ---------------------------------------------------------------------------
// Attendee (public, không cần đăng nhập)
// ---------------------------------------------------------------------------

export function registerAttendee(
  payload: RegisterAttendeePayload
): Promise<RegisterAttendeeResponse> {
  return request<RegisterAttendeeResponse>('/api/attendees/register', {
    method: 'POST',
    body: payload
  });
}

export function lookupTickets(email: string, eventId?: string): Promise<LookupAttendeeResult[]> {
  return request<LookupAttendeeResult[]>('/api/attendees/lookup', {
    query: { email, eventId }
  });
}

export function resendQrEmail(attendeeId: string): Promise<ResendQrResponse> {
  return request<ResendQrResponse>('/api/attendees/resend', {
    method: 'POST',
    body: { attendeeId }
  });
}
