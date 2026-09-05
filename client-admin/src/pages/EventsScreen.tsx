import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Toast } from '../components/ui/Toast'
import { EventStatusBadge } from '../components/ui/Badges'
import { AuthUser } from '../services/authService'
import { isSuperAdmin, scopeByOrganization } from '../utils/rbac'
import { listEvents, createEvent, updateEvent, deleteEvent } from '../services'

interface EventsScreenProps {
  user: AuthUser
}

export function EventsScreen({ user }: EventsScreenProps) {
  const readOnly = isSuperAdmin(user)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showDrawer, setShowDrawer] = useState(false)
  const [geoFence, setGeoFence] = useState(false)
  const [multiCheckin, setMultiCheckin] = useState(false)
  const [requireGeo, setRequireGeo] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [gateInput, setGateInput] = useState('')
  const [gates, setGates] = useState(['Gate A – Main', 'Gate B – VIP'])
  const [tickets, setTickets] = useState([{ name: 'General Admission', qty: '500', price: '$49' }])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    listEvents({ limit: 100 })
      .then(res => {
        if (!cancelled) setEvents(res.data)
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Không thể tải danh sách events')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const ongoingCount = events.filter(e => e.status === 'ongoing' || e.status === 'Ongoing').length

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Event Management</h1>
          <p className="text-sm text-slate-500">
            {events.length} events · {ongoingCount} ongoing
            {readOnly && ' · read-only system-wide view'}
          </p>
        </div>
        {/* Mục 1.1 spec: Super Admin chỉ "xem toàn bộ sự kiện trên hệ
            thống" — tạo/sửa/xóa sự kiện là nghiệp vụ của Organizer trên
            sự kiện của chính họ (mục 1.2), nên nút Create chỉ hiện với
            organizer. */}
        {!readOnly && (
          <Button variant="primary" onClick={() => setShowDrawer(true)}>
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create Event
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading && (
          <div className="px-5 py-10 text-center text-sm text-slate-400">Đang tải events...</div>
        )}
        {error && (
          <div className="px-5 py-10 text-center text-sm text-red-500">{error}</div>
        )}
        {!loading && !error && (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {[
                'Event Name',
                ...(readOnly ? ['Organization'] : []),
                'Start / End', 'Location', 'Gates', 'Status',
                ...(readOnly ? [] : ['Actions']),
              ].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map(e => {
              const statusMap: Record<string, string> = {
                draft: 'Draft', published: 'Published', ongoing: 'Ongoing',
                completed: 'Completed', cancelled: 'Cancelled'
              }
              const displayStatus = statusMap[e.status] || e.status
              const start = e.startAt ? new Date(e.startAt).toLocaleString('vi-VN') : '--'
              const end = e.endAt ? new Date(e.endAt).toLocaleString('vi-VN') : '--'
              const location = e.location?.address || '--'
              const gatesCount = Array.isArray(e.gates) ? e.gates.length : 0

              return (
                <tr key={e._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-4 font-semibold text-slate-800">{e.name}</td>
                  {readOnly && <td className="px-5 py-4 text-xs text-slate-600">{e.organizationId || '--'}</td>}
                  <td className="px-5 py-4 text-xs text-slate-500 font-mono">
                    <div>{start}</div>
                    <div className="text-slate-400">{end}</div>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600 max-w-[180px] truncate">{location}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">{gatesCount}</span>
                  </td>
                  <td className="px-5 py-4"><EventStatusBadge status={displayStatus as any} /></td>
                  {!readOnly && (
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setShowDrawer(true)} className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-medium">Edit</button>
                        <button onClick={() => showToast('Event duplicated successfully')} className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-medium">Duplicate</button>
                        <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
            {!loading && !error && events.length === 0 && (
              <tr>
                <td colSpan={readOnly ? 5 : 5} className="px-5 py-10 text-center text-sm text-slate-400">
                  No events found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        )}
      </div>

      {!readOnly && (
        <Modal open={showDrawer} onClose={() => setShowDrawer(false)} title="Create New Event" width="max-w-2xl">
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Basic Information</h3>
              <div className="space-y-3">
                <Input label="Event Title" placeholder="e.g. TechSummit 2026" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Start Date & Time" type="datetime-local" />
                  <Input label="End Date & Time" type="datetime-local" />
                </div>
                <Input label="Venue Address" placeholder="e.g. Marina Bay Convention Centre, Singapore" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Ticket Types</h3>
                <Button variant="ghost" size="sm" onClick={() => setTickets(t => [...t, { name: '', qty: '', price: '' }])}>+ Add Type</Button>
              </div>
              <div className="space-y-2">
                {tickets.map((t, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 items-end">
                    <Input placeholder="Ticket name" value={t.name} onChange={v => setTickets(ts => ts.map((x, j) => j === i ? { ...x, name: v } : x))} />
                    <Input placeholder="Quantity" value={t.qty} onChange={v => setTickets(ts => ts.map((x, j) => j === i ? { ...x, qty: v } : x))} />
                    <Input placeholder="Price" value={t.price} onChange={v => setTickets(ts => ts.map((x, j) => j === i ? { ...x, price: v } : x))} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Gate Assignment</h3>
              <div className="flex gap-2 mb-2">
                <input className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none" placeholder="Gate name (e.g. Gate C – Staff)" value={gateInput} onChange={e => setGateInput(e.target.value)} />
                <Button variant="secondary" size="sm" onClick={() => { if (gateInput.trim()) { setGates(g => [...g, gateInput.trim()]); setGateInput('') } }}>Add Gate</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {gates.map((g, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-700">
                    {g}
                    <button onClick={() => setGates(gs => gs.filter((_, j) => j !== i))} className="text-slate-400 hover:text-slate-600">×</button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Advanced Settings</h3>
              <div className="space-y-3">
                {[
                  { label: 'Allow Multiple Check-in', sub: 'Attendees may scan in more than once', val: multiCheckin, set: setMultiCheckin },
                  { label: 'Enable Geo-fence Radius', sub: 'Limit check-ins to venue coordinates', val: geoFence, set: setGeoFence },
                  { label: 'Require Geo-fence Check', sub: 'Reject check-ins outside radius', val: requireGeo, set: setRequireGeo },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{s.label}</div>
                      <div className="text-xs text-slate-400">{s.sub}</div>
                    </div>
                    <button
                      onClick={() => s.set(!s.val)}
                      className={`w-10 h-6 rounded-full transition-all relative ${s.val ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${s.val ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'}`} />
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <div className="text-sm font-medium text-slate-800">QR TTL (Minutes)</div>
                    <div className="text-xs text-slate-400">Time-to-live for dynamic QR codes</div>
                  </div>
                  <input type="number" defaultValue={5} className="w-20 px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-center font-mono" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="secondary" onClick={() => { setShowDrawer(false); setGates(['Gate A – Main', 'Gate B – VIP']); setTickets([{ name: 'General Admission', qty: '500', price: '$49' }]); }} className="flex-1">Cancel</Button>
              <Button variant="primary" onClick={async () => {
                try {
                  const payload: any = {
                    name: 'New Event',
                    description: '',
                    status: 'draft',
                    startAt: new Date().toISOString(),
                    endAt: new Date(Date.now() + 86400000).toISOString(),
                    location: { address: '', geo: { lat: 0, lng: 0 }, geoFenceRadiusMeters: 200 },
                    settings: { allowMultipleCheckIn: multiCheckin, requireGeoFence: requireGeo, qrTokenTTLMinutes: 5, checkInWindowMinutes: 60 },
                    gates: gates.map((name, i) => ({ name, code: `GATE_${i}` }))
                  }
                  await createEvent(payload)
                  showToast('Event saved successfully')
                  setShowDrawer(false)
                  listEvents({ limit: 100 }).then(res => setEvents(res.data))
                } catch (err: any) {
                  showToast(err.message || 'Có lỗi xảy ra')
                }
              }} className="flex-1">Save Event</Button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} type="success" />}
    </div>
  )
}
