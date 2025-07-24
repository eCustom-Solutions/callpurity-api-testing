#!/usr/bin/env ts-node
console.log('[DEBUG] Starting bin/index.ts');
let importStep = 1;
console.log(`[DEBUG] Import step ${importStep++}: before loadCsv`);
import { loadCsv } from '../src/loader/csv.js';
console.log(`[DEBUG] Import step ${importStep++}: before loadCallPurityDIDs`);
import { loadCallPurityDIDs } from '../src/loader/callpurity.js';
console.log(`[DEBUG] Import step ${importStep++}: before reconcile`);
import { reconcile } from '../src/reconcile.js';
console.log(`[DEBUG] Import step ${importStep++}: before writeStdout`);
import { writeStdout } from '../src/writer/stdout.js';
console.log(`[DEBUG] Import step ${importStep++}: after all imports`);

// Parse CLI args
console.log('[DEBUG] Parsing CLI args');
const args = process.argv.slice(2);
let csvPath = '../data/sample_numbers.csv';
const csvFlagIndex = args.indexOf('--csv');
if (csvFlagIndex !== -1 && args[csvFlagIndex + 1]) {
  csvPath = args[csvFlagIndex + 1];
}
console.log(`[DEBUG] Using CSV path: ${csvPath}`);

async function main() {
  try {
    console.log('[DEBUG] Loading CSV...');
    const sourceList = await loadCsv(csvPath);
    console.log(`[DEBUG] Loaded ${sourceList.length} rows from CSV`);
    console.log('[DEBUG] Loading DIDs from CallPurity...');
    const apiList = await loadCallPurityDIDs();
    console.log(`[DEBUG] Loaded ${apiList.length} DIDs from CallPurity`);
    console.log('[DEBUG] Reconciling...');
    const diff = reconcile(sourceList, apiList);
    console.log('[DEBUG] Writing report...');
    writeStdout(diff);
    console.log('[DEBUG] Done.');
  } catch (err) {
    console.error('[DEBUG] Error handler triggered');
    console.error('Error:', err instanceof Error ? err.message : err);
    if (err && err.stack) console.error(err.stack);
    process.exit(1);
  }
}

console.log('[DEBUG] Calling main()');
main(); 