import React, { useState } from 'react'
import { CalIcon, ChevronIcon, SearchIcon, BellIcon } from '../ui/Icons'
import { AuthUser } from '../../services/authService'
import { Screen } from '../../types'

interface TopBarProps {
  user: AuthUser
  onNavigate: (screen: Screen, query: string) => void
}

export function TopBar({ user, onNavigate }: TopBarProps) {
  const [live] = useState(true)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showOrganization, setShowOrganization] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  function submitSearch(screen: Screen) {
    const query = search.trim()
    if (!query) return
    onNavigate(screen, query)
    setShowSearch(false)
  }

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center px-6 gap-4 shrink-0 sticky top-0 z-10">
      <div className="relative">
        <button type="button" onClick={() => { setShowOrganization(value => !value); setShowNotifications(false); setShowSearch(false) }} className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <CalIcon />
          <span className="text-sm font-medium text-slate-700">{user.organizationName || (user.role === 'super_admin' ? 'All organizations' : user.email)}</span>
          <ChevronIcon />
        </button>
        {showOrganization && <div className="absolute left-0 top-11 z-20 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Organization scope</p><p className="mt-2 text-sm text-slate-700">{user.organizationName || (user.role === 'super_admin' ? 'All organizations' : 'No organization assigned')}</p><p className="mt-1 text-xs text-slate-400">Current access scope</p></div>}
      </div>

      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${live ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
        {live ? 'Admin Session' : 'Disconnected'}
      </div>

      <div className="flex-1" />

      <div className="relative w-56">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><SearchIcon /></span>
        <input
          type="text"
          placeholder="Search attendees, events…"
          value={search}
          onFocus={() => { setShowSearch(true); setShowOrganization(false); setShowNotifications(false) }}
          onChange={event => { setSearch(event.target.value); setShowSearch(true); setShowOrganization(false); setShowNotifications(false) }}
          onKeyDown={event => { if (event.key === 'Enter') submitSearch('events') }}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
        />
        {showSearch && search.trim() && <div className="absolute left-0 top-11 z-20 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"><p className="px-2 py-1 text-xs text-slate-400">Search for “{search.trim()}” in</p><button type="button" onClick={() => submitSearch('events')} className="w-full rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Events</button><button type="button" onClick={() => submitSearch('attendees')} className="w-full rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Attendees</button></div>}
      </div>

      <div className="relative">
        <button type="button" onClick={() => { setShowNotifications(value => !value); setShowOrganization(false); setShowSearch(false) }} className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors" aria-label="Notifications"><BellIcon /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" /></button>
        {showNotifications && <div className="absolute right-0 top-11 z-20 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-lg"><p className="text-sm font-semibold text-slate-700">Notifications</p><p className="mt-2 text-xs text-slate-400">No new notifications.</p></div>}
      </div>
    </header>
  )
}