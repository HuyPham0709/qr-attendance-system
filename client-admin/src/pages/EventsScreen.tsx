import React, { useState } from 'react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Toast } from '../components/ui/Toast'
import { EventStatusBadge } from '../components/ui/Badges'
import { events as allEvents } from '../data/mockData'
import { AuthUser } from '../services/authService'
import { isSuperAdmin, scopeByOrganization } from '../utils/rbac'

interface EventsScreenProps {
  user: AuthUser
}

export function EventsScreen({ user }: EventsScreenProps) {
  const readOnly = isSuperAdmin(user)

  // Mục 1.2 spec: "Cần giới hạn chỉ thấy/sửa được sự kiện của chính mình
  // (không thấy sự kiện tổ chức khác) → filter theo organizationId ở mọi
  // query". Ở bản FE-only này filter được làm client-side; khi nối BE
  // thật, BE PHẢI tự filter lại theo organizationId của token đăng nhập
  // — không được tin tưởng bất kỳ organizationId nào FE gửi lên.
  const events = scopeByOrganization(readOnly ? 'super_admin' : 'organizer', user.organizationId, allEvents)

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

  const ongoingCount = events.filter(e => e.status === 'Ongoing').length

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
            {events.map(e => (
              <tr key={e.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-4 font-semibold text-slate-800">{e.name}</td>
                {readOnly && <td className="px-5 py-4 text-xs text-slate-600">{e.organizationName}</td>}
                <td className="px-5 py-4 text-xs text-slate-500 font-mono">
                  <div>{e.start}</div>
                  <div className="text-slate-400">{e.end}</div>
                </td>
                <td className="px-5 py-4 text-xs text-slate-600 max-w-[180px] truncate">{e.location}</td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">{e.gates}</span>
                </td>
                <td className="px-5 py-4"><EventStatusBadge status={e.status} /></td>
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
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={readOnly ? 5 : 5} className="px-5 py-10 text-center text-sm text-slate-400">
                  No events found for this organization.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
              <Button variant="secondary" onClick={() => setShowDrawer(false)} className="flex-1">Cancel</Button>
              <Button variant="primary" onClick={() => { setShowDrawer(false); showToast('Event saved successfully') }} className="flex-1">Save Event</Button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} type="success" />}
    </div>
  )
}
