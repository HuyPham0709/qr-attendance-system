import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface ImportAttendeesModalProps {
  open: boolean
  onClose: () => void
  onImportComplete: (message: string) => void
}

const previewRows = [
  { name: 'Alice Nguyen', email: 'alice@startup.io', ticket: 'VIP Pass', error: null },
  { name: 'Bob Tan', email: 'bob.tan@corp.sg', ticket: 'General', error: null },
  { name: 'Carol Wu', email: 'priya.sharma@techcorp.io', ticket: 'General', error: 'Duplicate email detected' },
  { name: 'David Park', email: 'david@', ticket: 'Speaker', error: 'Invalid email format' },
  { name: 'Emma Silva', email: 'emma.s@brazil.com', ticket: 'Press', error: null },
]

export function ImportAttendeesModal({ open, onClose, onImportComplete }: ImportAttendeesModalProps) {
  const [importStep, setImportStep] = useState<1 | 2>(1)

  const handleClose = () => {
    setImportStep(1)
    onClose()
  }

  const handleFinishImport = () => {
    handleClose()
    onImportComplete('3 attendees imported (2 rows skipped)')
  }

  return (
    <Modal open={open} onClose={handleClose} title={`Import Attendees · Step ${importStep} of 2`} width="max-w-2xl">
      {importStep === 1 ? (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer group">
            <div className="w-14 h-14 bg-slate-100 group-hover:bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors">
              <svg className="w-7 h-7 text-slate-400 group-hover:text-emerald-500 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Drop your .xlsx file here</p>
            <p className="text-xs text-slate-400">or click to browse · max 10 MB</p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800">
            Required columns: <span className="font-mono font-semibold">Full Name, Email, Ticket Type</span> · Optional: Phone, Company
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleClose} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={() => setImportStep(2)} className="flex-1">Preview Import</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <span className="text-base">⚠️</span>
            <span><strong>2 validation errors</strong> found. Review highlighted rows before importing.</span>
          </div>
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['#', 'Full Name', 'Email', 'Ticket Type', 'Validation'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} className={`border-b border-slate-50 last:border-0 ${row.error ? 'bg-red-50' : ''}`}>
                    <td className="px-3 py-2.5 text-slate-400 font-mono">{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-800">{row.name}</td>
                    <td className={`px-3 py-2.5 font-mono ${row.error === 'Duplicate email detected' ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>{row.email}</td>
                    <td className="px-3 py-2.5 text-slate-600">{row.ticket}</td>
                    <td className="px-3 py-2.5">
                      {row.error ? (
                        <span className="flex items-center gap-1 text-red-600"><span>✕</span>{row.error}</span>
                      ) : (
                        <span className="text-emerald-600">✓ Valid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setImportStep(1)} className="flex-1">← Back</Button>
            <Button variant="primary" onClick={handleFinishImport} className="flex-1">Import Valid Rows (3)</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}