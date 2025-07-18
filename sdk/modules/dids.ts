import { AxiosInstance } from 'axios';
import { DID, AddDIDRequest, BulkDIDRequest, PaginatedResponse } from '../types.js';

export const createDidsModule = (client: AxiosInstance) => ({
  async list(accountId: string, orgId: string, page = 1, pageSize = 20): Promise<PaginatedResponse<DID>> {
    const response = await client.get<PaginatedResponse<DID>>(`/accounts/${accountId}/organizations/${orgId}/dids`, {
      params: { page, pageSize },
    });
    return response.data;
  },

  async get(accountId: string, orgId: string, number: string): Promise<DID> {
    const response = await client.get<DID>(`/accounts/${accountId}/organizations/${orgId}/dids/${number}`);
    return response.data;
  },

  async add(accountId: string, orgId: string, number: string, brandedName?: string): Promise<DID> {
    const payload: AddDIDRequest = { number };
    if (brandedName) {
      payload.brandedName = brandedName;
    }
    
    const response = await client.post<DID>(`/accounts/${accountId}/organizations/${orgId}/dids`, payload);
    return response.data;
  },

  async remove(accountId: string, orgId: string, number: string): Promise<void> {
    await client.delete(`/accounts/${accountId}/organizations/${orgId}/dids/${number}`);
  },

  async bulk(accountId: string, orgId: string, action: "add" | "delete", numbers: string[]): Promise<void> {
    const payload: BulkDIDRequest = { action, numbers };
    await client.post(`/accounts/${accountId}/organizations/${orgId}/dids/bulk`, payload);
  },
}); 