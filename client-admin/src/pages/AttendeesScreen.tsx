import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { Button } from '../components/ui/Button'
import { StatusBadge } from "../components/ui/Badges";
import { Toast } from '../components/ui/Toast'
import { SearchIcon } from '../components/ui/Icons'
import { QrInspectModal } from '../components/attendees/QrInspectModal'
import { ImportAttendeesModal } from '../components/attendees/ImportAttendeesModal'
import { attendees as initialAttendees } from '../data/mockData'
import { AttendeeItem } from '../types'
import { AuthUser } from '../services/authService'

interface AttendeesScreenProps {
  // Nhận user để sẵn sàng cho khi nối BE thật: mọi request list/import/
  // export ở màn này phải kèm theo scope tổ chức của Organizer đang đăng
  // nhập (mục 1.2 spec — filter theo organizationId ở mọi query). Màn
  // hình này chỉ Organizer vào được (xem rbac.ts) — Super Admin không có
  // trong nav vì đây là dữ liệu nhạy cảm của attendee (least privilege,
  // mục 1.1 spec).
  user: AuthUser
}

export function AttendeesScreen({ user }: AttendeesScreenProps) {
  const [attendeeList, setAttendeeList] = useState<AttendeeItem[]>(initialAttendees)
  const [selected, setSelected] = useState<number[]>([])
  const [showImport, setShowImport] = useState(false)
  const [showQR, setShowQR] = useState<AttendeeItem | null>(null)
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function toggleSelect(id: number) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  // Lọc dữ liệu theo trạng thái và từ khóa tìm kiếm
  const filtered = attendeeList.filter(a => {
    const matchesStatus = statusFilter === 'All' ? true : a.status === statusFilter
    const matchesSearch = 
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // CHỨC NĂNG XUẤT EXCEL (EXPORT)
  const handleExportExcel = () => {
    // Nếu có dòng được chọn thì xuất dòng chọn, ngược lại xuất toàn bộ danh sách đã lọc
    const targetList = selected.length > 0 
      ? attendeeList.filter(a => selected.includes(Number(a.id)))
      : filtered

    if (targetList.length === 0) {
      showToast('Không có dữ liệu để xuất Excel', 'error')
      return
    }

    // Format dữ liệu xuất ra Excel
    const excelData = targetList.map((a, index) => ({
      'STT': index + 1,
      'Mã ID': a.id,
      'Họ và Tên': a.name,
      'Email': a.email,
      'Loại Vé': a.ticket,
      'QR Version': `v${a.qrVersion}`,
      'Trạng Thái': a.status,
      'Thời Gian Check-in': a.timestamp || '--',
      'Cổng Check-in': a.gate || '--'
    }))

    // Tạo workbook Excel bằng SheetJS
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendees')

    // Thiết lập độ rộng cột
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 15 },
      { wch: 25 },
      { wch: 30 },
      { wch: 20 },
      { wch: 12 },
      { wch: 18 },
      { wch: 20 },
      { wch: 15 },
    ]

    // Xuất file về máy
    const fileName = `Danh_Sach_Nguoi_Tham_Du_${new Date().toISOString().slice(0, 10)}.xlsx`
    XLSX.writeFile(workbook, fileName)
    showToast(`Đã xuất ${targetList.length} hàng ra file Excel!`, 'success')
  }

  // CHỨC NĂNG NHẬN DỮ LIỆU IMPORT KHỎI MODAL
  const handleImportComplete = (msg: string, importedAttendees: AttendeeItem[]) => {
    if (importedAttendees && importedAttendees.length > 0) {
      setAttendeeList(prev => [...importedAttendees, ...prev])
    }
    showToast(msg, 'success')
  }

  return (
    <div className="p-6 space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Attendee Engine</h1>
          <p className="text-sm text-slate-500">
            {attendeeList.length} attendees · TechSummit 2026{user.organizationName ? ` · ${user.organizationName}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Nút Export Excel Thật */}
          <Button variant="secondary" onClick={handleExportExcel}>
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export Excel
          </Button>

          {/* Nút Mở Modal Import Excel */}
          <Button variant="secondary" onClick={() => setShowImport(true)}>
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Import Excel
          </Button>
          <Button variant="primary" onClick={() => showToast('Attendee added')}>+ Add Attendee</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <SearchIcon />
          </span>
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
            placeholder="Search by name or email…"
          />
        </div>
        <select className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 bg-white focus:border-emerald-400 outline-none">
          <option>All Tickets</option>
          <option>VIP Pass</option>
          <option>General Admission</option>
          <option>Speaker</option>
          <option>Press Pass</option>
          <option>Staff</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 bg-white focus:border-emerald-400 outline-none"
        >
          <option>All</option>
          <option>Registered</option>
          <option>Checked-in</option>
          <option>Revoked</option>
          <option>Offline Pending</option>
        </select>
        {selected.length > 0 && (
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            {selected.length} selected
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-4 py-3.5 w-10">
                <input
                  type="checkbox"
                  className="rounded border-slate-300"
                  onChange={e => setSelected(e.target.checked ? filtered.map(a => Number(a.id)) : [])}
                />
              </th>
              {['Full Name', 'Email', 'Ticket Type', 'QR Version', 'Status', 'Check-in Time', 'Gate', ''].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors ${selected.includes(Number(a.id)) ? 'bg-emerald-50/30' : ''}`}>
                <td className="px-4 py-3.5">
                  <input type="checkbox" className="rounded border-slate-300" checked={selected.includes(Number(a.id))} onChange={() => toggleSelect(Number(a.id))} />
                </td>
                <td className="px-4 py-3.5 font-semibold text-slate-800">{a.name}</td>
                <td className="px-4 py-3.5 text-slate-500 text-xs font-mono">{a.email}</td>
                <td className="px-4 py-3.5 text-slate-600 text-xs">{a.ticket}</td>
                <td className="px-4 py-3.5">
                  <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-600">v{a.qrVersion}</span>
                </td>
                <td className="px-4 py-3.5"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-3.5 text-xs font-mono text-slate-500">{a.timestamp}</td>
                <td className="px-4 py-3.5 text-xs text-slate-500">{a.gate}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setShowQR(a)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Inspect QR">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button onClick={() => showToast(`Manual check-in modal opened for ${a.name}`)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Manual check-in">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-50 bg-slate-50/50">
          <span className="text-xs text-slate-400">Showing 1–{filtered.length} of {attendeeList.length} attendees</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, '…', 12].map((p, i) => (
              <button
                key={i}
                className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-medium transition-colors ${
                  p === 1 ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ImportAttendeesModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImportComplete={handleImportComplete}
      />

      <QrInspectModal
        attendee={showQR as any}
        onClose={() => setShowQR(null)}
        onResendEmail={email => showToast(`QR email resent to ${email}`)}
        onRevoke={attendee => {
          setShowQR(null)
          showToast(`QR revoked for ${attendee.name}`, 'error')
        }}
      />

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  )
}