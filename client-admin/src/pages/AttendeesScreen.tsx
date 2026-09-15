import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { StatusBadge } from '../components/ui/Badges'
import { Toast } from '../components/ui/Toast'
import { ImportAttendeesModal } from '../components/attendees/ImportAttendeesModal'
import { ManualCheckInModal } from '../components/attendees/ManualCheckInModal'
import { QrInspectModal } from '../components/attendees/QrInspectModal'
import { AuthUser } from '../services/authService'
import { AttendeeItem, createAttendee, deleteAttendee, getAttendeeQr, listAttendees, manualCheckIn, resendQrEmail, revokeAttendeeQr, updateAttendee } from '../services/attendeeService'
import { EventItem, listEvents } from '../services/eventService'

interface AttendeesScreenProps { user: AuthUser }
const statusLabel = (status: AttendeeItem['status']) => status === 'checked_in' ? 'Checked-in' : status === 'cancelled' ? 'Revoked' : status === 'no_show' ? 'No Show' : 'Registered'

export function AttendeesScreen({ user }: AttendeesScreenProps) {
  const [attendees, setAttendees] = useState<AttendeeItem[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [eventId, setEventId] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [target, setTarget] = useState<AttendeeItem | null>(null)
  const [manualTarget, setManualTarget] = useState<AttendeeItem | null>(null)
  const [qrTarget, setQrTarget] = useState<AttendeeItem | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const notify = (message: string, type: 'success' | 'error' = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000) }
  const closeForm = () => { setFormMode(null); setTarget(null); setName(''); setEmail(''); setPhone('') }
  const openCreate = () => { setName(''); setEmail(''); setPhone(''); setTarget(null); setFormMode('create') }
  const openEdit = (item: AttendeeItem) => { setName(item.fullName); setEmail(item.email); setPhone(item.phone || ''); setTarget(item); setFormMode('edit') }

  useEffect(() => { listEvents({ limit: 100 }).then(result => { setEvents(result.data); if (result.data[0]) setEventId(current => current || result.data[0]._id) }).catch(err => setError(err.message || 'Không thể tải events')) }, [])

  async function loadAttendees() {
    if (!eventId) return
    setLoading(true); setError('')
    try { const result = await listAttendees({ page, limit: 20, eventId, search: search.trim() || undefined, status: status || undefined }); setAttendees(result.data); setPages(result.pagination.pages); setTotal(result.pagination.total) }
    catch (err: any) { setError(err.message || 'Không thể tải attendees') }
    finally { setLoading(false) }
  }
  useEffect(() => { loadAttendees() }, [eventId, page, search, status])

  async function saveAttendee() {
    if (!name.trim() || !email.trim()) { notify('Vui lòng nhập họ tên và email', 'error'); return }
    setSaving(true)
    try {
      if (formMode === 'edit' && target) await updateAttendee(target._id, { fullName: name.trim(), email: email.trim(), phone: phone.trim() || undefined })
      else await createAttendee({ eventId, fullName: name.trim(), email: email.trim(), phone: phone.trim() || undefined })
      notify(formMode === 'edit' ? 'Đã cập nhật attendee' : 'Đã tạo attendee'); closeForm(); await loadAttendees()
    } catch (err: any) { notify(err.message || 'Không thể lưu attendee', 'error') }
    finally { setSaving(false) }
  }
  async function removeAttendee(item: AttendeeItem) { if (!window.confirm(`Xóa attendee "${item.fullName}"?`)) return; try { await deleteAttendee(item._id); notify('Đã xóa attendee'); await loadAttendees() } catch (err: any) { notify(err.message || 'Không thể xóa attendee', 'error') } }
  async function openQr(item: AttendeeItem) { setQrTarget(item); setQrDataUrl(''); setQrLoading(true); try { setQrDataUrl((await getAttendeeQr(item._id)).dataUrl) } catch (err: any) { notify(err.message || 'Không thể tải QR', 'error') } finally { setQrLoading(false) } }
  async function resend(item: AttendeeItem) { try { const result = await resendQrEmail(item._id); notify(result.emailSent ? `Đã gửi lại QR tới ${item.email}` : 'Đã xử lý resend ở chế độ phát triển') } catch (err: any) { notify(err.message || 'Không thể gửi lại email', 'error') } }
  async function revoke(item: AttendeeItem) { if (!window.confirm(`Thu hồi QR của ${item.fullName}?`)) return; try { const result = await revokeAttendeeQr(item._id); notify(`Đã revoke QR, version mới v${result.qrVersion}`); setQrTarget(null); await loadAttendees() } catch (err: any) { notify(err.message || 'Không thể revoke QR', 'error') } }
  async function confirmManual(reason: string) { if (!manualTarget) return; try { await manualCheckIn({ attendeeId: manualTarget._id, reason }); setManualTarget(null); notify('Đã manual check-in'); await loadAttendees() } catch (err: any) { notify(err.message || 'Không thể manual check-in', 'error') } }
  function exportExcel() { if (!attendees.length) { notify('Không có dữ liệu để xuất', 'error'); return }; const sheet = XLSX.utils.json_to_sheet(attendees.map((item, index) => ({ STT: index + 1, ID: item._id, Name: item.fullName, Email: item.email, Status: item.status, QRVersion: item.qrVersion, CheckIn: item.checkIn?.checkInAt || '', Gate: item.checkIn?.gate || '' }))); const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, 'Attendees'); XLSX.writeFile(book, `attendees-${new Date().toISOString().slice(0, 10)}.xlsx`); notify('Đã xuất Excel trang hiện tại') }

  return <div className="p-6 space-y-5">
    <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold text-slate-900">Attendee Engine</h1><p className="text-sm text-slate-500">{total} attendees{user.organizationName ? ` · ${user.organizationName}` : ''}</p></div><div className="flex items-center gap-2"><select value={eventId} onChange={event => { setEventId(event.target.value); setPage(1) }} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">{events.map(event => <option key={event._id} value={event._id}>{event.name}</option>)}</select><Button variant="secondary" onClick={exportExcel}>Export Excel</Button><Button variant="secondary" disabled={!eventId} onClick={() => setShowImport(true)}>Import Excel</Button><Button variant="primary" disabled={!eventId} onClick={openCreate}>+ Add Attendee</Button></div></div>
    <div className="flex items-center gap-3"><Input placeholder="Search by name or email..." value={search} onChange={value => { setSearch(value); setPage(1) }} /><select value={status} onChange={event => { setStatus(event.target.value); setPage(1) }} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"><option value="">All statuses</option><option value="registered">Registered</option><option value="checked_in">Checked-in</option><option value="cancelled">Revoked</option><option value="no_show">No Show</option></select></div>
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">{loading && <div className="p-10 text-center text-sm text-slate-400">Đang tải attendees...</div>}{error && <div className="p-10 text-center text-sm text-red-500">{error}</div>}{!loading && !error && <table className="w-full text-sm"><thead><tr className="bg-slate-50 border-b border-slate-100">{['Full Name', 'Email', 'Status', 'QR Version', 'Check-in Time', 'Gate', 'Actions'].map(header => <th key={header} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase">{header}</th>)}</tr></thead><tbody>{attendees.map(item => <tr key={item._id} className="border-b border-slate-50"><td className="px-4 py-3 font-semibold text-slate-800">{item.fullName}</td><td className="px-4 py-3 text-xs text-slate-500">{item.email}</td><td className="px-4 py-3"><StatusBadge status={statusLabel(item.status) as any} /></td><td className="px-4 py-3 font-mono text-xs">v{item.qrVersion}</td><td className="px-4 py-3 text-xs text-slate-500">{item.checkIn?.checkInAt ? new Date(item.checkIn.checkInAt).toLocaleString('vi-VN') : '--'}</td><td className="px-4 py-3 text-xs text-slate-500">{item.checkIn?.gate || '--'}</td><td className="px-4 py-3"><div className="flex gap-1"><button onClick={() => openQr(item)} className="px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50 rounded">QR</button><button onClick={() => setManualTarget(item)} className="px-2 py-1 text-xs text-blue-700 hover:bg-blue-50 rounded">Check-in</button><button onClick={() => openEdit(item)} className="px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded">Edit</button><button onClick={() => removeAttendee(item)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">Delete</button></div></td></tr>)}{attendees.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-sm text-slate-400">No attendees found.</td></tr>}</tbody></table>}</div>
    <div className="flex items-center justify-between text-xs text-slate-400"><span>Showing {attendees.length} of {total}</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button><span>{page} / {pages}</span><button disabled={page >= pages} onClick={() => setPage(value => value + 1)}>Next</button></div></div>
    <ImportAttendeesModal open={showImport} eventId={eventId} onClose={() => setShowImport(false)} onImportComplete={async message => { notify(message); await loadAttendees() }} />
    <ManualCheckInModal open={!!manualTarget} onClose={() => setManualTarget(null)} onConfirm={confirmManual} />
    <QrInspectModal attendee={qrTarget ? { ...qrTarget, name: qrTarget.fullName, status: statusLabel(qrTarget.status), ticket: 'Attendee' } : null} qrDataUrl={qrDataUrl} qrLoading={qrLoading} onClose={() => setQrTarget(null)} onResendEmail={() => qrTarget && resend(qrTarget)} onRevoke={() => qrTarget && revoke(qrTarget)} />
    <Modal open={!!formMode} onClose={closeForm} title={formMode === 'edit' ? 'Edit Attendee' : 'Add Attendee'}><div className="space-y-4"><Input label="Full name" value={name} onChange={setName} /><Input label="Email" type="email" value={email} onChange={setEmail} /><Input label="Phone" value={phone} onChange={setPhone} /><div className="flex gap-2"><Button variant="secondary" onClick={closeForm} className="flex-1">Cancel</Button><Button variant="primary" disabled={saving} onClick={saveAttendee} className="flex-1">{saving ? 'Saving...' : 'Save'}</Button></div></div></Modal>
    {toast && <Toast message={toast.message} type={toast.type} />}
  </div>
}
