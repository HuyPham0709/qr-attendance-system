import { get, post, patch, del } from './api';

export interface OrganizationItem {
  _id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'pending' | 'locked';
  ownerEmail: string;
  eventsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationsResponse {
  data: OrganizationItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export async function listOrganizations(params?: { page?: number; limit?: number; search?: string }): Promise<OrganizationsResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.search) query.set('search', params.search);
  return get<OrganizationsResponse>(`/api/organizations?${query.toString()}`);
}

export async function getOrganization(id: string): Promise<OrganizationItem> {
  return get<OrganizationItem>(`/api/organizations/${id}`);
}

export async function createOrganization(data: Partial<OrganizationItem>): Promise<OrganizationItem> {
  return post<OrganizationItem>('/api/organizations', data);
}

export async function updateOrganization(id: string, data: Partial<OrganizationItem>): Promise<OrganizationItem> {
  return patch<OrganizationItem>(`/api/organizations/${id}`, data);
}

export async function deleteOrganization(id: string): Promise<{ message: string }> {
  return del<{ message: string }>(`/api/organizations/${id}`);
}
