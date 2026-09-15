import React, { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { AuditLogItem, AuditLogMutation, createAuditLog, deleteAuditLog, updateAuditLog } from '../../services/auditService'
import { EventItem } from '../../services/eventService'

interface AuditLogFormModalProps {
  open: boolean
  events: EventItem[]
  log?: AuditLogItem | null
  onClose: () => void
  onSaved: (message: string) => void
}

export function AuditLogFormModal({ open, events, log, onClose, onSaved }: AuditLogFormModalProps) {
  const [eventId, setEventId] = useState('')
  const [logId, setLogId] = useState('')
  const [attendeeId, setAttendeeId] = useState('')
  const [result, setResult] = useState<AuditLogMutation['result']>('success')
  const [gate, setGate] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [clientTimestamp, setClientTimestamp] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setEventId(log?.eventId || events[0]?._id || '')
    setLogId(log?._id || '')
    setAttendeeId(log?.attendeeId || '')
    setResult(log?.result || 'success')
    setGate(log?.gate || '')
    setDeviceId(log?.deviceId || '')
    setClientTimestamp(log?.clientTimestamp ? new Date(log.clientTimestamp).toISOString().slice(0, 16) : '')
    setError('')
  }, [log, events, open])

  async function save() {
    if (!eventId || !attendeeId) { setError('Event ID và Attendee ID là bắt buộc'); return }
    setSaving(true); setError('')
    const payload: AuditLogMutation = { eventId, attendeeId, result, gate: gate || undefined, deviceId: deviceId || undefined, clientTimestamp: clientTimestamp ? new Date(clientTimestamp).toISOString() : undefined }
    try {
      if (log || logId.trim()) await updateAuditLog(log?._id || logId.trim(), payload)
      else await createAuditLog(payload)
      onSaved(log || logId.trim() ? 'Đã cập nhật audit log' : 'Đã tạo audit log'); onClose()
    } catch (err: any) { setError(err.message || 'Không thể lưu audit log') }
    finally { setSaving(false) }
  }

  return <Modal open={open} onClose={onClose} title={log ? 'Edit Audit Log' : 'Create Audit Log'} width="max-w-lg">
    <div className="space-y-4">
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">Thao tác CRUD trực tiếp thay đổi audit trail. Chỉ dùng để hiệu chỉnh dữ liệu quản trị.</div>
      {!log && <Input label="Log ID (để edit/delete log có sẵn)" value={logId} onChange={setLogId} placeholder="Để trống nếu tạo mới" />}
      <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Event</label><select value={eventId} onChange={event => setEventId(event.target.value)} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white"><option value="">Select event</option>{events.map(event => <option key={event._id} value={event._id}>{event.name}</option>)}</select></div>
      <Input label="Attendee ID" value={attendeeId} onChange={setAttendeeId} placeholder="MongoDB ObjectId" />
      <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Result</label><select value={result} onChange={event => setResult(event.target.value as AuditLogMutation['result'])} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white">{['success', 'duplicate', 'invalid_qr', 'expired_qr', 'wrong_geo', 'revoked'].map(value => <option key={value} value={value}>{value}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-3"><Input label="Gate" value={gate} onChange={setGate} /><Input label="Device ID" value={deviceId} onChange={setDeviceId} /></div>
      <Input label="Client Timestamp" type="datetime-local" value={clientTimestamp} onChange={setClientTimestamp} />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2"><Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>{(log || logId.trim()) && <Button variant="danger" disabled={saving} onClick={async () => { if (!window.confirm('Xóa audit log này?')) return; setSaving(true); try { await deleteAuditLog(log?._id || logId.trim()); onSaved('Đã xóa audit log'); onClose() } catch (err: any) { setError(err.message || 'Không thể xóa audit log') } finally { setSaving(false) } }}>Delete</Button>}<Button variant="primary" disabled={saving} onClick={save} className="flex-1">{saving ? 'Saving...' : log || logId.trim() ? 'Update' : 'Create'}</Button></div>
    </div>
  </Modal>
}
