import { describe, it, expect, beforeAll } from 'vitest';
import CallPuritySDK from '../../client.js';

const accountId = process.env.TEST_ACCOUNT_ID!;

describe('Accounts (integration)', () => {
  beforeAll(async () => {
    await CallPuritySDK.auth.login(process.env.EMAIL!, process.env.PASSWORD!);
  });

  it('lists accounts', async () => {
    const accounts = await CallPuritySDK.accounts.list();
    expect(Array.isArray(accounts)).toBe(true);
    expect(accounts.length).toBeGreaterThan(0);
    expect(accounts[0]).toHaveProperty('account_id');
    expect(accounts[0]).toHaveProperty('account_name');
  });

  it('gets account by ID', async () => {
    const account = await CallPuritySDK.accounts.get(accountId);
    expect(account).toHaveProperty('account_name');
    expect(account).toHaveProperty('organizations');
    expect(Array.isArray(account.organizations)).toBe(true);
  });
}); 