import React, { ChangeEvent, useState } from 'react'
import * as XLSX from 'xlsx'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { importAuditLogs } from '../../services/auditService'

interface ImportReportModalProps {
  open: boolean
  onClose: () => void
  onImported: (message: string) => void
}

export function ImportReportModal({ open, onClose, onImported }: ImportReportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [previewCount, setPreviewCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    if (!selected) return
    setFile(selected); setError('')
    const reader = new FileReader()
    reader.onload = result => {
      try {
        const workbook = XLSX.read(result.target?.result, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        setPreviewCount(XLSX.utils.sheet_to_json(sheet).length)
      } catch { setPreviewCount(0); setError('Không đọc được file') }
    }
    reader.readAsArrayBuffer(selected)
  }

  async function submit() {
    if (!file) return
    setLoading(true); setError('')
    try {
      const result = await importAuditLogs(file)
      onImported(`Đã import ${result.imported} audit log`)
      setFile(null); setPreviewCount(0); onClose()
    } catch (err: any) { setError(err.message || 'Import thất bại') }
    finally { setLoading(false) }
  }

  return <Modal open={open} onClose={onClose} title="Import Security Audit" width="max-w-lg">
    <div className="space-y-4">
      <p className="text-xs text-slate-500">File cần có: <span className="font-mono">eventId</span>, <span className="font-mono">attendeeId</span>, <span className="font-mono">result</span>. Tùy chọn: gate, deviceId, clientTimestamp.</p>
      <input type="file" accept=".xlsx,.xls,.csv" onChange={selectFile} className="block w-full text-sm text-slate-500" />
      {file && <p className="text-xs text-slate-600">{file.name} · {previewCount} dòng</p>}
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 whitespace-pre-wrap">{error}</div>}
      <div className="flex gap-2"><Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button><Button variant="primary" disabled={!file || !previewCount || loading} onClick={submit} className="flex-1">{loading ? 'Importing...' : 'Import Audit Logs'}</Button></div>
    </div>
  </Modal>
}
