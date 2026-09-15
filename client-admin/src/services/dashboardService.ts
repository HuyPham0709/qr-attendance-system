import { get } from './api';

export interface DashboardStats {
  organizationName: string;
  totalRegistered: number;
  totalCheckedIn: number;
  attendanceRate: string;
  revokedCount: number;
  recentActivity: Array<{
    name: string;
    time: string;
    gate: string;
    status: string;
  }>;
}

export interface SystemStats {
  totalOrgs: number;
  totalEvents: number;
  pendingOrgs: number;
  lockedOrgs: number;
  activeOrgs: number;
}

export async function getOrganizerStats(): Promise<DashboardStats> {
  return get<DashboardStats>('/api/dashboard/stats');
}

export async function getSystemStats(): Promise<SystemStats> {
  return get<SystemStats>('/api/dashboard/system-stats');
}
