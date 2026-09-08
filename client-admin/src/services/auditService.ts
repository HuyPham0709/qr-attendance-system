import { get } from './api';

export interface AuditLogItem {
  _id: string;
  eventId: string;
  eventName: string;
  attendeeId: string;
  attendeeName: string;
  attendeeEmail?: string;
  result: 'success' | 'duplicate' | 'invalid_qr' | 'expired_qr' | 'wrong_geo' | 'revoked';
  scannedBy?: string;
  scannedByName?: string;
  scannedByEmail?: string;
  gate?: string;
  deviceId?: string;
  clientTimestamp?: string;
  createdAt: string;
}

export interface AuditLogsResponse {
  data: AuditLogItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export async function listAuditLogs(params?: {
  page?: number;
  limit?: number;
  eventId?: string;
  result?: string;
  attendeeId?: string;
}): Promise<AuditLogsResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.eventId) query.set('eventId', params.eventId);
  if (params?.result) query.set('result', params.result);
  if (params?.attendeeId) query.set('attendeeId', params.attendeeId);
  return get<AuditLogsResponse>(`/api/checkin/logs?${query.toString()}`);
}
