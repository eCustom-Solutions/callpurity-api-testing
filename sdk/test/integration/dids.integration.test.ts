import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import CallPuritySDK from '../../client.js';

const num = '+15551231234';
const accountId = process.env.TEST_ACCOUNT_ID!;
const orgId     = process.env.TEST_ORG_ID!;

describe('DIDs (integration)', () => {
  beforeAll(async () =>
    CallPuritySDK.auth.login(process.env.EMAIL!, process.env.PASSWORD!)
  );

  it('adds and removes a DID', async () => {
    await CallPuritySDK.dids.add(accountId, orgId, num, 'Integration DID');
    const dids = await CallPuritySDK.dids.list(accountId, orgId);
    expect(dids.dids.some(d => d.number === num)).toBe(true);

    await CallPuritySDK.dids.remove(accountId, orgId, num);
    const postRemoval = await CallPuritySDK.dids.list(accountId, orgId);
    expect(postRemoval.dids.some(d => d.number === num)).toBe(false);
  });

  afterAll(async () => {
    // ensure cleanup even if assertions fail
    try { await CallPuritySDK.dids.remove(accountId, orgId, num); } catch {}
  });
}); 