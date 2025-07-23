#!/usr/bin/env ts-node
import { loadCsv } from './loader/csv.js';
import { loadCallPurityDIDs } from './loader/callpurity.js';
import { reconcile } from './reconcile.js';
import { writeStdout } from './writer/stdout.js';

// Parse CLI args
const args = process.argv.slice(2);
let csvPath = './sample_numbers.csv';
const csvFlagIndex = args.indexOf('--csv');
if (csvFlagIndex !== -1 && args[csvFlagIndex + 1]) {
  csvPath = args[csvFlagIndex + 1];
}

async function main() {
  // 1. Load CSV
  const sourceList = await loadCsv(csvPath);
  // 2. Load DIDs from CallPurity
  const apiList = await loadCallPurityDIDs();
  // 3. Reconcile
  const diff = reconcile(sourceList, apiList);
  // 4. Write report
  writeStdout(diff);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
}); 