# QR Attendance System

Dự án được tổ chức theo mô hình monorepo với 3 phần chính:

- packages/client-admin: ứng dụng web quản trị cho organizer/admin
- packages/client-scanner-pwa: ứng dụng quét QR dạng PWA cho scanner staff
- services/server: backend/API service do leader phụ trách

## Mục tiêu Sprint 1

### 1. Setup React Admin
- Tạo project Vite React cho admin
- Cài đặt React Router với protected route
- Thiết lập state management bằng Context API
- Tạo layout, sidebar, header, login page, events page
- Dùng mock data để mock UI và flow

### 2. Setup React Scanner PWA
- Tạo project Vite React riêng cho scanner
- Cài đặt PWA-ready structure với service worker skeleton
- Tạo layout mobile, login, scan page, history page
- Dùng mock data và online/offline detection

### 3. Dựng UI khung
- Layout tổng quát cho admin và scanner
- Header, sidebar/tab bar
- Login form với validation
- Danh sách sự kiện theo mock data

## Cấu trúc thư mục

```text
qr-attendance-system-develop/
├─ packages/
│  ├─ client-admin/
│  │  ├─ src/
│  │  ├─ public/
│  │  ├─ package.json
│  │  └─ README.md
│  ├─ client-scanner-pwa/
│  │  ├─ src/
│  │  ├─ public/
│  │  ├─ package.json
│  │  └─ README.md
│  └─ ...
├─ services/
│  └─ server/
├─ package.json (nếu có)
└─ README.md
```

## Chạy project local

### Admin app
```bash
cd packages/client-admin
npm install
npm run dev
```
Mở browser tại:
- http://localhost:5175/

### Scanner PWA
```bash
cd packages/client-scanner-pwa
npm install
npm run dev -- --port 5176
```
Mở browser tại:
- http://localhost:5176/

## Tài khoản demo

### Admin
- Email: organizer@test.com
- Mật khẩu: password123

### Scanner
- Email: scanner@test.com
- Mật khẩu: password123

## Ghi chú kỹ thuật

- Dùng React Router DOM với route bảo vệ (ProtectedRoute)
- Auth state lưu trong localStorage để mô phỏng login
- Event state và scanner state quản lý bằng Context API
- Với Vite, biến môi trường phải dùng `import.meta.env` thay vì `process.env`
- Scanner PWA có sẵn service worker skeleton và online/offline status

## Trạng thái hiện tại

- UI admin hoàn thiện phần layout, login, events list, dashboard placeholder
- UI scanner hoàn thiện phần login, scan, history, trạng thái online/offline
- Backend/API chưa nối thật, đang dùng mock data trong Sprint 1

## Kế hoạch tiếp theo

- Nối API từ backend thật
- Xử lý auth thực, CRUD sự kiện, check-in
- Tích hợp QR scan library và socket realtime
- Cài đặt sync offline và lưu cache với IndexedDB

## Lưu ý

Project đang ở nhánh phát triển riêng để leader merge sau khi backend sẵn sàng.
