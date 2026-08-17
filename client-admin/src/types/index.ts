export type Screen = 'login' | 'dashboard' | 'events' | 'attendees' | 'staff-audit'
export type StatusBadgeType = 'Registered' | 'Checked-in' | 'Revoked' | 'Offline Pending'
export type EventStatus = 'Draft' | 'Published' | 'Ongoing'
export type ScanResult = 'Success' | 'Duplicate' | 'Expired QR' | 'Wrong Geo' | 'Revoked'

export interface HourlyData {
  time: string
  checkins: number
}

export interface GateData {
  name: string
  value: number
}

export interface RecentActivity {
  name: string
  time: string
  gate: string
  status: StatusBadgeType
}

export interface EventItem {
  id: number
  name: string
  start: string
  end: string
  location: string
  gates: number
  status: EventStatus
}

export interface AttendeeItem {
  id: number
  name: string
  email: string
  ticket: string
  qrVersion: number
  status: StatusBadgeType
  timestamp: string
  gate: string
}

export interface StaffItem {
  id: number
  name: string
  email: string
  role: string
  event: string
  gate: string
  status: string
}

export interface AuditLogItem {
  ts: string
  event: string
  attendee: string
  staff: string
  device: string
  result: ScanResult
}