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
  const seen = new Set<string>();
  let dids: NumberEntry[] = (firstResp.dids || [])
    .map((d: any) => ({
      number: normalizeToDidNumber(d.number),
      brandedName: d.branded_name || undefined,
    }))
    .filter((d: { number: string | null }) => !!d.number && !seen.has(d.number as string) && seen.add(d.number as string))
    .map((d: { number: string | null; brandedName?: string }) => ({ number: d.number as string, brandedName: d.brandedName }));
  const totalPages = firstResp.total_pages || 1;
  for (let page = 2; page <= totalPages; page++) {
    const resp = await CallPuritySDK.dids.list(acc, org, page, pageSize);
    const pageDids = (resp.dids || [])
      .map((d: any) => ({ number: normalizeToDidNumber(d.number), brandedName: d.branded_name || undefined }))
      .filter((d: { number: string | null }) => !!d.number && !seen.has(d.number as string) && seen.add(d.number as string))
      .map((d: { number: string | null; brandedName?: string }) => ({ number: d.number as string, brandedName: d.brandedName }));
    dids = dids.concat(pageDids as NumberEntry[]);
  }
  return dids;
}

function normalizeToDidNumber(input: string): string | null {
  if (!input) return null;
  const digits = String(input).replace(/\D/g, '');
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  return /^[2-9]\d{9}$/.test(ten) ? ten : null;
}


