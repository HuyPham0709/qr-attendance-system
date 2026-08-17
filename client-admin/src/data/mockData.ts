import { 
  HourlyData, GateData, RecentActivity, EventItem, 
  AttendeeItem, StaffItem, AuditLogItem 
} from '../types'

export const hourlyData: HourlyData[] = [
  { time: '08:00', checkins: 12 }, { time: '09:00', checkins: 45 },
  { time: '10:00', checkins: 87 }, { time: '11:00', checkins: 134 },
  { time: '12:00', checkins: 98 }, { time: '13:00', checkins: 67 },
  { time: '14:00', checkins: 112 }, { time: '15:00', checkins: 156 },
  { time: '16:00', checkins: 143 }, { time: '17:00', checkins: 89 },
]

export const gateData: GateData[] = [
  { name: 'Gate A – Main', value: 412 },
  { name: 'Gate B – VIP', value: 187 },
  { name: 'Gate C – Staff', value: 94 },
  { name: 'Gate D – Press', value: 63 },
]

export const GATE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6']

export const recentActivity: RecentActivity[] = [
  { name: 'Priya Sharma', time: '17:42:11', gate: 'Gate A – Main', status: 'Checked-in' },
  { name: 'Marcus Chen', time: '17:41:58', gate: 'Gate B – VIP', status: 'Checked-in' },
  { name: 'Aisha Kowalski', time: '17:41:33', gate: 'Gate A – Main', status: 'Checked-in' },
  { name: 'Tyler Okonkwo', time: '17:40:07', gate: 'Gate D – Press', status: 'Revoked' },
  { name: 'Lena Fischer', time: '17:39:44', gate: 'Gate A – Main', status: 'Checked-in' },
  { name: 'Raj Patel', time: '17:39:21', gate: 'Gate C – Staff', status: 'Offline Pending' },
  { name: 'Sophie Martin', time: '17:38:55', gate: 'Gate B – VIP', status: 'Checked-in' },
]

export const events: EventItem[] = [
  { id: 1, name: 'TechSummit 2026', start: '2026-09-14 09:00', end: '2026-09-14 18:00', location: 'Marina Bay Convention Centre', gates: 4, status: 'Ongoing' },
  { id: 2, name: 'Startup Expo APAC', start: '2026-10-02 10:00', end: '2026-10-03 17:00', location: 'Suntec City Hall 4 & 5', gates: 3, status: 'Published' },
  { id: 3, name: 'Dev Conf Southeast', start: '2026-11-18 08:30', end: '2026-11-18 20:00', location: 'KLCC Convention Centre', gates: 2, status: 'Draft' },
  { id: 4, name: 'AI Symposium 2026', start: '2026-12-05 09:00', end: '2026-12-06 18:00', location: 'JW Marriott Jakarta', gates: 5, status: 'Draft' },
  { id: 5, name: 'UX Design Forum', start: '2026-08-28 10:00', end: '2026-08-28 16:00', location: 'One Raffles Quay, Singapore', gates: 2, status: 'Published' },
]

export const attendees: AttendeeItem[] = [
  { id: 1, name: 'Priya Sharma', email: 'priya.sharma@techcorp.io', ticket: 'VIP Pass', qrVersion: 3, status: 'Checked-in', timestamp: '2026-09-14 09:14', gate: 'Gate B – VIP' },
  { id: 2, name: 'Marcus Chen', email: 'marcus.c@devstudio.sg', ticket: 'General Admission', qrVersion: 1, status: 'Checked-in', timestamp: '2026-09-14 09:22', gate: 'Gate A – Main' },
  { id: 3, name: 'Tyler Okonkwo', email: 'tyler.o@gmail.com', ticket: 'General Admission', qrVersion: 5, status: 'Revoked', timestamp: '—', gate: '—' },
  { id: 4, name: 'Aisha Kowalski', email: 'a.kowalski@krakow.pl', ticket: 'Press Pass', qrVersion: 1, status: 'Registered', timestamp: '—', gate: '—' },
  { id: 5, name: 'Lena Fischer', email: 'l.fischer@berlin.de', ticket: 'Speaker', qrVersion: 2, status: 'Checked-in', timestamp: '2026-09-14 10:05', gate: 'Gate A – Main' },
  { id: 6, name: 'Raj Patel', email: 'raj.patel@infosys.com', ticket: 'Staff', qrVersion: 1, status: 'Offline Pending', timestamp: '—', gate: 'Gate C – Staff' },
  { id: 7, name: 'Sophie Martin', email: 's.martin@paris.tech', ticket: 'VIP Pass', qrVersion: 1, status: 'Checked-in', timestamp: '2026-09-14 09:38', gate: 'Gate B – VIP' },
  { id: 8, name: 'James Nakamura', email: 'j.nakamura@sony.co.jp', ticket: 'General Admission', qrVersion: 1, status: 'Registered', timestamp: '—', gate: '—' },
]

export const staff: StaffItem[] = [
  { id: 1, name: 'Hiroshi Tanaka', email: 'hiroshi@eventstaff.com', role: 'Scanner Staff', event: 'TechSummit 2026', gate: 'Gate A – Main', status: 'Active' },
  { id: 2, name: 'Beatrice Addo', email: 'beatrice@eventstaff.com', role: 'Scanner Staff', event: 'TechSummit 2026', gate: 'Gate B – VIP', status: 'Active' },
  { id: 3, name: 'Kevin Lim', email: 'kevin@eventstaff.com', role: 'Organizer', event: 'TechSummit 2026', gate: 'All Gates', status: 'Active' },
  { id: 4, name: 'Farah Al-Hassan', email: 'farah@eventstaff.com', role: 'Scanner Staff', event: 'Startup Expo APAC', gate: 'Gate A – Main', status: 'Inactive' },
]

export const auditLogs: AuditLogItem[] = [
  { ts: '2026-09-14 17:42:11', event: 'TechSummit 2026', attendee: 'Priya Sharma', staff: 'Hiroshi Tanaka', device: 'SCAN-DEV-007', result: 'Success' },
  { ts: '2026-09-14 17:41:58', event: 'TechSummit 2026', attendee: 'Marcus Chen', staff: 'Beatrice Addo', device: 'SCAN-DEV-003', result: 'Success' },
  { ts: '2026-09-14 17:41:33', event: 'TechSummit 2026', attendee: 'Tyler Okonkwo', staff: 'Hiroshi Tanaka', device: 'SCAN-DEV-007', result: 'Revoked' },
  { ts: '2026-09-14 17:40:07', event: 'TechSummit 2026', attendee: 'Unknown QR #8821', staff: 'Beatrice Addo', device: 'SCAN-DEV-003', result: 'Expired QR' },
  { ts: '2026-09-14 17:38:44', event: 'TechSummit 2026', attendee: 'Raj Patel', staff: 'Kevin Lim', device: 'SCAN-DEV-011', result: 'Success' },
  { ts: '2026-09-14 17:37:22', event: 'TechSummit 2026', attendee: 'Marcus Chen', staff: 'Hiroshi Tanaka', device: 'SCAN-DEV-007', result: 'Duplicate' },
  { ts: '2026-09-14 17:35:01', event: 'TechSummit 2026', attendee: 'Aisha Kowalski', staff: 'Beatrice Addo', device: 'SCAN-DEV-003', result: 'Wrong Geo' },
]