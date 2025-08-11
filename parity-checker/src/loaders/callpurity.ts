import { CallPuritySDK } from '../../../sdk/client.js';
import dotenv from 'dotenv';
import type { NumberEntry } from '../core/types.js';

dotenv.config();

export async function loadCallPurityDIDs(accountId?: string, orgId?: string): Promise<NumberEntry[]> {
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD;
  const acc = accountId || process.env.TEST_ACCOUNT_ID;
  const org = orgId || process.env.TEST_ORG_ID;
  if (!email || !password || !acc || !org) {
    throw new Error('Missing required configuration: EMAIL, PASSWORD, TEST_ACCOUNT_ID, TEST_ORG_ID');
  }
  await CallPuritySDK.auth.login(email, password);
  const pageSize = 100;
  const firstResp = await CallPuritySDK.dids.list(acc, org, 1, pageSize);
  let dids: NumberEntry[] = (firstResp.dids || []).map((d: any) => ({
    number: d.number,
    brandedName: d.branded_name || undefined,
  }));
  const totalPages = firstResp.total_pages || 1;
  for (let page = 2; page <= totalPages; page++) {
    const resp = await CallPuritySDK.dids.list(acc, org, page, pageSize);
    dids = dids.concat(
      (resp.dids || []).map((d: any) => ({ number: d.number, brandedName: d.branded_name || undefined }))
    );
  }
  return dids;
}


