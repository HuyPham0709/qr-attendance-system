# Client Admin

Ứng dụng quản trị dành cho organizer/admin trong hệ thống QR Attendance.

## Chức năng hiện tại

- Login demo cho organizer
- Protected routing
- Layout với sidebar và header
- Dashboard placeholder
- Trang Events với danh sách sự kiện và filter theo status
- Trang Attendees placeholder
- Trang Reports placeholder
- Auth state và event state quản lý bằng Context API

## Công nghệ sử dụng

- React 19
- Vite
- React Router DOM
- Lucide React
- CSS module / custom CSS

## Cấu trúc chính

```text
src/
├─ App.jsx
├─ main.jsx
├─ contexts/
│  ├─ AuthContext.jsx
│  └─ EventContext.jsx
├─ constants/
│  └─ mockData.js
├─ components/
│  ├─ Header.jsx
│  ├─ Sidebar.jsx
│  ├─ EventCard.jsx
│  └─ ...
├─ layouts/
│  └─ AdminLayout.jsx
├─ pages/
│  ├─ Login.jsx
│  ├─ Events.jsx
│  ├─ Dashboard.jsx
│  ├─ Attendees.jsx
│  └─ Reports.jsx
└─ styles/
```

## Chạy app

```bash
cd packages/client-admin
npm install
npm run dev
```

Mở:
- http://localhost:5175/

## Demo account

- Email: organizer@test.com
- Mật khẩu: password123

## Ghi chú

- Dữ liệu hiện tại đang dùng mock data để demo UI
- API thật sẽ được leader xử lý ở backend sau
- Vite cần dùng `import.meta.env` thay vì `process.env`

## Tình trạng

Đã hoàn thành phần UI khung và mock flow cho Sprint 1.
