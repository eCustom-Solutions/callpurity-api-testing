import { describe, it, expect, beforeAll } from 'vitest';
import CallPuritySDK from '../../client.js';

const accountId = process.env.TEST_ACCOUNT_ID!;

describe('Accounts (integration)', () => {
  beforeAll(async () => {
    await CallPuritySDK.auth.login(process.env.EMAIL!, process.env.PASSWORD!);
  });

  it('lists accounts', async () => {
    const accounts = await CallPuritySDK.accounts.list();
    expect(Array.isArray(accounts.data)).toBe(true);
    expect(accounts.data.length).toBeGreaterThan(0);
  });

  it('gets account by ID', async () => {
    const account = await CallPuritySDK.accounts.get(accountId);
    expect(account).toHaveProperty('id', accountId);
  });
}); 