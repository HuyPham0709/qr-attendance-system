export type Screen = 'login' | 'dashboard' | 'events' | 'attendees' | 'staff-audit' | 'organizations'
export type OrgStatus = 'Active' | 'Locked' | 'Pending'
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
  // organizationId để Organizer chỉ thấy/sửa sự kiện của mình, còn Super
  // Admin xem toàn bộ (mục 1.1/1.2 spec — filter theo organizationId).
  organizationId: string
  organizationName: string
}

export interface OrganizationItem {
  id: string
  name: string
  plan: 'free' | 'pro' | 'enterprise'
  status: OrgStatus
  eventsCount: number
  ownerEmail: string
  createdAt: string
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
  organizationId: string
}

export interface AuditLogItem {
  ts: string
  event: string
  attendee: string
  staff: string
  device: string
  result: ScanResult
  organizationId: string
}