import { download, get, upload } from './api';

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

export async function downloadAuditReport(params: {
  format: 'xlsx' | 'pdf';
  eventId?: string;
  result?: string;
  search?: string;
  from?: string;
  to?: string;
}): Promise<Blob> {
  const query = new URLSearchParams({ format: params.format });
  if (params.eventId) query.set('eventId', params.eventId);
  if (params.result) query.set('result', params.result);
  if (params.search) query.set('search', params.search);
  if (params.from) query.set('from', `${params.from}T00:00:00`);
  if (params.to) query.set('to', `${params.to}T23:59:59`);
  return download(`/api/reports/audit?${query.toString()}`);
}

export async function importAuditLogs(file: File): Promise<{ imported: number; failed: number }> {
  const formData = new FormData();
  formData.append('file', file);
  return upload<{ imported: number; failed: number }>('/api/reports/audit/import', formData);
}
