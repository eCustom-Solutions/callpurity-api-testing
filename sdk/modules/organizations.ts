import { AxiosInstance } from 'axios';
import { Organization, CreateOrganizationRequest } from '../types.js';

export const createOrganizationsModule = (client: AxiosInstance) => ({
  async get(accountId: string, organizationId: string): Promise<Organization> {
    const response = await client.get<Organization>(`/accounts/${accountId}/organizations/${organizationId}`);
    return response.data;
  },

  async create(accountId: string, payload: CreateOrganizationRequest): Promise<Organization> {
    const response = await client.post<Organization>(`/accounts/${accountId}/organizations`, payload);
    return response.data;
  },
}); 