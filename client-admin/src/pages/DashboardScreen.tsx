import React, { useState, useEffect } from 'react'
import { StatusBadge } from '../components/ui/Badges'
import { StatusBadgeType } from '../types'
import { AuthUser } from '../services/authService'
import { isSuperAdmin } from '../utils/rbac'
import { getOrganizerStats, getSystemStats } from '../services/dashboardService'
import { listEvents } from '../services/eventService'

interface DashboardScreenProps {
  user: AuthUser
}

export function DashboardScreen({ user }: DashboardScreenProps) {
  const [stats, setStats] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    const fetchData = async () => {
      try {
        const [data, eventsRes] = await Promise.all([
          isSuperAdmin(user) ? getSystemStats() : getOrganizerStats(),
          listEvents({ limit: 100 })
        ])
        if (!cancelled) {
          setStats(data)
          setEvents(eventsRes.data || [])
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Không thể tải dữ liệu dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [user])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-sm text-slate-500">Đang tải dữ liệu...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-sm text-red-500">{error}</div>
      </div>
    )
  }

  if (!stats) return null

  if (isSuperAdmin(user)) {
    return <SystemOverviewDashboard stats={stats} events={events} />
  }
  return <OrganizerDashboard user={user} stats={stats} />
}

function SystemOverviewDashboard({ stats, events }: { stats: any; events: any[] }) {
  const activeOrgs = stats.activeOrgs || 0
  const pendingOrgs = stats.pendingOrgs || 0
  const lockedOrgs = stats.lockedOrgs || 0

  const statCards = [
    { label: 'Organizations', value: String(stats.totalOrgs || 0), sub: `${activeOrgs} active`, icon: '🏢', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Total Events (system)', value: String(stats.totalEvents || 0), sub: 'across all organizations', icon: '📅', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
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
            <h3 className="text-sm font-semibold text-slate-900">System Events</h3>
            <p className="text-xs text-slate-400 mt-0.5">Total {stats.totalEvents || 0} events across all organizations</p>
          </div>
        </div>
        {events.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-8">No events found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Event', 'Status', 'Start / End', 'Location'].map(h => (
                    <th key={h} className="py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((e: any) => {
                  const statusMap: Record<string, string> = {
                    draft: 'Draft', published: 'Published', ongoing: 'Ongoing',
                    completed: 'Completed', cancelled: 'Cancelled'
                  }
                  const displayStatus = statusMap[e.status] || e.status
                  const start = e.startAt ? new Date(e.startAt).toLocaleString('vi-VN') : '--'
                  const end = e.endAt ? new Date(e.endAt).toLocaleString('vi-VN') : '--'
                  const location = e.location?.address || '--'
                  return (
                    <tr key={e._id} className="border-b border-slate-50 last:border-0">
                      <td className="py-3 font-semibold text-slate-800">{e.name}</td>
                      <td className="py-3 text-xs text-slate-500">{displayStatus}</td>
                      <td className="py-3 text-xs text-slate-500 font-mono">
                        <div>{start}</div>
                        <div className="text-slate-400">{end}</div>
                      </td>
                      <td className="py-3 text-xs text-slate-600 max-w-[180px] truncate">{location}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function OrganizerDashboard({ user, stats }: { user: AuthUser; stats: any }) {
  const statCards = [
    { label: 'Total Registered', value: String(stats.totalRegistered || 0), sub: 'from database', icon: '👥', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Total Checked-in', value: String(stats.totalCheckedIn || 0), sub: `attendance rate: ${stats.attendanceRate || '0%'}`, icon: '✅', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Attendance Rate', value: stats.attendanceRate || '0%', sub: 'real-time from DB', icon: '📈', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    { label: 'Revoked / Issues', value: String(stats.revokedCount || 0), sub: 'revoked tickets', icon: '⚠️', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
  ]

  const liveStream = (stats.recentActivity || []).map((item: any) => ({
    name: item.name,
    time: item.time,
    gate: item.gate,
    status: item.status === 'Checked-in' ? 'Checked-in' : (item.status === 'Revoked' ? 'Revoked' : 'Registered') as StatusBadgeType
  }))

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

      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
            <p className="text-xs text-slate-400 mt-0.5">Latest check-ins from your event</p>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-50">
              {['Attendee Name', 'Time', 'Gate', 'Status'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {liveStream.slice(0, 7).map((row: any, i: number) => (
              <tr key={i} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors ${i === 0 ? 'bg-emerald-50/40' : ''}`}>
                <td className="px-5 py-3 font-medium text-slate-800">{row.name}</td>
                <td className="px-5 py-3 font-mono text-xs text-slate-500">{row.time}</td>
                <td className="px-5 py-3 text-slate-600 text-xs">{row.gate}</td>
                <td className="px-5 py-3"><StatusBadge status={row.status} /></td>
              </tr>
            ))}
            {liveStream.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-400">No recent activity</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
