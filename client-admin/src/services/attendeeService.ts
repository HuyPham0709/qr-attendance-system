import { get, post, patch, del, upload } from './api';

export interface AttendeeItem {
  _id: string;
  eventId: string;
  ticketTypeId?: string;
  fullName: string;
  email: string;
  phone?: string;
  qrCode: string;
  qrVersion: number;
  status: 'registered' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  checkIn: {
    isCheckedIn: boolean;
    checkInAt?: string;
    checkInBy?: string;
    gate?: string;
    method?: 'qr_scan' | 'manual' | 'kiosk';
    deviceInfo?: string;
    manualReason?: string;
  };
  version: number;
  customFields?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AttendeesResponse {
  data: AttendeeItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export async function listAttendees(params?: { page?: number; limit?: number; eventId?: string; status?: string; search?: string }): Promise<AttendeesResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.eventId) query.set('eventId', params.eventId);
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  return get<AttendeesResponse>(`/api/attendees?${query.toString()}`);
}

export async function getAttendee(id: string): Promise<AttendeeItem> {
  return get<AttendeeItem>(`/api/attendees/${id}`);
}

export async function createAttendee(data: Partial<AttendeeItem>): Promise<AttendeeItem> {
  return post<AttendeeItem>('/api/attendees', data);
}

export async function updateAttendee(id: string, data: Partial<AttendeeItem>): Promise<AttendeeItem> {
  return patch<AttendeeItem>(`/api/attendees/${id}`, data);
}

export async function deleteAttendee(id: string): Promise<{ message: string }> {
  return del<{ message: string }>(`/api/attendees/${id}`);
}

export interface ImportResult {
  imported: number;
  failed: number;
  data: AttendeeItem[];
  errors: Array<{ row: number; error: string; data: Record<string, unknown> }>;
}

export async function importAttendees(eventId: string, file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('eventId', eventId);
  return upload<ImportResult>('/api/attendees/import', formData);
}
