// src/hooks/useEventData.ts
//
// Thay thế cho việc import EVENT/TICKET_TYPES tĩnh — gọi thật GET /api/events/:id
// và GET /api/ticket-types?eventId=... khi app mount, expose loading/error để
// App.tsx render skeleton hoặc thông báo lỗi thay vì crash trắng trang.

import { useEffect, useState, useCallback } from 'react';
import { getEvent, getTicketTypes, ApiError } from '../lib/api';
import type { ApiEvent, ApiTicketType } from '../types';

interface EventDataState {
  event: ApiEvent | null;
  ticketTypes: ApiTicketType[];
  loading: boolean;
  error: string | null;
}

export function useEventData(eventId: string) {
  const [state, setState] = useState<EventDataState>({
    event: null,
    ticketTypes: [],
    loading: true,
    error: null
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [event, ticketTypesRes] = await Promise.all([
        getEvent(eventId),
        getTicketTypes(eventId)
      ]);
      setState({ event, ticketTypes: ticketTypesRes.data, loading: false, error: null });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Không tải được thông tin sự kiện.';
      setState({ event: null, ticketTypes: [], loading: false, error: message });
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
