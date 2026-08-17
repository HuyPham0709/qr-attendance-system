import React from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { StatusBadge } from "../ui/Badges";
import { Attendee } from '../../types'

interface QrInspectModalProps {
  attendee: Attendee | null
  onClose: () => void
  onResendEmail: (email: string) => void
  onRevoke: (attendee: Attendee) => void
}

export function QrInspectModal({ attendee, onClose, onResendEmail, onRevoke }: QrInspectModalProps) {
  if (!attendee) return null

  const initials = attendee.name.split(' ').map(n => n[0]).join('')

  return (
    <Modal open={!!attendee} onClose={onClose} title="QR Code Inspection" width="max-w-md">
      <div className="space-y-5">
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {initials}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{attendee.name}</div>
            <div className="text-xs text-slate-400 font-mono">{attendee.email}</div>
          </div>
          <div className="ml-auto">
            <StatusBadge status={attendee.status} />
          </div>
        </div>

        {/* Matrix QR visual element */}
        <div className="flex justify-center">
          <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl inline-block">
            <div className="w-40 h-40 grid grid-cols-7 gap-px">
              {[...Array(49)].map((_, i) => {
                const corners = [0, 1, 2, 3, 4, 5, 6, 7, 13, 14, 20, 21, 27, 28, 34, 35, 41, 42, 43, 44, 45, 46, 47, 48]
                const inner = [8, 9, 10, 15, 16, 17, 22, 23, 24]
                return (
                  <div
                    key={i}
                    className={`rounded-sm ${
                      corners.includes(i)
                        ? 'bg-slate-900'
                        : inner.includes(i)
                        ? 'bg-emerald-500'
                        : i % 2 === 0
                        ? 'bg-slate-900'
                        : 'bg-white'
                    }`}
                  />
                )
              })}
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-50">
            <span className="text-slate-500">QR Version</span>
            <span className="font-mono font-semibold text-slate-800">v{attendee.qrVersion}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-50">
            <span className="text-slate-500">Ticket Type</span>
            <span className="font-medium text-slate-800">{attendee.ticket}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-50">
            <span className="text-slate-500">HMAC Signature</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium text-xs">
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-500">Gate Assigned</span>
            <span className="text-slate-800">{attendee.gate === '—' ? 'Any gate' : attendee.gate}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => onResendEmail(attendee.email)} className="w-full">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            Resend QR Email
          </Button>
          <Button variant="danger" onClick={() => onRevoke(attendee)} className="w-full">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
            </svg>
            Revoke QR
          </Button>
        </div>
      </div>
    </Modal>
  )
}