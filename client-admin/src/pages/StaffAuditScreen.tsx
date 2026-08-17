import React, { useState } from 'react'
import { Button } from '../components/ui/Button'
import { Toast } from '../components/ui/Toast'
import { ScanResultBadge } from "../components/ui/Badges";
import { SearchIcon } from '../components/ui/Icons'
import { ExportReportModal } from '../components/audit/ExportReportModal'
import { staff, auditLogs, events } from '../data/mockData'

export function StaffAuditScreen() {
  const [tab, setTab] = useState<'staff' | 'audit'>('staff')
  const [showExport, setShowExport] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function showToastMsg(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Staff & Security Audit</h1>
          <p className="text-sm text-slate-500">Staff assignments · Append-only audit log</p>
        </div>
        <Button variant="secondary" onClick={() => setShowExport(true)}>
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Export Report
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['staff', 'audit'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'staff' ? '👤 Staff Assignment' : '🛡️ Audit Log'}
          </button>
        ))}
      </div>

      {tab === 'staff' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <h3 className="text-sm font-semibold text-slate-900">Scanner Staff Assignments</h3>
            <Button variant="primary" size="sm" onClick={() => showToastMsg('Staff member invited')}>
              + Invite Staff
            </Button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Staff Member', 'Email', 'Role', 'Assigned Event', 'Gate', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {s.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-semibold text-slate-800">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs font-mono text-slate-500">{s.email}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium">{s.role}</span>
                  </td>
                  <td className="px-5 py-4">
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:border-emerald-400 outline-none">
                      <option>{s.event}</option>
                      <option>Startup Expo APAC</option>
                      <option>Dev Conf Southeast</option>
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:border-emerald-400 outline-none">
                      <option>{s.gate}</option>
                      <option>Gate A – Main</option>
                      <option>Gate B – VIP</option>
                      <option>Gate C – Staff</option>
                      <option>Gate D – Press</option>
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => showToastMsg(`${s.name} removed from assignment`)} className="text-xs text-red-500 hover:text-red-700 font-medium">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-slate-900">Security Audit Log</h3>
              <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-medium">Append-only</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><SearchIcon /></span>
                <input className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-emerald-400 outline-none w-48" placeholder="Search attendee or staff…" />
              </div>
              <select className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:border-emerald-400 outline-none">
                <option>All Results</option>
                <option>Success</option>
                <option>Duplicate</option>
                <option>Expired QR</option>
                <option>Wrong Geo</option>
                <option>Revoked</option>
              </select>
            </div>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Timestamp', 'Event', 'Attendee', 'Scanned By', 'Device ID', 'Result'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left font-semibold text-slate-500 uppercase tracking-wide text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((row, i) => (
                <tr key={i} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors ${row.result !== 'Success' ? 'bg-red-50/20' : ''}`}>
                  <td className="px-5 py-3.5 font-mono text-slate-400">{row.ts}</td>
                  <td className="px-5 py-3.5 text-slate-700 font-medium">{row.event}</td>
                  <td className="px-5 py-3.5 text-slate-600">{row.attendee}</td>
                  <td className="px-5 py-3.5 text-slate-600">{row.staff}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-400">{row.device}</td>
                  <td className="px-5 py-3.5"><ScanResultBadge result={row.result} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-50 bg-slate-50/50">
            <span className="text-xs text-slate-400">Showing {auditLogs.length} of 2,841 entries</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, '…', 285].map((p, i) => (
                <button key={i} className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-medium transition-colors ${p === 1 ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <ExportReportModal
        open={showExport}
        events={events}
        onClose={() => setShowExport(false)}
        onExport={fmt => {
          setShowExport(false)
          showToastMsg(`Report generation started (${fmt}) — download will begin shortly`)
        }}
      />

      {toast && <Toast message={toast} type="success" />}
    </div>
  )
}