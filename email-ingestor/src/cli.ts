#!/usr/bin/env ts-node
import dotenv from 'dotenv';
import path from 'path';
import { fetchLatestAndStage } from './fetch.js';
import { runParityDry, runParityApply } from './orchestrate.js';

dotenv.config();

async function main() {
  const cmd = process.argv[2] || 'fetch';
  if (cmd === 'fetch') {
    const result = await fetchLatestAndStage();
    console.log('Fetched:', result);
  } else if (cmd === 'dry') {
    const result = await fetchLatestAndStage();
    if (result?.canonicalCsvPath) {
      await runParityDry(result.canonicalCsvPath);
    }
  } else if (cmd === 'weekly') {
    const result = await fetchLatestAndStage();
    if (result?.canonicalCsvPath) {
      await runParityApply(result.canonicalCsvPath);
    } else {
      console.log('No new CSV staged; skipping apply.');
    }
  } else {
    console.error('Unknown command. Use: fetch | dry | weekly');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});


