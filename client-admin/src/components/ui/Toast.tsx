import React from 'react'

export function Toast({ message, type }: { message: string; type: 'success' | 'error' | 'info' }) {
  const cfg = {
    success: 'bg-emerald-500 text-white',
    error:   'bg-red-500 text-white',
    info:    'bg-slate-800 text-white',
  }[type]
  const icon = {
    success: '✓', error: '✕', info: 'ℹ',
  }[type]
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium ${cfg} animate-[fadeInUp_0.3s_ease]`}>
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{icon}</span>
      {message}
    </div>
  )
}