import React, { useEffect, useState } from 'react'
import { Toast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { createOrganization, deleteOrganization, listOrganizations, OrganizationItem, updateOrganization } from '../services/organizationService'

// Mục 1.1 spec — chức năng của Super Admin: "Quản lý tài khoản Organizer
// (duyệt/khóa tổ chức)". Đây là màn hình duy nhất chỉ Super Admin có
// quyền vào (xem rbac.ts). Nó KHÔNG hiện dữ liệu attendee (tên/email/SĐT
// người tham dự) của bất kỳ tổ chức nào — đúng nguyên tắc least privilege
// nêu ở mục 1.1: chỉ hiện thông tin cấp tổ chức (tên org, plan, số sự
// kiện, email chủ sở hữu) cần thiết để duyệt/khóa, không đào sâu vào dữ
// liệu vận hành sự kiện của Organizer.
type Status = 'active' | 'pending' | 'locked' | 'deleted'
const STATUS_STYLE: Record<Status, { bg: string; text: string; dot: string }> = {
  active: { bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  pending: { bg: 'bg-amber-50 border border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  locked: { bg: 'bg-red-50 border border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
  deleted: { bg: 'bg-slate-100 border border-slate-300', text: 'text-slate-600', dot: 'bg-slate-500' },
}

export function OrganizationsScreen() {
  const [orgs, setOrgs] = useState<OrganizationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<OrganizationItem | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function statusOf(org: OrganizationItem): Status {
    if (org.isActive === false) return 'deleted'
    if (org.status) return org.status
    return 'active'
  }

  function loadOrganizations() {
    setLoading(true)
    setError('')
    listOrganizations({ page, limit: 10, search: search.trim() || undefined, includeDeleted: true })
      .then(res => { setOrgs(res.data); setPages(res.pagination.pages); setTotal(res.pagination.total) })
      .catch(err => setError(err.message || 'Không thể tải danh sách tổ chức'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadOrganizations() }, [page, search])

  function openCreate() {
    setEditing(null); setName(''); setSlug(''); setShowForm(true)
  }

  function openEdit(org: OrganizationItem) {
    setEditing(org); setName(org.name); setSlug(org.slug); setShowForm(true)
  }

  async function saveOrganization() {
    if (!name.trim() || (!editing && !slug.trim())) return
    setSaving(true)
    try {
      if (editing) await updateOrganization(editing._id, { name: name.trim() })
      else await createOrganization({ name: name.trim(), slug: slug.trim() })
      setShowForm(false); showToast(editing ? 'Đã cập nhật tổ chức' : 'Đã tạo tổ chức'); loadOrganizations()
    } catch (err: any) { showToast(err.message || 'Không thể lưu tổ chức', 'error') }
    finally { setSaving(false) }
  }

  async function toggleOrganization(org: OrganizationItem) {
    const nextStatus: Status = statusOf(org) === 'locked' ? 'active' : 'locked'
    setBusyId(org._id)
    try {
      await updateOrganization(org._id, { status: nextStatus })
      showToast(nextStatus === 'locked' ? 'Đã khóa tổ chức' : 'Đã mở khóa tổ chức')
      loadOrganizations()
    } catch (err: any) { showToast(err.message || 'Không thể cập nhật trạng thái', 'error') }
    finally { setBusyId(null) }
  }

  async function restoreOrganization(org: OrganizationItem) {
    setBusyId(org._id)
    try {
      await updateOrganization(org._id, { isActive: true, status: 'active' })
      showToast('Đã restore tổ chức')
      loadOrganizations()
    } catch (err: any) { showToast(err.message || 'Không thể restore tổ chức', 'error') }
    finally { setBusyId(null) }
  }

  async function removeOrganization(org: OrganizationItem) {
    if (!window.confirm(`Xóa tổ chức "${org.name}"?`)) return
    setBusyId(org._id)
    try { await deleteOrganization(org._id); showToast('Đã xóa tổ chức'); loadOrganizations() }
    catch (err: any) { showToast(err.message || 'Không thể xóa tổ chức', 'error') }
    finally { setBusyId(null) }
  }

  const activeCount = orgs.filter(o => statusOf(o) === 'active').length
  const pendingCount = orgs.filter(o => statusOf(o) === 'pending').length
  const deletedCount = orgs.filter(o => statusOf(o) === 'deleted').length

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Organizations</h1>
          <p className="text-sm text-slate-500">
            {total} tổ chức trên hệ thống · {activeCount} active · {pendingCount} chờ duyệt · {deletedCount} đã xóa mềm
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
        <span className="text-blue-500 mt-0.5">ℹ️</span>
        <p className="text-xs text-blue-800 leading-relaxed">
          Đây là dữ liệu cấp tổ chức — theo nguyên tắc least privilege (mục 1.1 spec), Super Admin không
          xem danh sách attendee (tên/email/SĐT người tham dự) của các tổ chức. Muốn xem hoạt động
          check-in, dùng tab <span className="font-semibold">Staff &amp; Audit → Audit Log</span>.
        </p>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="w-72"><Input label="Tìm theo tên" placeholder="Tên tổ chức..." value={search} onChange={v => { setSearch(v); setPage(1) }} /></div>
        <Button variant="primary" onClick={openCreate}>+ Tạo tổ chức</Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Organization', 'Events*', 'Created', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && !error && orgs.map(o => {
              const status = statusOf(o)
              return <tr key={o._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-linear-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {o.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-800">{o.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span title="Server hiện trả eventsCount = 0; số liệu sẽ được cập nhật khi backend tính thật." className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">{o.eventsCount}</span>
                </td>
                <td className="px-5 py-4 text-xs text-slate-500 font-mono">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[status].bg} ${STATUS_STYLE[status].text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLE[status].dot}`} />
                    {status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    {status === 'deleted' ? <button disabled={busyId === o._id} onClick={() => restoreOrganization(o)} className="px-2.5 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors font-medium">Restore</button> : <><button disabled={busyId === o._id} onClick={() => openEdit(o)} className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium">Edit</button><button disabled={busyId === o._id} onClick={() => toggleOrganization(o)} className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">{status === 'locked' ? 'Unlock' : 'Lock'}</button><button disabled={busyId === o._id} onClick={() => removeOrganization(o)} className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">Delete</button></>}
                  </div>
                </td>
              </tr>
            })}
            {loading && <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">Đang tải...</td></tr>}
            {error && <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-red-500">{error}</td></tr>}
            {!loading && !error && orgs.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">Không tìm thấy tổ chức.</td></tr>}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-50 bg-slate-50/50 text-xs text-slate-400">
          <span>* eventsCount hiện chưa được backend tính chính xác.</span>
          <div className="flex items-center gap-2"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button><span>{page} / {pages}</span><button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</button></div>
        </div>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Chỉnh sửa tổ chức' : 'Tạo tổ chức'}>
        <div className="space-y-4">
          <Input label="Tên tổ chức" value={name} onChange={setName} />
          {!editing && <Input label="Slug" value={slug} onChange={setSlug} placeholder="my-organization" />}
          <div className="flex gap-2"><Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Hủy</Button><Button variant="primary" disabled={saving} onClick={saveOrganization} className="flex-1">{saving ? 'Đang lưu...' : 'Lưu'}</Button></div>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  )
}
