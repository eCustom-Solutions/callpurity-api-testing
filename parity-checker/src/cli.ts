#!/usr/bin/env ts-node
import { loadCsv } from './loaders/csv.js';
import { loadCallPurityDIDs } from './loaders/callpurity.js';
import { reconcile } from './core/reconcile.js';
import { writeStdout } from './output/stdout.js';
import { writeJson } from './output/json.js';
import path from 'path';
import fs from 'fs/promises';

function parseArgs(argv: string[]) {
  const options: { csvPath?: string; jsonPath?: string; accountId?: string; orgId?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--csv') options.csvPath = argv[++i];
    else if (arg === '--json') options.jsonPath = argv[++i];
    else if (arg === '--account-id') options.accountId = argv[++i];
    else if (arg === '--org-id') options.orgId = argv[++i];
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

