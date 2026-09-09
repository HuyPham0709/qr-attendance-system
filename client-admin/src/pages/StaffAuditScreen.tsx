import React, { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Toast } from '../components/ui/Toast'
import { ScanResultBadge } from '../components/ui/Badges'
import { SearchIcon } from '../components/ui/Icons'
import { ExportReportModal, ExportOptions } from '../components/audit/ExportReportModal'
import { ImportReportModal } from '../components/audit/ImportReportModal'
import { AuthUser } from '../services/authService'
import { AuditLogItem, downloadAuditReport, listAuditLogs } from '../services/auditService'
import { EventItem, listEvents } from '../services/eventService'
import { assignEvents, createUser, listUsers, updateUser, UserItem } from '../services/userService'
import { isSuperAdmin } from '../utils/rbac'

interface StaffAuditScreenProps { user: AuthUser }

const resultLabels: Record<string, string> = {
  success: 'Success', duplicate: 'Duplicate', expired_qr: 'Expired QR', wrong_geo: 'Wrong Geo', revoked: 'Revoked', invalid_qr: 'Invalid QR'
}

export function StaffAuditScreen({ user }: StaffAuditScreenProps) {
  const superAdmin = isSuperAdmin(user)
  const [tab, setTab] = useState<'staff' | 'audit'>(superAdmin ? 'audit' : 'staff')
  const [staff, setStaff] = useState<UserItem[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([])
  const [auditPage, setAuditPage] = useState(1)
  const [auditPages, setAuditPages] = useState(1)
  const [auditTotal, setAuditTotal] = useState(0)
  const [result, setResult] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showExport, setShowExport] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePassword, setInvitePassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type }); setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    setLoading(true); setError('')
    Promise.all([
      listEvents({ limit: 100 }),
      tab === 'staff' && !superAdmin ? listUsers({ role: 'scanner_staff', limit: 100 }) : Promise.resolve(null),
      tab === 'audit' || superAdmin ? listAuditLogs({ page: auditPage, limit: 20, result: result || undefined }) : Promise.resolve(null),
    ]).then(([eventResponse, staffResponse, auditResponse]) => {
      setEvents(eventResponse.data)
      if (staffResponse) setStaff(staffResponse.data)
      if (auditResponse) { setAuditLogs(auditResponse.data); setAuditPages(auditResponse.pagination.pages); setAuditTotal(auditResponse.pagination.total) }
    }).catch(err => setError(err.message || 'Không thể tải dữ liệu'))
      .finally(() => setLoading(false))
  }, [tab, superAdmin, auditPage, result])

  const visibleAuditLogs = auditLogs.filter(row => {
    const needle = search.trim().toLowerCase()
    return !needle || `${row.attendeeName} ${row.attendeeEmail || ''} ${row.scannedByName || ''} ${row.scannedByEmail || ''}`.toLowerCase().includes(needle)
  })

  async function inviteStaff() {
    if (!inviteName.trim() || !inviteEmail.trim() || invitePassword.length < 6) return
    setSaving(true)
    try {
      await createUser({ name: inviteName.trim(), email: inviteEmail.trim(), password: invitePassword, role: 'scanner_staff' })
      setShowInvite(false); setInviteName(''); setInviteEmail(''); setInvitePassword(''); showToast('Đã tạo tài khoản Scanner Staff')
      const response = await listUsers({ role: 'scanner_staff', limit: 100 }); setStaff(response.data)
    } catch (err: any) { showToast(err.message || 'Không thể tạo tài khoản', 'error') }
    finally { setSaving(false) }
  }

  async function changeAssignment(staffMember: UserItem, eventId: string) {
    try {
      await assignEvents(staffMember._id, eventId ? [eventId] : [])
      setStaff(list => list.map(item => item._id === staffMember._id ? { ...item, assignedEvents: eventId ? [eventId] : [] } : item))
      showToast('Đã cập nhật sự kiện được gán')
    } catch (err: any) { showToast(err.message || 'Không thể gán sự kiện', 'error') }
  }

  async function removeStaff(staffMember: UserItem) {
    try {
      await updateUser(staffMember._id, { isActive: false })
      setStaff(list => list.map(item => item._id === staffMember._id ? { ...item, isActive: false, status: 'Inactive' } : item))
      showToast('Đã vô hiệu hóa Scanner Staff')
    } catch (err: any) { showToast(err.message || 'Không thể remove staff', 'error') }
  }

  async function exportReport(options: ExportOptions, format: string) {
    setShowExport(false)
    try {
      const blob = await downloadAuditReport({ format: format === '.xlsx' ? 'xlsx' : 'pdf', eventId: options.eventId || undefined, result: options.result || undefined, search: search.trim() || undefined, from: options.startDate || undefined, to: options.endDate || undefined })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `security-audit-report-${new Date().toISOString().slice(0, 10)}.${format === '.xlsx' ? 'xlsx' : 'pdf'}`
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url)
      showToast(`Đã tải báo cáo ${format}`)
    } catch (err: any) { showToast(err.message || 'Không thể export báo cáo', 'error') }
  }

  return <div className="p-6 space-y-5">
    <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold text-slate-900">{superAdmin ? 'Security Audit' : 'Staff & Security Audit'}</h1><p className="text-sm text-slate-500">{superAdmin ? 'System-wide append-only audit log' : 'Staff assignments · Append-only audit log'}</p></div><div className="flex gap-2"><Button variant="secondary" onClick={() => setShowImport(true)}>Import Report</Button><Button variant="secondary" onClick={() => setShowExport(true)}>Export Report</Button></div></div>
    {!superAdmin && <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">{(['staff', 'audit'] as const).map(item => <button key={item} onClick={() => setTab(item)} className={`px-5 py-2 rounded-lg text-sm font-medium ${tab === item ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>{item === 'staff' ? 'Staff Assignment' : 'Audit Log'}</button>)}</div>}
    {error && <div className="text-sm text-red-500">{error}</div>}
    {tab === 'staff' && !superAdmin && <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"><div className="flex items-center justify-between px-5 py-4 border-b border-slate-50"><h3 className="text-sm font-semibold text-slate-900">Scanner Staff Assignments</h3><Button variant="primary" size="sm" onClick={() => setShowInvite(true)}>+ Invite Staff</Button></div><table className="w-full text-sm"><thead><tr className="bg-slate-50 border-b border-slate-100">{['Staff Member', 'Email', 'Role', 'Assigned Event', 'Status', 'Actions'].map(h => <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}</tr></thead><tbody>{loading && <tr><td colSpan={6} className="p-8 text-center text-slate-400">Đang tải...</td></tr>}{!loading && staff.map(item => <tr key={item._id} className="border-b border-slate-50"><td className="px-5 py-4 font-semibold text-slate-800">{item.name}</td><td className="px-5 py-4 text-xs font-mono text-slate-500">{item.email}</td><td className="px-5 py-4 text-xs">{item.role}</td><td className="px-5 py-4"><select value={item.assignedEvents[0] || ''} onChange={event => changeAssignment(item, event.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"><option value="">Unassigned</option>{events.map(event => <option key={event._id} value={event._id}>{event.name}</option>)}</select></td><td className="px-5 py-4 text-xs">{item.status}</td><td className="px-5 py-4"><button onClick={() => removeStaff(item)} className="text-xs text-red-500 hover:text-red-700">Remove</button></td></tr>)}</tbody></table></div>}
    {(tab === 'audit' || superAdmin) && <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"><div className="flex items-center justify-between px-5 py-4 border-b border-slate-50"><div className="flex items-center gap-3"><h3 className="text-sm font-semibold text-slate-900">{superAdmin ? 'System-wide Audit Log' : 'Security Audit Log'}</h3><span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">Append-only</span></div><div className="flex items-center gap-2"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><SearchIcon /></span><input value={search} onChange={event => setSearch(event.target.value)} className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-48" placeholder="Search attendee or staff..." /></div><select value={result} onChange={event => { setResult(event.target.value); setAuditPage(1) }} className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"><option value="">All Results</option>{Object.entries(resultLabels).filter(([key]) => key !== 'invalid_qr').map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div></div><table className="w-full text-xs"><thead><tr className="bg-slate-50 border-b border-slate-100">{['Timestamp', 'Event', 'Attendee', 'Scanned By', 'Device ID', 'Result'].map(h => <th key={h} className="px-5 py-3.5 text-left font-semibold text-slate-500 uppercase tracking-wide text-[10px]">{h}</th>)}</tr></thead><tbody>{loading && <tr><td colSpan={6} className="p-8 text-center text-slate-400">Đang tải...</td></tr>}{!loading && visibleAuditLogs.map(row => <tr key={row._id} className="border-b border-slate-50"><td className="px-5 py-3.5 font-mono text-slate-400">{new Date(row.createdAt).toLocaleString('vi-VN')}</td><td className="px-5 py-3.5 text-slate-700 font-medium">{row.eventName}</td><td className="px-5 py-3.5 text-slate-600">{row.attendeeName}</td><td className="px-5 py-3.5 text-slate-600">{row.scannedByName || 'Unknown'}</td><td className="px-5 py-3.5 font-mono text-slate-400">{row.deviceId || '--'}</td><td className="px-5 py-3.5"><ScanResultBadge result={(resultLabels[row.result] || row.result) as any} /></td></tr>)}{!loading && visibleAuditLogs.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400">No audit entries found.</td></tr>}</tbody></table><div className="flex items-center justify-between px-5 py-3 border-t border-slate-50 bg-slate-50/50 text-xs text-slate-400"><span>Showing {visibleAuditLogs.length} of {auditTotal} entries</span><div className="flex gap-2"><button disabled={auditPage <= 1} onClick={() => setAuditPage(p => p - 1)}>Previous</button><span>{auditPage} / {auditPages}</span><button disabled={auditPage >= auditPages} onClick={() => setAuditPage(p => p + 1)}>Next</button></div></div></div>}
    <ExportReportModal open={showExport} events={events} onClose={() => setShowExport(false)} onExport={(format, options) => exportReport(options, format)} />
    <ImportReportModal open={showImport} onClose={() => setShowImport(false)} onImported={message => { showToast(message); setAuditPage(1); setResult('') }} />
    <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite Scanner Staff"><div className="space-y-4"><Input label="Name" value={inviteName} onChange={setInviteName} /><Input label="Email" type="email" value={inviteEmail} onChange={setInviteEmail} /><Input label="Temporary password" type="password" value={invitePassword} onChange={setInvitePassword} /><Button variant="primary" disabled={saving} onClick={inviteStaff} className="w-full">{saving ? 'Đang tạo...' : 'Create Staff'}</Button></div></Modal>
    {toast && <Toast message={toast.message} type={toast.type} />}
  </div>
}