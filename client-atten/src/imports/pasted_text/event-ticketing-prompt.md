[FIGMA DESIGN BRIEF / AI GENERATION PROMPT]

PROJECT TITLE: Modern E-Commerce Event Ticketing & Smart QR Check-in Platform (Attendee Client)
ROLE: Lead UI/UX Designer
PLATFORM: Responsive Web & Mobile Web App (Desktop 1440px & Mobile 390px - iPhone 14 Pro)
DESIGN STYLE: Modern E-commerce, High-Converting Ticketing Experience, Dark Mode with Glassmorphism Accent, Clean Visual Hierarchy, Vibrant Call-to-Actions.
COLOR PALETTE:
  - Primary / Accent: Electric Indigo (#6366F1) & Neon Purple (#8B5CF6)
  - Background: Deep Slate (#0F172A) & Dark Card (#1E293B)
  - Success / Valid: Emerald Green (#10B981)
  - Warning / Pending: Amber Gold (#F59E0B)
  - Danger / Sold Out / Revoked: Crimson Red (#F43F5E)
TYPOGRAPHY: Inter / SF Pro Display, clean geometric sans-serif with bold headers and clear data badges.

--- DETAILED SCREEN ARCHITECTURE & FLOWS ---

SCREEN 1: LANDING & EVENT DETAIL (Trang Chi Tiết Sự Kiện & Chọn Loại Vé)
- Top Bar: Event branding logo, Language Switcher Toggle (VI/EN), "Tra Cứu Vé" link button.
- Hero Section: High-impact event cover image banner, Event Title, Category Badge, Verified Organizer Info.
- Countdown & Sticky CTA Bar: Real-time countdown timer (Days : Hours : Mins : Secs) to event start time. Dynamic price range ("TỪ 0đ - 500.000đ") with prominent "ĐĂNG KÝ / MUA VÉ NGAY" CTA button.
- Event Info Grid:
  * Date & Time with "Thêm vào Lịch" (.ics / Google Calendar) button.
  * Location Address with interactive Mini-Map preview showing a 200m Geo-Fence perimeter highlight ring.
- Ticket Selection Section (Chức năng Core & Quota Enforcement):
  * Cards for each TicketType (VIP, Standard, Early Bird) displaying Ticket Name, Price, Description, and Quota Badge.
  * Quota Statuses: Active ("Còn 12 vé"), Urgency ("Chỉ còn 2 vé!"), and Disabled/Sold Out ("HẾT VÉ / SOLD OUT" with grayed-out overlay).
  * Quantity Stepper (+ / - counter buttons) for selecting ticket count with instant total price calculation.
- Tabbed Information: Agenda / Session Schedule, Speaker Lineup, Venue Rules, FAQ.

SCREEN 2: MULTI-STEP CHECKOUT SHEET / MODAL (Luồng Điền Thông Tin & Xác Nhận)
- Step Progress Bar Header: [1. Chọn vé] ──► [2. Điền thông tin] ──► [3. Nhận vé QR]
- Dynamic Drawer / Modal overlay sliding up smoothly.
- Form Inputs (Single-ticket & Multi-ticket attendee info):
  * Full Name (Họ và tên) - Required input with icon.
  * Email Address (Email nhận vé) - Required with auto-complete hint & verification check.
  * Phone Number (Số điện thoại) - Optional input.
  * Custom Fields (e.g., T-shirt size dropdown, Organization/Company name).
- Order Summary Card: Selected ticket breakdown, zero-fee badge (if free), promo code field, and Anti-Fraud Agreement Checkbox ("Tôi hiểu rằng vé QR này chỉ sử dụng 01 lần duy nhất").
- Action Buttons: "Quay lại" (Secondary) and "XÁC NHẬN ĐĂNG KÝ" (Primary Gradient Button).

SCREEN 3: DIGITAL PASS & DYNAMIC QR TICKET (Trang Vé Điện Tử & Mã QR Smart Check-in)
- Ticket Card Visual: Designed like a premium concert/boarding pass stub with dashed cut-out lines and smooth inner shadows.
- Dynamic QR Code Container:
  * Centered high-contrast QR Code with an HMAC security seal icon at the center.
  * Watermark overlay & animated glowing scan ring / shimmer effect to prevent screenshot fraud.
  * Dynamic Status Badge:
    - "CHỜ CHECK-IN" (Pulsing Amber Gold badge)
    - "ĐÃ CHECK-IN" (Emerald Green checkmark badge with timestamp & gate name)
    - "VÉ ĐÃ THU HỒI / HUỶ" (Red badge with strikethrough effect)
- Ticket Metadata: Attendee Name, Ticket Type, Unique Ticket Code, Gate Assignment ("Cổng A1").
- Wallet & Export Actions:
  * [Add to Apple Wallet] badge button.
  * [Add to Google Wallet] badge button.
  * [Tải PDF Vé] & [Lưu Ảnh QR] buttons.
  * [Gửi Lại Email] instant action button.
- Event Venue Navigation CTA: "Chỉ đường đến cổng sự kiện" button linking to Google Maps.

SCREEN 4: SELF-SERVICE TICKET LOOKUP PAGE (Trang Tra Cứu Vé Bằng Email)
- Header & Search Card: Clean input box "Nhập địa chỉ Email đã dùng khi đăng ký vé" + CTA "TRA CỨU VÉ".
- Results List View:
  * Event cards registered under that email address.
  * Quick status indicator (Đã đăng ký / Đã check-in).
  * Action buttons: "Gửi lại mã QR qua Email" & "Mở vé trực tiếp trên Web".
- Toast Notification: Success alert "Đã gửi lại email chứa mã QR thành công!".

--- FIGMA PROTOTYPING & ANIMATION INSTRUCTIONS ---
- Checkout Opening: Click "MUA VÉ NGAY" -> Open Overlay (Bottom Sheet on Mobile, Centered Modal on Desktop) with Smart Animate Ease-Out 300ms.
- Step Transition: Click "Xác nhận thông tin" -> Push Left transition to Screen 3 (Digital Pass).
- Ticket Flip/Unfold Effect: Smart Animate transformation from Checkout Modal into the Ticket Stub Pass layout.
- QR Shimmer Effect: Component animation loop for the QR code watermark ring (Glow Pulse loop every 2s).
- Quantity Counter: Interactive Component Variant with bounciness on count changes.