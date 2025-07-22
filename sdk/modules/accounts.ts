import { AxiosInstance } from 'axios';
import { Account, AccountWithOrganizations } from '../types.js';

export const createAccountsModule = (client: AxiosInstance) => ({
  async get(accountId: string): Promise<Account> {
    const response = await client.get<Account>(`/account/${accountId}`);
    return response.data;
  },

  async list(): Promise<AccountWithOrganizations[]> {
    const response = await client.get<AccountWithOrganizations[]>('/accounts');
    return response.data;
  },
}); 