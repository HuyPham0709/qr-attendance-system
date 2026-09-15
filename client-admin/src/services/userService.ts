import { get, post, patch, del } from './api';

export interface UserItem {
  _id: string;
  organizationId: string;
  name: string;
  email: string;
  role: 'super_admin' | 'organizer' | 'scanner_staff';
  assignedEvents: string[];
  isActive: boolean;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  data: UserItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export async function listUsers(params?: { page?: number; limit?: number; role?: string; search?: string }): Promise<UsersResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.role) query.set('role', params.role);
  if (params?.search) query.set('search', params.search);
  return get<UsersResponse>(`/api/users?${query.toString()}`);
}

export async function getUser(id: string): Promise<UserItem> {
  return get<UserItem>(`/api/users/${id}`);
}

export async function createUser(data: Partial<UserItem> & { password: string }): Promise<UserItem> {
  return post<UserItem>('/api/users', data);
}

export async function updateUser(id: string, data: Partial<UserItem>): Promise<UserItem> {
  return patch<UserItem>(`/api/users/${id}`, data);
}

export async function deleteUser(id: string): Promise<{ message: string }> {
  return del<{ message: string }>(`/api/users/${id}`);
}

export async function assignEvents(userId: string, eventIds: string[]): Promise<UserItem> {
  return patch<UserItem>(`/api/users/${userId}/assign-events`, { eventIds });
}
