#!/usr/bin/env ts-node
import dotenv from 'dotenv';
import { CallPuritySDK } from '../../../sdk/client.js';

dotenv.config();

function parseArgs(argv: string[]) {
  const options: { numbers?: string[]; accountId?: string; orgId?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--numbers') options.numbers = argv[++i]?.split(',').map(s => s.trim());
    else if (arg === '--account-id') options.accountId = argv[++i];
    else if (arg === '--org-id') options.orgId = argv[++i];
  }
  return options;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD;
  const accountId = args.accountId || process.env.TEST_ACCOUNT_ID;
  const orgId = args.orgId || process.env.TEST_ORG_ID;
  const numbers = args.numbers || [];
  if (!email || !password || !accountId || !orgId || numbers.length === 0) {
    throw new Error('Usage: --numbers n1,n2 [--account-id ...] [--org-id ...] and set EMAIL/PASSWORD env');
  }

  await CallPuritySDK.auth.login(email, password);
  const payload = numbers.map(n => ({ number: n }));
  for (const group of chunk(payload, 100)) {
    await CallPuritySDK.dids.bulk(accountId, orgId, 'delete', group);
  }
  console.log(`Deleted ${numbers.length} DID(s)`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});


