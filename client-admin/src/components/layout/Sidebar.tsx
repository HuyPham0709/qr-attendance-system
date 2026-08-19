import React from 'react'
import { Screen } from '../../types'
import { GridIcon, CalIcon, UsersIcon, ShieldIcon, QrIcon, BuildingIcon } from '../ui/Icons'
import { AuthUser, logoutApi } from '../../services/authService'
import { navForRole, AdminRole } from '../../utils/rbac'

// Icon riêng cho từng screen — tách khỏi rbac.ts vì rbac.ts không nên phụ
// thuộc JSX (giữ nó thuần logic phân quyền, dễ test/tái sử dụng ở nơi
// khác nếu cần, ví dụ 1 route-guard riêng).
const SCREEN_ICONS: Record<Screen, React.ReactNode> = {
  login: null,
  dashboard: <GridIcon />,
  events: <CalIcon />,
  attendees: <UsersIcon />,
  'staff-audit': <ShieldIcon />,
  organizations: <BuildingIcon />,
}

const ROLE_LABELS: Record<AuthUser['role'], string> = {
  super_admin: 'Super Admin',
  organizer: 'Organizer',
  scanner_staff: 'Scanner Staff',
}

function initialsFor(user: AuthUser) {
  const source = user.name?.trim() || user.email
  return source.slice(0, 2).toUpperCase()
}

interface SidebarProps {
  screen: Screen
  onNavigate: (s: Screen) => void
  user: AuthUser
  onLogout: () => void
}

export function Sidebar({ screen, onNavigate, user, onLogout }: SidebarProps) {
  async function handleLogout() {
    // Xoá cookie httpOnly phía server (revoke refresh token family) trước
    // khi xoá state ở client — trước đây không có bước gọi API này, nút
    // logout chỉ ẩn UI đi trong khi cookie đăng nhập vẫn còn hiệu lực.
    try {
      await logoutApi()
    } finally {
      onLogout()
    }
  }

  // App này chỉ nhận super_admin/organizer (LoginScreen đã chặn
  // scanner_staff trước khi set user), nên ép kiểu an toàn ở đây.
  const role = user.role as AdminRole
  const navItems = navForRole(role)

  return (
    <aside className="w-60 h-screen bg-[#1E293B] flex flex-col shrink-0 relative z-10">
      <div className="px-5 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/40">
            <QrIcon />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">QR Attend</div>
            <div className="text-slate-400 text-[10px]">Event Management</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Main</p>
        {navItems.map(item => {
          const active = screen === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${active ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' : 'text-slate-400 hover:text-white hover:bg-white/8'}`}
            >
              <span className={active ? 'text-white' : 'text-slate-500'}>{SCREEN_ICONS[item.id]}</span>
              {item.label}
            </button>
          )
        })}
        <div className="pt-4 mt-2 border-t border-white/10">
          <p className="px-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">System</p>
          {[
            { label: 'Reports', icon: '📊', visible: true },
            // Mục 1.1 spec: "Cấu hình tham số hệ thống" (giới hạn dung
            // lượng, số sự kiện/gói...) là việc của Super Admin vận hành
            // toàn nền tảng — Organizer chỉ quản lý sự kiện của chính họ
            // (mục 1.2), không có lý do nghiệp vụ để thấy mục này.
            { label: 'Settings', icon: '⚙️', visible: role === 'super_admin' },
          ].filter(item => item.visible).map(item => (
            <button key={item.label} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/8 transition-all duration-150">
              <span className="text-xs">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="px-3 pb-4 border-t border-white/10 pt-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/8 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initialsFor(user)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{user.name || ROLE_LABELS[user.role]}</div>
            <div className="text-slate-500 text-[10px] truncate">
              {user.email} · {ROLE_LABELS[user.role]}
              {/* Hiện org của Organizer ngay dưới sidebar để họ luôn biết
                  mình đang thao tác trong phạm vi tổ chức nào — tránh
                  nhầm lẫn khi 1 người quản lý nhiều org bằng nhiều tài
                  khoản khác nhau. */}
              {role === 'organizer' && user.organizationName ? ` · ${user.organizationName}` : ''}
            </div>
          </div>
          <button onClick={handleLogout} title="Sign out" className="text-slate-500 hover:text-red-400 transition-colors shrink-0">
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
