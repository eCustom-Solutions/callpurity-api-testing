import { AxiosInstance } from 'axios';
import { Account, PaginatedResponse } from '../types.js';

export const createAccountsModule = (client: AxiosInstance) => ({
  async get(accountId: string): Promise<Account> {
    const response = await client.get<Account>(`/accounts/${accountId}`);
    return response.data;
  },

  async list(): Promise<PaginatedResponse<Account>> {
    const response = await client.get<PaginatedResponse<Account>>('/accounts');
    return response.data;
  },
}); 