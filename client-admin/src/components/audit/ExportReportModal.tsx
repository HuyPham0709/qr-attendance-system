import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Event } from '../../types'

interface ExportReportModalProps {
  open: boolean
  events: Event[]
  onClose: () => void
  onExport: (format: string) => void
}

export function ExportReportModal({ open, events, onClose, onExport }: ExportReportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState('.xlsx')

  return (
    <Modal open={open} onClose={onClose} title="Export Report" width="max-w-md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start Date" type="date" />
          <Input label="End Date" type="date" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Filter by Event</label>
          <select className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none">
            <option>All Events</option>
            {events.map(e => (
              <option key={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Export Format</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { fmt: '.xlsx', label: 'Excel Spreadsheet', icon: '📊', sub: 'Raw data, filterable' },
              { fmt: 'PDF', label: 'PDF Report', icon: '📄', sub: 'Print-ready layout' },
            ].map(f => (
              <label
                key={f.fmt}
                className={`flex flex-col p-3 border-2 rounded-xl cursor-pointer transition-colors ${
                  selectedFormat === f.fmt ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-400'
                }`}
              >
                <input
                  type="radio"
                  name="fmt"
                  checked={selectedFormat === f.fmt}
                  onChange={() => setSelectedFormat(f.fmt)}
                  className="sr-only"
                />
                <span className="text-xl mb-1">{f.icon}</span>
                <span className="text-sm font-semibold text-slate-800">{f.fmt}</span>
                <span className="text-xs text-slate-400">{f.sub}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={() => onExport(selectedFormat)} className="flex-1">
            Generate & Download
          </Button>
        </div>
      </div>
    </Modal>
  )
}