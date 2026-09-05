import React from 'react'
import { Button } from '../ui/Button'
import { StatusBadge } from '../ui/Badges'
import { StatusBadgeType } from '../../types'

interface ActivityRow {
  name: string
  time: string
  gate: string
  status: StatusBadgeType
}

export function ActivityStream({ liveStream }: { liveStream: ActivityRow[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-900">Real-time Activity Stream</h3>
          <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-100">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live
          </span>
        </div>
        <Button variant="ghost" size="sm">View All Logs</Button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-50">
            {['Attendee Name', 'Timestamp', 'Gate', 'Status'].map(h => (
              <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {liveStream.slice(0, 7).map((row, i) => (
            <tr key={i} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors ${i === 0 ? 'bg-emerald-50/40' : ''}`}>
              <td className="px-5 py-3 font-medium text-slate-800">{row.name}</td>
              <td className="px-5 py-3 font-mono text-xs text-slate-500">{row.time}</td>
              <td className="px-5 py-3 text-slate-600 text-xs">{row.gate}</td>
              <td className="px-5 py-3"><StatusBadge status={row.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}