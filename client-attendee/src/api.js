// src/api.js
//
// Client axios dùng chung cho toàn bộ trang Attendee (public, không cần
// đăng nhập). Trỏ về đúng backend đã viết trong server/ — 3 endpoint mới:
//   POST /api/attendees/register
//   GET  /api/attendees/lookup?email=...&eventId=...
//   POST /api/attendees/resend
// cùng 2 endpoint public sẵn có: GET /api/events, GET /api/ticket-types.
//
// VITE_API_URL cho phép trỏ sang backend khác khi deploy (mặc định khớp
// PORT=5000 trong server/.env.example).

import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL });

/**
 * Rút gọn lỗi từ apiResponse.fail() (server/src/utils/apiResponse.js) —
 * { success:false, message, code, details? } — về 1 message dễ hiển thị,
 * kèm danh sách lỗi theo field nếu là lỗi validate (400/VALIDATION_ERROR).
 */
export function describeApiError(err) {
  const body = err?.response?.data;
  if (body?.message) {
    return {
      message: body.message,
      code: body.code,
      fieldErrors: Array.isArray(body.details)
        ? Object.fromEntries(body.details.map((d) => [d.field, d.message]))
        : null
    };
  }
  if (err?.request) {
    return {
      message:
        "Không kết nối được tới máy chủ. Kiểm tra lại kết nối mạng hoặc thử lại sau.",
      code: "NETWORK_ERROR",
      fieldErrors: null
    };
  }
  return { message: err?.message || "Đã có lỗi xảy ra.", code: "UNKNOWN", fieldErrors: null };
}

export const eventsApi = {
  list: () => api.get("/events").then((r) => r.data.data),
  get: (id) => api.get(`/events/${id}`).then((r) => r.data.data)
};

export const ticketTypesApi = {
  listByEvent: (eventId) =>
    api.get("/ticket-types", { params: { eventId, limit: 50 } }).then((r) => r.data.data.data)
};

export const attendeeApi = {
  register: (payload) => api.post("/attendees/register", payload).then((r) => r.data.data),
  lookup: (email, eventId) =>
    api
      .get("/attendees/lookup", { params: { email, eventId: eventId || undefined } })
      .then((r) => r.data.data),
  resend: (attendeeId) =>
    api.post("/attendees/resend", { attendeeId }).then((r) => r.data.data)
};

export default api;
