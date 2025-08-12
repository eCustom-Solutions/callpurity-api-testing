#!/usr/bin/env ts-node
import dotenv from 'dotenv';
import { CallPuritySDK } from '../../../sdk/client.js';
import { loadCsv } from '../loaders/csv.js';

dotenv.config();

function parseArgs(argv: string[]) {
  const options: { numbers?: string[]; csvPath?: string; accountId?: string; orgId?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--numbers') options.numbers = argv[++i]?.split(',').map(s => s.trim());
    else if (arg === '--csv') options.csvPath = argv[++i];
    else if (arg === '--account-id') options.accountId = argv[++i];
    else if (arg === '--org-id') options.orgId = argv[++i];
  }
  return options;
}

async function resolveNumbers(opts: { numbers?: string[]; csvPath?: string }): Promise<string[]> {
  if (opts.numbers && opts.numbers.length > 0) return opts.numbers;
  if (opts.csvPath) {
    const rows = await loadCsv(opts.csvPath);
    return rows.map(r => r.number);
  }
  throw new Error('Provide --numbers comma-separated or --csv path');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD;
  const accountId = args.accountId || process.env.TEST_ACCOUNT_ID;
  const orgId = args.orgId || process.env.TEST_ORG_ID;
  if (!email || !password || !accountId || !orgId) {
    throw new Error('Missing EMAIL, PASSWORD, TEST_ACCOUNT_ID, TEST_ORG_ID');
  }
  const numbers = await resolveNumbers({ numbers: args.numbers, csvPath: args.csvPath });

  await CallPuritySDK.auth.login(email, password);

  const results: Array<{ number: string; exists: boolean; error?: string }> = [];
  for (const n of numbers) {
    try {
      await CallPuritySDK.dids.get(accountId, orgId, n);
      results.push({ number: n, exists: true });
    } catch (err: any) {
      if (err?.status === 404) {
        results.push({ number: n, exists: false });
      } else {
        results.push({ number: n, exists: false, error: err?.message || String(err) });
      }
    }
  }

  console.table(results);
  const missing = results.filter(r => !r.exists);
  if (missing.length > 0) {
    process.exitCode = 2;
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});


