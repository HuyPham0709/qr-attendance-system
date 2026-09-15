/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL của backend, ví dụ http://localhost:5000 (không có dấu / cuối) */
  readonly VITE_API_URL: string;
  /**
   * ID (MongoDB ObjectId) của sự kiện mà trang landing page này hiển thị.
   * Trang này là "single-event microsite" (đúng thiết kế gốc EVENT hardcode
   * trong data/event.ts cũ) — mỗi lần deploy phục vụ đúng 1 sự kiện, không
   * phải trang danh sách nhiều sự kiện.
   */
  readonly VITE_EVENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
