// src/utils/rbac.ts
//
// Nguồn phân quyền DUY NHẤT cho client-admin, bám theo mục 1.1 (Super Admin)
// và 1.2 (Organizer) trong tài liệu spec. client-admin chỉ phục vụ 2 role
// này — Scanner Staff dùng app riêng (client-scanner), Attendee không có
// tài khoản admin.
//
// LƯU Ý: đây là guard ở FE để tránh render nhầm UI (UX), KHÔNG thay thế
// cho việc kiểm tra quyền ở BE. Mọi request thật vẫn phải được middleware
// RBAC + filter theo organizationId ở server chặn lại — FE bị bypass được
// (devtools, gọi thẳng API) nên không được xem đây là lớp bảo mật chính.
import { AuthUser } from '../services/authService'
import { Screen } from '../types'

export type AdminRole = 'super_admin' | 'organizer'

// Mỗi entry ứng với 1 mục trong Sidebar. `screen` phải khớp với case
// trong App.tsx. `roles` liệt kê role nào được thấy mục này.
export interface NavEntry {
  id: Screen
  label: string
  roles: AdminRole[]
}

export const NAV_ENTRIES: NavEntry[] = [
  // Cả 2 role đều có dashboard riêng (nội dung khác nhau, xem DashboardScreen).
  { id: 'dashboard', label: 'Dashboard', roles: ['super_admin', 'organizer'] },

  // Mục 1.2: "Tạo/sửa/xóa sự kiện..." — việc của Organizer trên sự kiện
  // CỦA HỌ. Super Admin chỉ có quyền "xem toàn bộ sự kiện trên hệ thống"
  // (đọc, không sửa) — nên vẫn thấy mục này nhưng ở chế độ read-only,
  // xử lý trong EventsScreen (prop `mode`).
  { id: 'events', label: 'Events', roles: ['super_admin', 'organizer'] },

  // Mục 1.2 vs 1.1: danh sách attendee (tên/email/SĐT) là dữ liệu vận
  // hành sự kiện của Organizer. Mục 1.1 nói rõ Super Admin "không xem
  // được dữ liệu nhạy cảm của attendee nếu không cần thiết → least
  // privilege" — nên KHÔNG có trong nav của super_admin.
  { id: 'attendees', label: 'Attendees', roles: ['organizer'] },

  // Mục 1.2: Organizer gán Scanner Staff cho sự kiện của mình + xem audit
  // log của sự kiện mình. Mục 1.1: Super Admin "xem log audit toàn hệ
  // thống, xử lý sự cố bảo mật" — không có việc gán nhân sự (đó là
  // nghiệp vụ của Organizer). Hai role cùng vào 1 screen nhưng
  // StaffAuditScreen tự ẩn tab "Staff Assignment" khi role = super_admin.
  { id: 'staff-audit', label: 'Staff & Audit', roles: ['super_admin', 'organizer'] },

  // Mục 1.1: "Quản lý tài khoản Organizer (duyệt/khóa tổ chức)" — chỉ
  // Super Admin vận hành nền tảng mới có quyền này.
  { id: 'organizations', label: 'Organizations', roles: ['super_admin'] },
]

export function navForRole(role: AdminRole): NavEntry[] {
  return NAV_ENTRIES.filter(e => e.roles.includes(role))
}

export function canAccessScreen(role: AdminRole, screen: Screen): boolean {
  if (screen === 'login') return true
  const entry = NAV_ENTRIES.find(e => e.id === screen)
  return entry ? entry.roles.includes(role) : false
}

// Màn hình mặc định sau khi login — cả 2 role đều có dashboard nên dùng
// chung, nhưng để riêng hàm ra để dễ đổi sau này nếu logic phức tạp hơn.
export function defaultScreenFor(_role: AdminRole): Screen {
  return 'dashboard'
}

// true nếu Organizer đang quản lý event của org mình. Dùng để filter
// dữ liệu client-side theo đúng mục 1.2: "Cần giới hạn chỉ thấy/sửa
// được sự kiện của chính mình... → filter theo organizationId ở mọi
// query". Trong bản FE-only (mock) này, filter được áp cho mọi list
// theo organizationId của user đăng nhập; Super Admin không bị filter
// vì có quyền xem toàn hệ thống (read-only).
export function scopeByOrganization<T extends { organizationId: string }>(
  role: AdminRole,
  organizationId: string | undefined,
  items: T[]
): T[] {
  if (role === 'super_admin') return items
  if (!organizationId) return []
  return items.filter(i => i.organizationId === organizationId)
}

export function isSuperAdmin(user: Pick<AuthUser, 'role'>): boolean {
  return user.role === 'super_admin'
}

export function isOrganizer(user: Pick<AuthUser, 'role'>): boolean {
  return user.role === 'organizer'
}
