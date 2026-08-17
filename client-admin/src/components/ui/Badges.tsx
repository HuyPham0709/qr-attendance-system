import React from 'react'
import { StatusBadgeType, EventStatus, ScanResult } from '../../types'

export function StatusBadge({ status }: { status: StatusBadgeType }) {
  const cfg: Record<StatusBadgeType, { bg: string; text: string; dot: string }> = {
    'Checked-in':      { bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    'Registered':      { bg: 'bg-blue-50 border border-blue-200',    text: 'text-blue-700',    dot: 'bg-blue-500' },
    'Revoked':         { bg: 'bg-red-50 border border-red-200',      text: 'text-red-700',     dot: 'bg-red-500' },
    'Offline Pending': { bg: 'bg-amber-50 border border-amber-200',  text: 'text-amber-700',   dot: 'bg-amber-500' },
  }
  const { bg, text, dot } = cfg[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  )
}

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const cfg: Record<EventStatus, { bg: string; text: string }> = {
    'Ongoing':   { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    'Published': { bg: 'bg-blue-100',    text: 'text-blue-800' },
    'Draft':     { bg: 'bg-slate-100',   text: 'text-slate-600' },
  }
  const { bg, text } = cfg[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${bg} ${text}`}>
      {status}
    </span>
  )
}

export function ScanResultBadge({ result }: { result: ScanResult }) {
  const cfg: Record<ScanResult, { bg: string; text: string }> = {
    'Success':    { bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-700' },
    'Duplicate':  { bg: 'bg-amber-50 border border-amber-200',     text: 'text-amber-700' },
    'Expired QR': { bg: 'bg-orange-50 border border-orange-200',  text: 'text-orange-700' },
    'Wrong Geo':  { bg: 'bg-purple-50 border border-purple-200',  text: 'text-purple-700' },
    'Revoked':    { bg: 'bg-red-50 border border-red-200',         text: 'text-red-700' },
  }
  const { bg, text } = cfg[result]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
      {result}
    </span>
  )
}