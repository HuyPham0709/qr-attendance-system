import { get, post, patch, del } from './api';

export interface EventItem {
  _id: string;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  startAt: string;
  endAt: string;
  location: {
    address: string;
    geo?: { lat: number; lng: number };
    geoFenceRadiusMeters?: number;
  };
  settings: {
    allowMultipleCheckIn: boolean;
    requireGeoFence: boolean;
    qrTokenTTLMinutes: number;
    checkInWindowMinutes: number;
  };
  gates: Array<{ name: string; code?: string }>;
  stats: {
    totalRegistered: number;
    totalCheckedIn: number;
  };
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventsResponse {
  data: EventItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export async function listEvents(params?: { page?: number; limit?: number; status?: string }): Promise<EventsResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.status) query.set('status', params.status);
  return get<EventsResponse>(`/api/events?${query.toString()}`);
}

export async function getEventById(id: string): Promise<EventItem> {
  return get<EventItem>(`/api/events/${id}`);
}

export async function createEvent(data: Partial<EventItem>): Promise<EventItem> {
  return post<EventItem>('/api/events', data);
}

export async function updateEvent(id: string, data: Partial<EventItem>): Promise<EventItem> {
  return patch<EventItem>(`/api/events/${id}`, data);
}

export async function deleteEvent(id: string): Promise<{ message: string }> {
  return del<{ message: string }>(`/api/events/${id}`);
}
