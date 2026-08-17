import React, { useState } from 'react'
import { CalIcon, ChevronIcon, SearchIcon, BellIcon } from '../ui/Icons'

export function TopBar() {
  const [live] = useState(true)
  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center px-6 gap-4 shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
        <CalIcon />
        <span className="text-sm font-medium text-slate-700">TechSummit 2026</span>
        <ChevronIcon />
      </div>

      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${live ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
        {live ? 'Real-time Connected' : 'Disconnected'}
      </div>

      <div className="flex-1" />

      <div className="relative w-56">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><SearchIcon /></span>
        <input
          type="text"
          placeholder="Search attendees, events…"
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
        />
      </div>

      <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
        <BellIcon />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
      </button>
    </header>
  )
}