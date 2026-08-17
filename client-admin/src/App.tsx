import React, { useState } from 'react'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { LoginScreen } from './pages/LoginScreen'
import { DashboardScreen } from './pages/DashboardScreen'
import { EventsScreen } from './pages/EventsScreen'
import { AttendeesScreen } from './pages/AttendeesScreen'
import { StaffAuditScreen } from './pages/StaffAuditScreen'
import { Screen } from './types'

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [authed, setAuthed] = useState(false)

  const handleLogin = () => {
    setAuthed(true)
    setScreen('dashboard')
  }

  if (!authed) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <Sidebar screen={screen} onNavigate={setScreen} />
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