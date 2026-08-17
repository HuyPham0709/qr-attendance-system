import React from 'react'
import { Screen } from '../../types'
import { GridIcon, CalIcon, UsersIcon, ShieldIcon, QrIcon } from '../ui/Icons'

const navItems = [
  { id: 'dashboard',   label: 'Dashboard',     icon: <GridIcon /> },
  { id: 'events',      label: 'Events',        icon: <CalIcon /> },
  { id: 'attendees',   label: 'Attendees',     icon: <UsersIcon /> },
  { id: 'staff-audit', label: 'Staff & Audit', icon: <ShieldIcon /> },
]

export function Sidebar({ screen, onNavigate }: { screen: Screen; onNavigate: (s: Screen) => void }) {
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
              onClick={() => onNavigate(item.id as Screen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${active ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' : 'text-slate-400 hover:text-white hover:bg-white/8'}`}
            >
              <span className={active ? 'text-white' : 'text-slate-500'}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
        <div className="pt-4 mt-2 border-t border-white/10">
          <p className="px-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">System</p>
          {[
            { label: 'Reports', icon: '📊' },
            { label: 'Settings', icon: '⚙️' },
          ].map(item => (
            <button key={item.label} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/8 transition-all duration-150">
              <span className="text-xs">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="px-3 pb-4 border-t border-white/10 pt-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/8 cursor-pointer transition-colors group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">SA</div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">Super Admin</div>
            <div className="text-slate-500 text-[10px] truncate">admin@qrattend.io</div>
          </div>
          <button className="text-slate-500 hover:text-red-400 transition-colors shrink-0">
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
          </button>
        </div>
      </div>
    </aside>
  )
}