import { CallPuritySDK } from '../../sdk/client.js';
import dotenv from 'dotenv';
dotenv.config();

export interface DidRow {
  number: string;
  brandedName?: string;
}

export async function loadCallPurityDIDs(): Promise<DidRow[]> {
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD;
  const accountId = process.env.TEST_ACCOUNT_ID;
  const orgId = process.env.TEST_ORG_ID;
  if (!email || !password || !accountId || !orgId) {
    throw new Error('Missing required environment variables: EMAIL, PASSWORD, TEST_ACCOUNT_ID, TEST_ORG_ID');
  }
  await CallPuritySDK.auth.login(email, password);
  const pageSize = 100;
  // Fetch first page to get total_pages
  const firstResp = await CallPuritySDK.dids.list(accountId, orgId, 1, pageSize);
  let dids: DidRow[] = (firstResp.dids || []).map((d: any) => ({
    number: d.number,
    brandedName: d.branded_name || undefined,
  }));
  const totalPages = firstResp.total_pages || 1;
  for (let page = 2; page <= totalPages; page++) {
    const resp = await CallPuritySDK.dids.list(accountId, orgId, page, pageSize);
    dids = dids.concat(
      (resp.dids || []).map((d: any) => ({
        number: d.number,
        brandedName: d.branded_name || undefined,
      }))
    );
  }
  return dids;
} 