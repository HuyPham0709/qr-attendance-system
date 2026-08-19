import React, { useState } from 'react'
import { Toast } from '../components/ui/Toast'
import { organizations as initialOrgs } from '../data/mockData'
import { OrganizationItem, OrgStatus } from '../types'

// Mục 1.1 spec — chức năng của Super Admin: "Quản lý tài khoản Organizer
// (duyệt/khóa tổ chức)". Đây là màn hình duy nhất chỉ Super Admin có
// quyền vào (xem rbac.ts). Nó KHÔNG hiện dữ liệu attendee (tên/email/SĐT
// người tham dự) của bất kỳ tổ chức nào — đúng nguyên tắc least privilege
// nêu ở mục 1.1: chỉ hiện thông tin cấp tổ chức (tên org, plan, số sự
// kiện, email chủ sở hữu) cần thiết để duyệt/khóa, không đào sâu vào dữ
// liệu vận hành sự kiện của Organizer.
const STATUS_STYLE: Record<OrgStatus, { bg: string; text: string; dot: string }> = {
  Active: { bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Pending: { bg: 'bg-amber-50 border border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  Locked: { bg: 'bg-red-50 border border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
}

const PLAN_LABEL: Record<OrganizationItem['plan'], string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

export function OrganizationsScreen() {
  const [orgs, setOrgs] = useState<OrganizationItem[]>(initialOrgs)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function setStatus(id: string, status: OrgStatus) {
    setOrgs(list => list.map(o => (o.id === id ? { ...o, status } : o)))
    const org = orgs.find(o => o.id === id)
    if (!org) return
    showToast(
      status === 'Locked'
        ? `${org.name} đã bị khóa — Organizer của tổ chức này sẽ không đăng nhập được nữa`
        : `${org.name} đã được ${status === 'Active' ? 'duyệt/mở khóa' : 'cập nhật'}`,
      status === 'Locked' ? 'error' : 'success'
    )
  }

  const activeCount = orgs.filter(o => o.status === 'Active').length
  const pendingCount = orgs.filter(o => o.status === 'Pending').length

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Organizations</h1>
          <p className="text-sm text-slate-500">
            {orgs.length} tổ chức trên hệ thống · {activeCount} active · {pendingCount} chờ duyệt
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

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Organization', 'Owner Email', 'Plan', 'Events', 'Created', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orgs.map(o => (
              <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {o.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-800">{o.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-xs font-mono text-slate-500">{o.ownerEmail}</td>
                <td className="px-5 py-4">
                  <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium">{PLAN_LABEL[o.plan]}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">{o.eventsCount}</span>
                </td>
                <td className="px-5 py-4 text-xs text-slate-500 font-mono">{o.createdAt}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[o.status].bg} ${STATUS_STYLE[o.status].text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLE[o.status].dot}`} />
                    {o.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    {o.status === 'Pending' && (
                      <button onClick={() => setStatus(o.id, 'Active')} className="px-2.5 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors font-medium">
                        Approve
                      </button>
                    )}
                    {o.status === 'Active' && (
                      <button onClick={() => setStatus(o.id, 'Locked')} className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">
                        Lock
                      </button>
                    )}
                    {o.status === 'Locked' && (
                      <button onClick={() => setStatus(o.id, 'Active')} className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium">
                        Unlock
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  )
}
