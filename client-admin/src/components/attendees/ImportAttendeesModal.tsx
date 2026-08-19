import React, { useState, ChangeEvent } from 'react'
import * as XLSX from 'xlsx'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { AttendeeItem } from '../../types'

interface ImportAttendeesModalProps {
  open: boolean
  onClose: () => void
  onImportComplete: (msg: string, importedAttendees: AttendeeItem[]) => void
}

export function ImportAttendeesModal({ open, onClose, onImportComplete }: ImportAttendeesModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<AttendeeItem[]>([])
  const [loading, setLoading] = useState(false)

  // Xử lý đọc file Excel và parse dữ liệu
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    const reader = new FileReader()

    reader.onload = (evt) => {
      try {
        const dataBuffer = evt.target?.result
        const workbook = XLSX.read(dataBuffer, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet)

        // Map dữ liệu Excel thành kiểu AttendeeItem tương thích
        const mappedAttendees: AttendeeItem[] = rawJson.map((row, index) => {
          const rawStatus = (row['Trạng Thái'] || row['Status'] || row['status'] || '').toString().toLowerCase()
          let status: AttendeeItem['status'] = 'Registered'

          if (rawStatus.includes('check') || rawStatus === 'checked_in') {
            status = 'Checked-in'
          } else if (rawStatus.includes('revoke') || rawStatus === 'cancelled') {
            status = 'Revoked'
          } else if (rawStatus.includes('offline') || rawStatus.includes('pending')) {
            status = 'Offline Pending'
          }

          return {
            id: Date.now() + index,
            name: row['Họ tên'] || row['Họ và Tên'] || row['fullName'] || row['Name'] || 'Chưa đặt tên',
            email: row['Email'] || row['email'] || '',
            ticket: row['Loại vé'] || row['Loại Vé'] || row['ticket'] || 'General Admission',
            qrVersion: Number(row['QR Version'] || row['qrVersion'] || 1),
            status: status,
            timestamp: row['Thời gian check-in'] || row['timestamp'] || '--',
            gate: row['Cổng'] || row['gate'] || '--'
          }
        })

        setPreviewData(mappedAttendees)
      } catch (err) {
        alert('Có lỗi xảy ra khi đọc file Excel. Vui lòng kiểm tra lại định dạng file!')
      }
    }

    reader.readAsBinaryString(selectedFile)
  }

  const handleConfirmImport = () => {
    if (!previewData.length) return
    setLoading(true)

    setTimeout(() => {
      onImportComplete(`Đã nhập thành công ${previewData.length} người tham dự!`, previewData)
      handleReset()
      setLoading(false)
      onClose()
    }, 500)
  }

  const handleReset = () => {
    setFile(null)
    setPreviewData([])
  }

  return (
    <Modal open={open} onClose={() => { handleReset(); onClose(); }} title="Import Danh Sách Người Tham Dự (Excel)">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Tải lên file Excel (.xlsx, .xls, .csv)
          </label>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
          />
        </div>

        {/* Bảng xem trước dữ liệu Excel đã đọc */}
        {previewData.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-semibold text-slate-500">
                Xem trước dữ liệu ({previewData.length} dòng):
              </p>
            </div>
            <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="p-2.5">Họ tên</th>
                    <th className="p-2.5">Email</th>
                    <th className="p-2.5">Loại vé</th>
                    <th className="p-2.5">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewData.slice(0, 5).map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-medium text-slate-800">{row.name}</td>
                      <td className="p-2.5 font-mono text-slate-500">{row.email}</td>
                      <td className="p-2.5 text-slate-600">{row.ticket}</td>
                      <td className="p-2.5 text-slate-600">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewData.length > 5 && (
              <p className="text-[11px] text-slate-400 mt-1.5 italic">
                ...và {previewData.length - 5} người tham dự khác
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={() => { handleReset(); onClose(); }}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmImport}
            disabled={!previewData.length || loading}
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận Import'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}