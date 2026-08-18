# Fix bundle — QR Attendance server

Giải nén, COPY ĐÈ toàn bộ thư mục `server/` trong file zip này lên đúng
thư mục `server/` của bạn (giữ nguyên đường dẫn `src/...`, không đổi tên
file nào). Zip chỉ chứa 9 file — 8 file thuộc 4 việc sửa lần trước
(Socket.io, rate limit, assignedEvents, SyncQueue) + 1 file mới phát hiện
(auth.validator.js rỗng gây crash login).

## Danh sách file trong zip

| Đường dẫn (từ `server/`) | Loại | Thuộc việc gì |
|---|---|---|
| `src/validators/auth.validator.js` | Đè file cũ (đang RỖNG) | Fix crash `loginSchema.safeParse` |
| `src/config/socket.js` | Đè file cũ | Socket.io — khởi tạo io |
| `src/sockets/index.js` | **File mới** | Socket.io — auth + join room theo event |
| `src/server.js` | Đè file cũ | Socket.io — tạo `http.Server` để gắn io |
| `src/controllers/checkin.controller.js` | Đè file cũ | assignedEvents check + emit socket thật |
| `src/routes/checkin.routes.js` | Đè file cũ | Gắn rate limiter vào `/scan` |
| `src/middlewares/auth.middleware.js` | Đè file cũ | Thêm `ensureEventAccess()` |
| `src/middlewares/rateLimiter.middleware.js` | **File mới** | Rate limit IP+deviceId cho `/scan` |
| `src/models/SyncQueue.model.js` | **File mới** | Model offline-sync (spec mục 5.5) |

## Sau khi copy đè, chạy các lệnh sau

```bash
cd server
npm install socket.io express-rate-limit
```

(`socket.io` và `express-rate-limit` chưa có trong `package.json`/
`node_modules` của bạn — thiếu 2 package này thì `server.js` mới sẽ
crash ngay lúc `require('socket.io')`.)

## Kiểm tra nhanh sau khi chạy `npm run dev`

- Log khởi động phải còn dòng `🚀 Server đang chạy tại http://localhost:5000
  (kèm Socket.io)` — nếu thiếu `(kèm Socket.io)`, tức `server.js` chưa
  được copy đè đúng.
- `POST /api/auth/login` với email/password sai định dạng phải trả lỗi
  400 `VALIDATION_ERROR` (thay vì crash 500 như trước) — xác nhận
  `auth.validator.js` đã đè đúng.
- `POST /api/checkin/scan` gọi quá 30 lần/phút cùng 1 `deviceId` phải
  trả 429 `RATE_LIMITED`.
- 1 tài khoản `scanner_staff` KHÔNG có trong `assignedEvents` của 1 event
  cụ thể, gọi `/scan` hoặc `/manual` cho attendee thuộc event đó phải trả
  403 `EVENT_NOT_ASSIGNED`.

## Việc CHƯA nằm trong 9 file này (cần bạn gửi thêm file nếu muốn mình làm tiếp)

- Client React Admin: chưa có code `socket.io-client` connect + emit
  `event:join` + lắng nghe `checkin:new`.
- `sync.service.js`: hàm xử lý tuần tự các bản ghi `SyncQueue` (model đã
  có, nhưng chưa có service dùng nó).
- `config/redis.js` đang rỗng nhưng không file nào require tới — không
  đụng vào, tuỳ bạn quyết định giữ hay xoá (spec nói không cần Redis).
- TODO cũ vẫn còn: `organizer` chưa bị giới hạn theo `organizationId`
  của event (đánh dấu trong code, chưa sửa vì ngoài phạm vi yêu cầu ban
  đầu).
