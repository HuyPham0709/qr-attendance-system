import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface ManualCheckInModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}

const MIN_REASON_LENGTH = 20

export function ManualCheckInModal({ open, onClose, onConfirm }: ManualCheckInModalProps) {
  const [manualReason, setManualReason] = useState('')

  const handleClose = () => {
    setManualReason('')
    onClose()
  }

  const handleConfirm = () => {
    onConfirm(manualReason.trim())
    setManualReason('')
  }

  const isInvalid = manualReason.trim().length < MIN_REASON_LENGTH

  return (
    <Modal open={open} onClose={handleClose} title="Manual Check-in" width="max-w-sm">
      <div className="space-y-4">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          Manual check-ins require a mandatory reason for full audit trail compliance.
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Reason for Manual Check-in <span className="text-red-500">*</span>
          </label>
          <textarea
            value={manualReason}
            onChange={e => setManualReason(e.target.value)}
            rows={4}
            placeholder="e.g. Attendee's phone battery died, QR could not be displayed. Identity verified via government-issued ID…"
            className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white outline-none transition-all resize-none ${
              !manualReason.trim() && manualReason !== ''
                ? 'border-red-400 ring-2 ring-red-100'
                : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
            }`}
          />
          {manualReason !== '' && isInvalid && (
            <p className="text-xs text-amber-600 mt-1">
              Please provide a more detailed reason ({manualReason.trim().length}/{MIN_REASON_LENGTH} min chars)
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleClose} className="flex-1">Cancel</Button>
          <Button
            variant="primary"
            disabled={isInvalid}
            onClick={handleConfirm}
            className="flex-1"
          >
            Confirm Check-in
          </Button>
        </div>
      </div>
    </Modal>
  )
}