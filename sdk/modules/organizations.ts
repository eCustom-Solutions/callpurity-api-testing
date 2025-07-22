import { AxiosInstance } from 'axios';
import { Organization, CreateOrganizationRequest, CreateOrganizationResponse, OrganizationDetailResponse } from '../types.js';

export const createOrganizationsModule = (client: AxiosInstance) => ({
  async get(accountId: string, organizationId: string): Promise<OrganizationDetailResponse> {
    const response = await client.get<OrganizationDetailResponse>(`/account/${accountId}/organization/${organizationId}`);
    return response.data;
  },

  async create(accountId: string, payload: CreateOrganizationRequest): Promise<CreateOrganizationResponse> {
    const response = await client.post<CreateOrganizationResponse>(`/account/${accountId}/organization/`, payload);
    return response.data;
  },
}); 