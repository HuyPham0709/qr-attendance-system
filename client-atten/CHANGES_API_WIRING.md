# Nhật ký nối API — client-attendee

Bản đầu tiên hoàn toàn là mock (không có `fetch`/`axios` nào trong code).
Đã nối toàn bộ 4 màn hình với backend thật (`server.zip`) qua 2 đợt sửa.

## File mới

- `src/lib/api.ts` — lớp gọi API duy nhất (event, ticket-types, register, lookup, resend).
- `src/hooks/useEventData.ts` — hook fetch event + ticket types, có loading/error.
- `src/screens/GroupTickets.tsx` — màn hình kết quả khi 1 lần checkout tạo ra NHIỀU vé (xem mục "Đăng ký nhiều vé" bên dưới).
- `.env.example` — cần copy thành `.env` và điền `VITE_API_URL`, `VITE_EVENT_ID`.

## File đã sửa (tóm tắt theo tính năng)

| File | Thay đổi chính |
|---|---|
| `src/types.ts` | Type khớp response backend. `TicketCounts` = `Record<ticketTypeId, number>` (động, không còn 3 id cứng). Thêm `CheckoutResult`, `FailedRegistration` cho luồng đăng ký nhiều người. |
| `src/data/event.ts` | Xoá `EVENT`/`TICKET_TYPES`/`AGENDA` hardcode. Giữ `SPEAKERS`, `FAQS` tạm thời (backend chưa có model — xem "Khoảng trống còn lại"). |
| `src/App.tsx` | Fetch event thật, quản lý `CheckoutResult`, điều hướng sang `DigitalPass` (1 vé) hoặc `GroupTickets` (nhiều vé/có lỗi). |
| `src/screens/EventDetail.tsx` | Nhận `event`, `ticketTypes` thật qua props. |
| `src/components/CheckoutModal.tsx` | Gọi thật `POST /api/attendees/register`. **Hỗ trợ mua nhiều vé/nhiều loại cùng lúc** — xem chi tiết bên dưới. Gửi kèm `customFields` (size áo, tổ chức) — cần bản vá backend đi kèm mới lưu được. |
| `src/screens/DigitalPass.tsx` | QR thật (HMAC) từ backend thay vì SVG giả. Nút gửi lại gọi thật API. **Tự poll trạng thái check-in mỗi 20s** (xem chi tiết bên dưới). |
| `src/screens/TicketLookup.tsx` | Gọi thật `GET /api/attendees/lookup` + `POST /api/attendees/resend`. |
| `src/components/CountdownTimer.tsx` | Nhận `targetDate` qua prop thay vì hardcode ngày. |

## Đợt sửa thứ 3 — trải nghiệm thật, bỏ phần "làm cho có"

Phản hồi: nhiều chỗ tuy đã gọi API thật nhưng UI vẫn hiển thị/phản hồi kiểu
"giả" — sửa từng điểm cụ thể:

| Vấn đề | Đã sửa thế nào |
|---|---|
| "Mã khuyến mãi" ở Checkout không làm gì | **Xóa hẳn** — không có tính năng coupon trong docx/backend, để lại là lừa dối UI. |
| Toast "Gửi lại email thành công" luôn hiện dù email không thực sự gửi | Phát hiện nguyên nhân: backend chạy dev-mode vì thiếu `SMTP_HOST`, luôn trả `emailSent:false`. FE trước đây bỏ qua field này. Giờ đọc đúng `emailSent` từ response — hiện toast **vàng cảnh báo** nếu chưa gửi thật, xanh nếu gửi thật thành công. |
| Hiển thị thẳng Attendee `_id` (ObjectId, vd `67f1a2b3...`) làm "mã tham chiếu" | Thêm field `ticketCode` ở backend (mã 6 ký tự dễ đọc, vd `K7X9Q2`, sinh tự động khi tạo Attendee) — **cần áp bản vá backend đi kèm** để có field này. |
| Trang chủ chỉ dùng `name/description/banner`, bỏ qua nhiều field thật khác | Thêm section **"Điểm nổi bật"** (`event.highlights`) và **"Hình ảnh sự kiện"** (`event.gallery`) — dữ liệu thật có sẵn ở `Event.model.js` nhưng trước đây FE không hiển thị. Cũng hiện đủ tags + logo tổ chức thay vì chỉ 1 tag. |
| Màn hình loading chỉ là dòng chữ "Đang tải..." | Thay bằng skeleton phác đúng bố cục trang thật (hero + info + ticket cards), tránh giật layout khi data load xong. |

### Về "cổng thanh toán làm cho có" — đã chốt: giữ miễn phí, làm rõ UI

Bạn xác nhận giữ đúng mô hình docx (đăng ký, không thu tiền online). Đã sửa:

- Bỏ badge giả **"Phí dịch vụ — ZERO FEE"** (ngụ ý có 1 khoản phí rồi miễn nó
  đi — không có cơ chế phí nào thật cả).
- Đổi "Tóm tắt đơn hàng" → **"Xác nhận vé đăng ký"**.
- Vé có giá tiền (`price > 0`) giờ ghi rõ: *"Hệ thống chỉ ghi nhận đăng ký,
  không thu tiền trực tuyến. Vui lòng liên hệ ban tổ chức để biết cách
  thanh toán cho vé có phí."* — không còn ngụ ý đã có giao dịch xảy ra.
- Đổi toàn bộ nút **"MUA VÉ NGAY"** → **"ĐĂNG KÝ NGAY"** (nav, hero CTA,
  sticky CTA mobile) và icon giỏ hàng → icon vé, cho khớp với việc đây là
  đăng ký tham dự chứ không phải giỏ hàng thương mại.

## Đợt sửa thứ 2 — đăng ký nhiều vé thật

Backend chỉ tạo **đúng 1 Attendee mỗi lần gọi** `POST /api/attendees/register`,
và chặn trùng `(eventId, email)`. Vì vậy chọn ví dụ "2 VIP + 1 Standard" giờ
hoạt động thế này:

1. `CheckoutModal` tính ra 3 "ticket-unit", mỗi unit cần 1 tên + 1 email riêng.
2. Nếu chỉ có 1 unit → giữ nguyên form 1 người như cũ (không đổi UX).
3. Nếu >1 unit → hiện form riêng cho từng người, gọi `register` **tuần tự**
   từng người một (không `Promise.all` — cố ý, để thứ tự giành vé cuối công
   bằng và dễ debug).
4. Người nào lỗi (vd email trùng, vé vừa hết) KHÔNG chặn những người còn lại
   — gom vào `CheckoutResult.failed`, hiển thị rõ trên `GroupTickets.tsx` để
   người dùng biết chính xác cần sửa gì và đăng ký lại riêng cho ai.

`tshirtSize`/`organization` hiện áp dụng CHUNG cho cả nhóm trong 1 phiên
checkout (đơn giản hoá UX) — nếu cần mỗi người 1 size áo riêng, tách field
này vào từng block người trong `CheckoutModal.tsx`.

## Trạng thái check-in "gần real-time" trên DigitalPass (mới)

`DigitalPass` giờ tự gọi lại `GET /api/attendees/lookup` mỗi 20 giây để cập
nhật badge "CHỜ CHECK-IN" → "ĐÃ CHECK-IN" khi Scanner quét vé thành công.

**Không dùng Socket.io** dù backend đã có sẵn kênh real-time
(`server/src/sockets/index.js`) — vì kênh đó bắt buộc cookie access-token
của tài khoản nội bộ (Admin/Organizer/Scanner). Trang attendee này công
khai, không đăng nhập, nên không thể join room theo cách đó. Dựng thêm 1
kênh Socket.io public riêng (và đảm bảo không lộ dữ liệu người khác) là
việc thiết kế bảo mật mới, chưa làm trong đợt này — polling là giải pháp an
toàn, dùng được ngay với endpoint public sẵn có.

## Trước khi chạy

1. `cp .env.example .env` rồi điền đúng `VITE_API_URL` và `VITE_EVENT_ID`
   (lấy qua Organizer hoặc `npm run seed` ở backend).
2. Backend (`server/.env`) cần đúng origin của app này trong
   `CLIENT_ATTENDEE_ORIGIN`.
3. Sự kiện phải ở trạng thái `published` hoặc `ongoing`.
4. **Cần áp bản vá backend đi kèm** (`server_patch_customFields_sync.zip`)
   để `customFields` (size áo/tổ chức) thực sự được lưu — nếu không áp,
   backend cũ vẫn hoạt động bình thường, chỉ 2 field này bị bỏ qua âm thầm
   do zod schema cũ không nhận (không lỗi, không mất tính năng chính).

## Khoảng trống còn lại (chưa làm)

- **SPEAKERS / FAQS**: backend chưa có model, vẫn là dữ liệu tĩnh.
- **Apple/Google Wallet**: nút placeholder — mục "(Nâng cao)" theo đúng docx,
  backend chưa có endpoint sinh `.pkpass`/Google Wallet object.
- **1 size áo cho cả nhóm**: xem giải thích ở mục "Đăng ký nhiều vé" — chấp
  nhận được cho hầu hết trường hợp, nhưng không phải mỗi người 1 size riêng.
