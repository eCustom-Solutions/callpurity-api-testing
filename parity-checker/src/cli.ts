#!/usr/bin/env ts-node
import { loadCsv } from './loaders/csv.js';
import { loadCallPurityDIDs } from './loaders/callpurity.js';
import { reconcile } from './core/reconcile.js';
import { writeStdout } from './output/stdout.js';
import { writeJson } from './output/json.js';
import { normalizeToDidNumber } from './utils/normalize.js';
import path from 'path';
import fs from 'fs/promises';
import { CallPuritySDK } from '../../sdk/client.js';
import type { NumberEntry, ReconcileResult } from './core/types.js';

function parseArgs(argv: string[]) {
  const options: { csvPath?: string; jsonPath?: string; accountId?: string; orgId?: string; apply?: boolean; yes?: boolean; maxAdd?: number; maxDelete?: number; verifyBeforeApply?: boolean; skipVerification?: boolean } = {};
  console.log(`🔍 Debug: Parsing arguments: ${JSON.stringify(argv)}`);
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
    else if (arg === '--verify-before-apply') options.verifyBeforeApply = true;
    else if (arg === '--skip-verification') options.skipVerification = true;
  }
  console.log(`🔍 Debug: Parsed options: ${JSON.stringify(options)}`);
  return options;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const csvPath = args.csvPath ?? await resolveDefaultCsv();

  const sourceList = await loadCsv(csvPath);
  console.log(`Loaded CSV rows: ${sourceList.length}`);
  const apiList = await loadCallPurityDIDs(args.accountId, args.orgId);
  console.log(`Fetched DIDs from API: ${apiList.length}`);
  let diff = reconcile(sourceList, apiList);
  // Apply-first flow: skip verification unless explicitly requested
  if (!args.apply || args.verifyBeforeApply) {
    // Second-pass verification using direct GET checks to avoid list staleness
    if (!args.skipVerification) {
      diff = await filterDiffWithDirectChecks(diff, args.accountId, args.orgId);
    } else {
      console.log('⚠️  Skipping second-pass verification (--skip-verification)');
    }
  }
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

    // Post-apply verification: fetch latest API state, recompute diff, and run direct checks
    console.log('--- Post-apply verification ---');
    const apiListAfter = await loadCallPurityDIDs(args.accountId, args.orgId);
    let postDiff = reconcile(sourceList, apiListAfter);
    postDiff = await filterDiffWithDirectChecks(postDiff, args.accountId, args.orgId);
    writeStdout(postDiff);
    const postJson = jsonOut.replace(/\.json$/, '.postverify.json');
    await writeJson(postDiff, postJson);
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
    // Check main input directory
    const entries = await fs.readdir(inputDir, { withFileTypes: true });
    let csvFiles: string[] = [];
    
    // Add files from main input directory
    const mainDirFiles = entries
      .filter(e => e.isFile() && e.name.toLowerCase().endsWith('.csv'))
      .map(e => path.join(inputDir, e.name));
    csvFiles.push(...mainDirFiles);
    
    // Check subdirectories (like astrid/)
    for (const entry of entries) {
      if (entry.isDirectory()) {
        try {
          const subDir = path.join(inputDir, entry.name);
          const subEntries = await fs.readdir(subDir, { withFileTypes: true });
          const subDirFiles = subEntries
            .filter(e => e.isFile() && e.name.toLowerCase().endsWith('.csv'))
            .map(e => path.join(subDir, e.name));
          csvFiles.push(...subDirFiles);
        } catch (err) {
          // Skip subdirectories we can't read
          continue;
        }
      }
    }
    
    if (csvFiles.length > 0) {
      const stats = await Promise.all(csvFiles.map(async f => ({ f, s: await fs.stat(f) })));
      stats.sort((a, b) => b.s.mtimeMs - a.s.mtimeMs);
      console.log(`🔍 CSV Resolution: Found ${csvFiles.length} CSV files, using most recent: ${stats[0].f}`);
      return stats[0].f;
    }
  } catch (err) {
    console.log(`🔍 CSV Resolution: Error reading input directory: ${err}`);
    // fall through to samples
  }
  
  try {
    await fs.access(samplesCsv);
    console.log(`🔍 CSV Resolution: Falling back to sample file: ${samplesCsv}`);
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
  console.log(`🔍 Debug: applyChangesOrExit called with opts: ${JSON.stringify(opts)}`);
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD;
  const accountId = accountIdArg || process.env.TEST_ACCOUNT_ID;
  const orgId = orgIdArg || process.env.TEST_ORG_ID;
  if (!email || !password || !accountId || !orgId) {
    throw new Error('Missing required configuration for apply: EMAIL, PASSWORD, TEST_ACCOUNT_ID, TEST_ORG_ID');
  }
  const numAdds = diff.toAdd.length;
  const numDeletes = diff.toDelete.length;
  console.log(`🔍 Debug: Checking limits: toAdd=${numAdds}, toDelete=${numDeletes}, maxAdd=${opts?.maxAdd}, maxDelete=${opts?.maxDelete}`);
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
    console.log(`Applying adds: total ${numAdds} (chunk size 100)`);
    const chunks = chunk(
      diff.toAdd
        .map(n => ({ 
          number: normalizeToDidNumber(n.number), 
          branded_name: n.brandedName 
        }))
        .filter(item => item.number !== null)
        .map(item => ({ 
          number: item.number as string, 
          branded_name: item.branded_name 
        })),
      100
    );
    for (let i = 0; i < chunks.length; i++) {
      const group = chunks[i];
      console.log(`Bulk add chunk ${i + 1}/${chunks.length} (size ${group.length})...`);
      await CallPuritySDK.dids.bulk(accountId, orgId, 'add', group);
    }
    console.log(`Applied adds: ${numAdds}`);
  }

  // Bulk deletes
  if (numDeletes > 0) {
    console.log(`Applying deletes: total ${numDeletes} (chunk size 100)`);
    const chunks = chunk(
      diff.toDelete
        .map(n => ({ number: normalizeToDidNumber(n.number) }))
        .filter(item => item.number !== null)
        .map(item => ({ number: item.number as string })),
      100
    );
    for (let i = 0; i < chunks.length; i++) {
      const group = chunks[i];
      console.log(`Bulk delete chunk ${i + 1}/${chunks.length} (size ${group.length})...`);
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

async function filterDiffWithDirectChecks(
  diff: ReconcileResult,
  accountIdArg?: string,
  orgIdArg?: string
): Promise<ReconcileResult> {
  const accountId = accountIdArg || process.env.TEST_ACCOUNT_ID!;
  const orgId = orgIdArg || process.env.TEST_ORG_ID!;
  const startTs = Date.now();
  // toAdd: keep only those that truly do not exist (GET returns 404)
  const filteredAdds: typeof diff.toAdd = [];
  if (diff.toAdd.length > 0) console.log(`Verifying toAdd via direct GET: ${diff.toAdd.length}`);
  for (let i = 0; i < diff.toAdd.length; i++) {
    const item = diff.toAdd[i];
    try {
      console.log(`[verify:add] ${i + 1}/${diff.toAdd.length} number=${item.number} → GET`);
      await CallPuritySDK.dids.get(accountId, orgId, item.number);
      // exists -> drop from toAdd
      console.log(`[verify:add] ${i + 1}/${diff.toAdd.length} number=${item.number} exists -> drop`);
    } catch (err: any) {
      if (err?.status === 404) filteredAdds.push(item);
      else filteredAdds.push(item); // conservative: if unknown error, keep for visibility
      console.log(
        `[verify:add] ${i + 1}/${diff.toAdd.length} number=${item.number} ` +
          (err?.status === 404 ? 'missing -> keep' : `error(${err?.status ?? 'unknown'}) -> keep`)
      );
    }
    if ((i + 1) % 10 === 0 || i + 1 === diff.toAdd.length) {
      const elapsed = ((Date.now() - startTs) / 1000).toFixed(1);
      const pct = Math.round(((i + 1) / Math.max(1, diff.toAdd.length)) * 100);
      console.log(`Verified adds: ${i + 1}/${diff.toAdd.length} (${pct}%) elapsed=${elapsed}s`);
    }
  }
  // toDelete: keep only those that truly still exist (GET returns 200)
  const filteredDeletes: typeof diff.toDelete = [];
  if (diff.toDelete.length > 0) console.log(`Verifying toDelete via direct GET: ${diff.toDelete.length}`);
  for (let i = 0; i < diff.toDelete.length; i++) {
    const item = diff.toDelete[i];
    try {
      console.log(`[verify:del] ${i + 1}/${diff.toDelete.length} number=${item.number} → GET`);
      await CallPuritySDK.dids.get(accountId, orgId, item.number);
      filteredDeletes.push(item); // exists -> keep for delete
      console.log(`[verify:del] ${i + 1}/${diff.toDelete.length} number=${item.number} exists -> keep`);
    } catch (err: any) {
      if (err?.status === 404) {
        // already gone -> drop
        console.log(`[verify:del] ${i + 1}/${diff.toDelete.length} number=${item.number} missing -> drop`);
      } else {
        filteredDeletes.push(item); // conservative on unknown error
        console.log(
          `[verify:del] ${i + 1}/${diff.toDelete.length} number=${item.number} error(${err?.status ?? 'unknown'}) -> keep`
        );
      }
    }
    if ((i + 1) % 10 === 0 || i + 1 === diff.toDelete.length) {
      const elapsed = ((Date.now() - startTs) / 1000).toFixed(1);
      const pct = Math.round(((i + 1) / Math.max(1, diff.toDelete.length)) * 100);
      console.log(`Verified deletes: ${i + 1}/${diff.toDelete.length} (${pct}%) elapsed=${elapsed}s`);
    }
  }
  return { ...diff, toAdd: filteredAdds, toDelete: filteredDeletes };
}

