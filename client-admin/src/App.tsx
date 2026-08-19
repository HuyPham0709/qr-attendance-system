import React, { useState } from 'react'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { LoginScreen } from './pages/LoginScreen'
import { DashboardScreen } from './pages/DashboardScreen'
import { EventsScreen } from './pages/EventsScreen'
import { AttendeesScreen } from './pages/AttendeesScreen'
import { StaffAuditScreen } from './pages/StaffAuditScreen'
import { Screen } from './types'
import { AuthUser } from './services/authService'

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
    setScreen('dashboard')
  }

  const handleLogout = () => {
    setUser(null)
    setScreen('login')
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <Sidebar screen={screen} onNavigate={setScreen} user={user} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {screen === 'dashboard' && <DashboardScreen />}
          {screen === 'events' && <EventsScreen />}
          {screen === 'attendees' && <AttendeesScreen />}
          {screen === 'staff-audit' && <StaffAuditScreen />}
        </main>
      </div>
    </div>
  )
}