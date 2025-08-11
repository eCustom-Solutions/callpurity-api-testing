#!/usr/bin/env ts-node
import { loadCsv } from './loaders/csv.js';
import { loadCallPurityDIDs } from './loaders/callpurity.js';
import { reconcile } from './core/reconcile.js';
import { writeStdout } from './output/stdout.js';
import { writeJson } from './output/json.js';
import path from 'path';
import fs from 'fs/promises';
import { CallPuritySDK } from '../../sdk/client.js';
import type { NumberEntry, ReconcileResult } from './core/types.js';

function parseArgs(argv: string[]) {
  const options: { csvPath?: string; jsonPath?: string; accountId?: string; orgId?: string; apply?: boolean; yes?: boolean; maxAdd?: number; maxDelete?: number } = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--csv') options.csvPath = argv[++i];
    else if (arg === '--json') options.jsonPath = argv[++i];
    else if (arg === '--account-id') options.accountId = argv[++i];
    else if (arg === '--org-id') options.orgId = argv[++i];
    else if (arg === '--apply') options.apply = true;
    else if (arg === '--yes' || arg === '-y') options.yes = true;
    else if (arg === '--max-add') options.maxAdd = parseInt(argv[++i], 10);
    else if (arg === '--max-delete') options.maxDelete = parseInt(argv[++i], 10);
  }
  return options;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const csvPath = args.csvPath ?? await resolveDefaultCsv();

  const sourceList = await loadCsv(csvPath);
  const apiList = await loadCallPurityDIDs(args.accountId, args.orgId);
  const diff = reconcile(sourceList, apiList);
  writeStdout(diff);
  const defaultJson = path.join('reports', 'json', 'diff.sandbox.json');
  const jsonOut = args.jsonPath ?? defaultJson;
  await writeJson(diff, jsonOut);

  if (args.apply) {
    await applyChangesOrExit(diff, args.accountId, args.orgId, {
      requireYes: !args.yes,
      maxAdd: args.maxAdd,
      maxDelete: args.maxDelete,
    });
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

async function resolveDefaultCsv(): Promise<string> {
  const inputDir = path.join('data', 'input');
  const samplesCsv = path.join('data', 'samples', 'sample_numbers.csv');
  try {
    const entries = await fs.readdir(inputDir, { withFileTypes: true });
    const csvFiles = entries
      .filter(e => e.isFile() && e.name.toLowerCase().endsWith('.csv'))
      .map(e => path.join(inputDir, e.name));
    if (csvFiles.length > 0) {
      const stats = await Promise.all(csvFiles.map(async f => ({ f, s: await fs.stat(f) })));
      stats.sort((a, b) => b.s.mtimeMs - a.s.mtimeMs);
      return stats[0].f;
    }
  } catch {
    // fall through to samples
  }
  try {
    await fs.access(samplesCsv);
    return samplesCsv;
  } catch {
    throw new Error(
      'No input CSV found. Place a CSV in data/input/ or pass --csv /absolute/path.csv'
    );
  }
}

async function applyChangesOrExit(
  diff: ReconcileResult,
  accountIdArg?: string,
  orgIdArg?: string,
  opts?: { requireYes?: boolean; maxAdd?: number; maxDelete?: number }
): Promise<void> {
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD;
  const accountId = accountIdArg || process.env.TEST_ACCOUNT_ID;
  const orgId = orgIdArg || process.env.TEST_ORG_ID;
  if (!email || !password || !accountId || !orgId) {
    throw new Error('Missing required configuration for apply: EMAIL, PASSWORD, TEST_ACCOUNT_ID, TEST_ORG_ID');
  }
  const numAdds = diff.toAdd.length;
  const numDeletes = diff.toDelete.length;
  if (opts?.maxAdd !== undefined && numAdds > opts.maxAdd) {
    throw new Error(`Aborting: toAdd=${numAdds} exceeds --max-add=${opts.maxAdd}`);
  }
  if (opts?.maxDelete !== undefined && numDeletes > opts.maxDelete) {
    throw new Error(`Aborting: toDelete=${numDeletes} exceeds --max-delete=${opts.maxDelete}`);
  }
  if (opts?.requireYes) {
    throw new Error('Refusing to apply without --yes. Re-run with --apply --yes (and optional --max-add/--max-delete).');
  }

  await CallPuritySDK.auth.login(email, password);

  // Bulk adds
  if (numAdds > 0) {
    const chunks = chunk(diff.toAdd.map(n => ({ number: n.number, branded_name: n.brandedName })), 100);
    for (const group of chunks) {
      await CallPuritySDK.dids.bulk(accountId, orgId, 'add', group);
    }
    console.log(`Applied adds: ${numAdds}`);
  }

  // Bulk deletes
  if (numDeletes > 0) {
    const chunks = chunk(diff.toDelete.map(n => ({ number: n.number })), 100);
    for (const group of chunks) {
      await CallPuritySDK.dids.bulk(accountId, orgId, 'delete', group);
    }
    console.log(`Applied deletes: ${numDeletes}`);
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

