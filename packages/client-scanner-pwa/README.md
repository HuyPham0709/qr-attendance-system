# Client Scanner PWA

Ứng dụng quét QR dành cho nhân viên soát vé, chạy dưới dạng PWA.

## Chức năng hiện tại

- Login demo cho scanner staff
- Protected routing
- Giao diện mobile tối ưu cho quét QR
- Chọn sự kiện trước khi quét
- Scan page với mock QR viewfinder và manual check-in
- History page hiển thị lịch sử check-in
- Online/offline status indicator
- Service worker skeleton sẵn sàng cho offline support

## Công nghệ sử dụng

- React 19
- Vite
- PWA via vite-plugin-pwa / service worker
- React Router DOM
- Lucide React
- CSS dark theme

## Cấu trúc chính

```text
src/
├─ App.jsx
├─ main.jsx
├─ contexts/
│  ├─ AuthContext.jsx
│  └─ ScanContext.jsx
├─ constants/
│  └─ mockData.js
├─ components/
│  ├─ Header.jsx
│  ├─ TabBar.jsx
│  └─ ...
├─ layouts/
│  └─ ScannerLayout.jsx
├─ pages/
│  ├─ Login.jsx
│  ├─ Scan.jsx
│  └─ History.jsx
└─ styles/
public/
├─ sw.js
└─ manifest.json
```

## Chạy app

```bash
cd packages/client-scanner-pwa
npm install
npm run dev -- --port 5176
```

Mở:
- http://localhost:5176/

## Demo account

- Email: scanner@test.com
- Mật khẩu: password123

## Ghi chú

- Scanner app đang dùng mock data cho sự kiện và lịch sử check-in
- Offline capability đang ở khung sẵn, sẽ tích hợp Dexie/IndexedDB và sync sau
- Service worker được đăng ký trong `src/main.jsx`

## Tình trạng

Đã hoàn thành phần UI khung và mock workflow cho Sprint 1.
