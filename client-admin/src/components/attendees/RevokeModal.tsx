import React from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface RevokeModalProps {
  open: boolean
  qrVersion?: number
  onClose: () => void
  onConfirm: (newVersion: number) => void
}

export function RevokeModal({ open, qrVersion = 5, onClose, onConfirm }: RevokeModalProps) {
  const nextVersion = qrVersion + 1

  return (
    <Modal open={open} onClose={onClose} title="Revoke QR Code" width="max-w-sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
          <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-red-800">
            <p className="font-semibold mb-1">QR Version Bump Warning</p>
            <p className="text-xs">
              Revoking will increment the attendee&apos;s <span className="font-mono font-bold">qrVersion</span> counter. Their current QR code will be <strong>immediately invalidated</strong> at all scanners. A new QR will be generated if re-invited.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={() => onConfirm(nextVersion)} className="flex-1">
            Confirm Revoke
          </Button>
        </div>
      </div>
    </Modal>
  )
}