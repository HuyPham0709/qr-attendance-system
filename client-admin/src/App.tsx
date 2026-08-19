import React, { useState } from 'react'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { LoginScreen } from './pages/LoginScreen'
import { DashboardScreen } from './pages/DashboardScreen'
import { EventsScreen } from './pages/EventsScreen'
import { AttendeesScreen } from './pages/AttendeesScreen'
import { StaffAuditScreen } from './pages/StaffAuditScreen'
import { OrganizationsScreen } from './pages/OrganizationsScreen'
import { Screen } from './types'
import { AuthUser } from './services/authService'
import { canAccessScreen, defaultScreenFor, AdminRole } from './utils/rbac'

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  // Trước đây chỉ có 1 boolean `authed` — không biết ai vừa đăng nhập,
  // nên toàn app luôn render y hệt nhau (kể cả sidebar hardcode
  // "Super Admin"/admin@qrattend.io) bất kể tài khoản thật là gì. Giờ
  // lưu nguyên user thật (role lấy từ server, không phải role tự chọn ở
  // màn login) để Sidebar/các trang có thể phân quyền hiển thị đúng theo
  // mục 1.1/1.2 spec: Super Admin thấy "System settings" (cấu hình tham
  // số hệ thống), Organizer thì không.
  const [user, setUser] = useState<AuthUser | null>(null)

  const handleLogin = (authedUser: AuthUser) => {
    setUser(authedUser)
    setScreen(defaultScreenFor(authedUser.role as AdminRole))
  }

  const handleLogout = () => {
    setUser(null)
    setScreen('login')
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />
  }

  const role = user.role as AdminRole

  // Route guard: nếu vì lý do gì đó `screen` đang trỏ tới 1 màn hình
  // role hiện tại không có quyền (vd Organizer bị điều hướng thẳng tới
  // 'organizations' bằng URL/state cũ), rơi về màn hình mặc định thay vì
  // render nhầm UI của role khác. Đây là lớp UX-guard trên FE — quyền
  // thật vẫn phải do BE middleware + filter theo organizationId chặn
  // (xem ghi chú trong rbac.ts).
  const safeScreen: Screen = canAccessScreen(role, screen) ? screen : defaultScreenFor(role)

  function handleNavigate(next: Screen) {
    if (!canAccessScreen(role, next)) return
    setScreen(next)
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <Sidebar screen={safeScreen} onNavigate={handleNavigate} user={user} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {safeScreen === 'dashboard' && <DashboardScreen user={user} />}
          {safeScreen === 'events' && <EventsScreen user={user} />}
          {safeScreen === 'attendees' && <AttendeesScreen user={user} />}
          {safeScreen === 'staff-audit' && <StaffAuditScreen user={user} />}
          {safeScreen === 'organizations' && <OrganizationsScreen />}
        </main>
      </div>
    </div>
  )
}
