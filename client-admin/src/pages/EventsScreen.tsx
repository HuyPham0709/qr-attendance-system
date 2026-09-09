import React, { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Toast } from '../components/ui/Toast'
import { EventStatusBadge } from '../components/ui/Badges'
import { AuthUser } from '../services/authService'
import { createEvent, deleteEvent, EventItem, listEvents, updateEvent } from '../services/eventService'
import { isSuperAdmin } from '../utils/rbac'

interface EventsScreenProps { user: AuthUser }

interface EventForm {
  name: string
  description: string
  startAt: string
  endAt: string
  address: string
  status: EventItem['status']
  allowMultipleCheckIn: boolean
  requireGeoFence: boolean
  qrTokenTTLMinutes: string
  gates: string[]
}

const emptyForm: EventForm = {
  name: '', description: '', startAt: '', endAt: '', address: '', status: 'draft',
  allowMultipleCheckIn: false, requireGeoFence: false, qrTokenTTLMinutes: '5', gates: ['Gate A - Main']
}

function toInputDate(value?: string) {
  return value ? new Date(value).toISOString().slice(0, 16) : ''
}

export function EventsScreen({ user }: EventsScreenProps) {
  const readOnly = isSuperAdmin(user)
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<EventItem | null>(null)
  const [form, setForm] = useState<EventForm>(emptyForm)
  const [gateInput, setGateInput] = useState('')

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type }); setTimeout(() => setToast(null), 3000)
  }

  async function loadEvents() {
    setLoading(true); setError('')
    try { const response = await listEvents({ limit: 100 }); setEvents(response.data) }
    catch (err: any) { setError(err.message || 'Không thể tải danh sách events') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadEvents() }, [])

  function openCreate() {
    setEditing(null); setForm({ ...emptyForm, gates: [...emptyForm.gates] }); setGateInput(''); setShowForm(true)
  }

  function openEdit(event: EventItem) {
    setEditing(event)
    setForm({
      name: event.name, description: event.description || '', startAt: toInputDate(event.startAt), endAt: toInputDate(event.endAt),
      address: event.location?.address || '', status: event.status, allowMultipleCheckIn: Boolean(event.settings?.allowMultipleCheckIn),
      requireGeoFence: Boolean(event.settings?.requireGeoFence), qrTokenTTLMinutes: String(event.settings?.qrTokenTTLMinutes ?? 5),
      gates: event.gates?.map(gate => gate.name) || []
    })
    setGateInput(''); setShowForm(true)
  }

  function updateForm<K extends keyof EventForm>(key: K, value: EventForm[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  async function saveEvent() {
    if (!form.name.trim() || !form.startAt || !form.endAt || !form.address.trim()) {
      showToast('Vui lòng nhập tên, thời gian và địa điểm event', 'error'); return
    }
    if (new Date(form.endAt) <= new Date(form.startAt)) {
      showToast('Thời gian kết thúc phải sau thời gian bắt đầu', 'error'); return
    }
    setSaving(true)
    const payload: Partial<EventItem> = {
      name: form.name.trim(), description: form.description.trim(), status: form.status,
      startAt: new Date(form.startAt).toISOString(), endAt: new Date(form.endAt).toISOString(),
      location: { address: form.address.trim(), geo: { lat: 0, lng: 0 }, geoFenceRadiusMeters: 200 },
      settings: { allowMultipleCheckIn: form.allowMultipleCheckIn, requireGeoFence: form.requireGeoFence, qrTokenTTLMinutes: Math.max(0, Number(form.qrTokenTTLMinutes) || 0), checkInWindowMinutes: 60 },
      gates: form.gates.filter(Boolean).map((name, index) => ({ name, code: `GATE_${index + 1}` }))
    }
    try {
      if (editing) { await updateEvent(editing._id, payload); showToast('Đã cập nhật event') }
      else { await createEvent(payload); showToast('Đã tạo event') }
      setShowForm(false); await loadEvents()
    } catch (err: any) { showToast(err.message || 'Không thể lưu event', 'error') }
    finally { setSaving(false) }
  }

  async function duplicateEvent(event: EventItem) {
    try {
      await createEvent({ name: `${event.name} - Copy`, description: event.description, status: 'draft', startAt: event.startAt, endAt: event.endAt, location: event.location, settings: event.settings, gates: event.gates })
      showToast('Đã tạo bản sao event'); await loadEvents()
    } catch (err: any) { showToast(err.message || 'Không thể duplicate event', 'error') }
  }

  async function removeEvent(event: EventItem) {
    if (!window.confirm(`Hủy event "${event.name}"?`)) return
    try { await deleteEvent(event._id); showToast('Đã hủy event'); await loadEvents() }
    catch (err: any) { showToast(err.message || 'Không thể hủy event', 'error') }
  }

  const ongoingCount = events.filter(event => event.status === 'ongoing').length

  return <div className="p-6 space-y-5">
    <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold text-slate-900">Event Management</h1><p className="text-sm text-slate-500">{events.length} events · {ongoingCount} ongoing{readOnly && ' · read-only system-wide view'}</p></div>{!readOnly && <Button variant="primary" onClick={openCreate}>+ Create Event</Button>}</div>
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {loading && <div className="px-5 py-10 text-center text-sm text-slate-400">Đang tải events...</div>}
      {error && <div className="px-5 py-10 text-center text-sm text-red-500">{error}</div>}
      {!loading && !error && <table className="w-full text-sm"><thead><tr className="bg-slate-50 border-b border-slate-100">{['Event Name', ...(readOnly ? ['Organization'] : []), 'Start / End', 'Location', 'Gates', 'Status', ...(readOnly ? [] : ['Actions'])].map(header => <th key={header} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{header}</th>)}</tr></thead><tbody>{events.map(event => <tr key={event._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"><td className="px-5 py-4 font-semibold text-slate-800">{event.name}</td>{readOnly && <td className="px-5 py-4 text-xs text-slate-600">{event.organizationId}</td>}<td className="px-5 py-4 text-xs text-slate-500 font-mono"><div>{new Date(event.startAt).toLocaleString('vi-VN')}</div><div className="text-slate-400">{new Date(event.endAt).toLocaleString('vi-VN')}</div></td><td className="px-5 py-4 text-xs text-slate-600 max-w-45 truncate">{event.location?.address || '--'}</td><td className="px-5 py-4"><span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">{event.gates?.length || 0}</span></td><td className="px-5 py-4"><EventStatusBadge status={event.status as any} /></td>{!readOnly && <td className="px-5 py-4"><div className="flex items-center gap-1"><button onClick={() => openEdit(event)} className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Edit</button><button onClick={() => duplicateEvent(event)} className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Duplicate</button><button onClick={() => removeEvent(event)} className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-medium">Cancel</button></div></td>}</tr>)}{events.length === 0 && <tr><td colSpan={readOnly ? 6 : 6} className="px-5 py-10 text-center text-sm text-slate-400">No events found.</td></tr>}</tbody></table>}
    </div>
    {!readOnly && <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Event' : 'Create New Event'} width="max-w-2xl"><div className="space-y-5"><Input label="Event Title" value={form.name} onChange={value => updateForm('name', value)} placeholder="TechSummit 2026" /><Input label="Description" value={form.description} onChange={value => updateForm('description', value)} placeholder="Event description" /><div className="grid grid-cols-2 gap-3"><Input label="Start Date & Time" type="datetime-local" value={form.startAt} onChange={value => updateForm('startAt', value)} /><Input label="End Date & Time" type="datetime-local" value={form.endAt} onChange={value => updateForm('endAt', value)} /></div><Input label="Venue Address" value={form.address} onChange={value => updateForm('address', value)} placeholder="Venue address" /><div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label><select value={form.status} onChange={event => updateForm('status', event.target.value as EventItem['status'])} className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-white"><option value="draft">Draft</option><option value="published">Published</option><option value="ongoing">Ongoing</option><option value="cancelled">Cancelled</option></select></div><Input label="QR TTL (minutes)" type="number" value={form.qrTokenTTLMinutes} onChange={value => updateForm('qrTokenTTLMinutes', value)} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Gates</label><div className="flex gap-2"><input value={gateInput} onChange={event => setGateInput(event.target.value)} placeholder="Gate name" className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-lg" /><Button variant="secondary" size="sm" onClick={() => { if (gateInput.trim()) { updateForm('gates', [...form.gates, gateInput.trim()]); setGateInput('') } }}>Add</Button></div><div className="flex flex-wrap gap-2 mt-2">{form.gates.map((gate, index) => <span key={`${gate}-${index}`} className="px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-700">{gate}<button className="ml-2 text-slate-400" onClick={() => updateForm('gates', form.gates.filter((_, itemIndex) => itemIndex !== index))}>x</button></span>)}</div></div><div className="space-y-2"><label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.allowMultipleCheckIn} onChange={event => updateForm('allowMultipleCheckIn', event.target.checked)} /> Allow multiple check-in</label><label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.requireGeoFence} onChange={event => updateForm('requireGeoFence', event.target.checked)} /> Require geo-fence check</label></div><div className="flex gap-2"><Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button><Button variant="primary" disabled={saving} onClick={saveEvent} className="flex-1">{saving ? 'Saving...' : 'Save Event'}</Button></div></div></Modal>}
    {toast && <Toast message={toast.message} type={toast.type} />}
  </div>
}