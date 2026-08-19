import React, { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { hourlyData, gateData, GATE_COLORS, recentActivity, events, organizations } from '../data/mockData'
import { StatusBadgeType } from '../types'
import { AuthUser } from '../services/authService'
import { isSuperAdmin } from '../utils/rbac'

interface DashboardScreenProps {
  user: AuthUser
}

export function DashboardScreen({ user }: DashboardScreenProps) {
  // Mục 1.1 spec: Super Admin vận hành toàn nền tảng, không có 1 sự kiện
  // cụ thể để "xem real-time" như Organizer — dashboard của họ là tổng
  // quan hệ thống (số tổ chức, số sự kiện, tổ chức đang chờ duyệt...),
  // KHÔNG lẫn với dashboard theo dõi check-in live của Organizer.
  if (isSuperAdmin(user)) {
    return <SystemOverviewDashboard />
  }
  return <OrganizerDashboard user={user} />
}

function SystemOverviewDashboard() {
  const activeOrgs = organizations.filter(o => o.status === 'Active').length
  const pendingOrgs = organizations.filter(o => o.status === 'Pending').length
  const lockedOrgs = organizations.filter(o => o.status === 'Locked').length

  const statCards = [
    { label: 'Organizations', value: String(organizations.length), sub: `${activeOrgs} active`, icon: '🏢', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Total Events (system)', value: String(events.length), sub: 'across all organizations', icon: '📅', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    { label: 'Pending Approval', value: String(pendingOrgs), sub: 'organizations awaiting review', icon: '⏳', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'Locked', value: String(lockedOrgs), sub: 'security / policy holds', icon: '🔒', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">System Overview</h1>
        <p className="text-sm text-slate-500">Platform-wide status · Super Admin</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className={`bg-white rounded-2xl border ${s.border} p-5 shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center text-lg`}>{s.icon}</div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
            <div className={`mt-1 text-xs font-medium ${s.color}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Events across all organizations</h3>
            <p className="text-xs text-slate-400 mt-0.5">Read-only — event editing belongs to each Organizer</p>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {['Event', 'Organization', 'Location', 'Status'].map(h => (
                <th key={h} className="py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map(e => (
              <tr key={e.id} className="border-b border-slate-50 last:border-0">
                <td className="py-3 font-semibold text-slate-800">{e.name}</td>
                <td className="py-3 text-slate-600 text-xs">{e.organizationName}</td>
                <td className="py-3 text-slate-500 text-xs truncate max-w-[200px]">{e.location}</td>
                <td className="py-3 text-xs text-slate-500">{e.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function OrganizerDashboard({ user }: { user: AuthUser }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 3000)
    return () => clearInterval(id)
  }, [])

  const statCards = [
    { label: 'Total Registered', value: '1,240', sub: '+28 today', icon: '👥', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Total Checked-in', value: '756',   sub: `+${4 + (tick % 3)} last min`, icon: '✅', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Attendance Rate', value: '61.0%',  sub: '↑ 3.2% from last event', icon: '📈', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    { label: 'Revoked / Issues', value: '14',    sub: '4 revoked, 10 pending', icon: '⚠️', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
  ]

  const liveStream = [...recentActivity]
  if (tick % 2 === 0 && liveStream.length > 0) {
    liveStream.unshift({ 
      name: ['Noah Kim', 'Diana Torres', 'Leo Müller'][tick % 3], 
      time: `17:4${2 + tick % 8}:${String(tick % 60).padStart(2,'0')}`, 
      gate: ['Gate A – Main', 'Gate B – VIP'][tick % 2], 
      status: 'Checked-in' as StatusBadgeType 
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Real-time Dashboard</h1>
        <p className="text-sm text-slate-500">
          TechSummit 2026 · Live attendance monitoring{user.organizationName ? ` · ${user.organizationName}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className={`bg-white rounded-2xl border ${s.border} p-5 shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center text-lg`}>{s.icon}</div>
              <span className="text-xs text-slate-400 font-medium">Today</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
            <div className={`mt-1 text-xs font-medium ${s.color}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Hourly Check-in Traffic</h3>
              <p className="text-xs text-slate-400 mt-0.5">Cumulative arrivals by hour</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">Today</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={hourlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="checkins" stroke="#10B981" strokeWidth={2.5} fill="url(#emeraldGrad)" dot={false} activeDot={{ r: 5, fill: '#10B981' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Gate Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Check-ins per gate</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={gateData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {gateData.map((_, i) => <Cell key={i} fill={GATE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {gateData.map((g, i) => (
              <div key={g.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: GATE_COLORS[i] }} />
                  <span className="text-xs text-slate-600 truncate max-w-[100px]">{g.name}</span>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-700">{g.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
