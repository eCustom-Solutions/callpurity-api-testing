import { AxiosInstance } from 'axios';
import { OrganizationDid, OrganizationDidRequest, BulkDidCrudRequest, OrganizationDidListResponse, OrganizationDidResponse } from '../types.js';

export const createDidsModule = (client: AxiosInstance) => ({
  async list(accountId: string, orgId: string, page = 1, pageSize = 20): Promise<OrganizationDidListResponse> {
    const response = await client.get<OrganizationDidListResponse>(`/account/${accountId}/organization/${orgId}/dids`, {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },

  async get(accountId: string, orgId: string, number: string): Promise<OrganizationDidResponse> {
    const response = await client.get<OrganizationDidResponse>(`/account/${accountId}/organization/${orgId}/did/${number}`);
    return response.data;
  },

  async add(accountId: string, orgId: string, number: string, brandedName?: string): Promise<void> {
    const payload: OrganizationDidRequest = { number, branded_name: brandedName || null };
    await client.post(`/account/${accountId}/organization/${orgId}/did`, payload);
  },

  async remove(accountId: string, orgId: string, number: string): Promise<void> {
    await client.delete(`/account/${accountId}/organization/${orgId}/did/${number}`);
  },

  async bulk(accountId: string, orgId: string, action: "add" | "delete", numbers: Array<{number: string, branded_name?: string}>): Promise<void> {
    const payload: BulkDidCrudRequest = { 
      numbers: numbers.map(n => ({ number: n.number, branded_name: n.branded_name || null })),
      organization_id: orgId,
      action 
    };
    await client.post(`/account/${accountId}/organization/${orgId}/did/bulk`, payload);
  },
}); 