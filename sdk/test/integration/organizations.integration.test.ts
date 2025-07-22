import { describe, it, expect, beforeAll } from 'vitest';
import CallPuritySDK from '../../client.js';

const accountId = process.env.TEST_ACCOUNT_ID!;
const orgId = process.env.TEST_ORG_ID!;

describe('Organizations (integration)', () => {
  beforeAll(async () => {
    await CallPuritySDK.auth.login(process.env.EMAIL!, process.env.PASSWORD!);
  });

  it('gets organization by ID', async () => {
    const org = await CallPuritySDK.organizations.get(accountId, orgId);
    expect(org).toHaveProperty('id', orgId);
  });

  it('creates a new organization', async () => {
    const name = 'Integration Org ' + Date.now();
    const created = await CallPuritySDK.organizations.create(accountId, { name });
    expect(created).toHaveProperty('name', name);
    expect(created).toHaveProperty('id');
  });
}); 