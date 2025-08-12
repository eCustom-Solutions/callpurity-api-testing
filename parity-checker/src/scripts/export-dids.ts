#!/usr/bin/env ts-node
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { CallPuritySDK } from '../../../sdk/client.js';
import { loadCallPurityDIDs } from '../loaders/callpurity.js';

dotenv.config();

function parseArgs(argv: string[]) {
  const options: { accountId?: string; orgId?: string; out?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--account-id') options.accountId = argv[++i];
    else if (arg === '--org-id') options.orgId = argv[++i];
    else if (arg === '--out') options.out = argv[++i];
  }
  return options;
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

  await CallPuritySDK.auth.login(email, password);

  const dids = await loadCallPurityDIDs(accountId, orgId);
  const rows: Array<{ number: string; branded_name: string | '' }> = dids.map(d => ({
    number: d.number,
    branded_name: (d.brandedName as string) || ''
  }));

  const outPath = args.out || path.join('reports', 'csv', `dids_${accountId}_${orgId}_${Date.now()}.csv`);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  const header = 'number,branded_name\n';
  const body = rows.map(r => `${r.number},${escapeCsv(r.branded_name)}`).join('\n') + '\n';
  await fs.writeFile(outPath, header + body, 'utf8');
  console.log(`Exported ${rows.length} DIDs to ${path.resolve(outPath)}`);
}

function escapeCsv(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return '"' + val.replace(/"/g, '""') + '"';
  }
  return val;
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});


