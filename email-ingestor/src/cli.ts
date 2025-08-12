#!/usr/bin/env ts-node
import dotenv from 'dotenv';
import path from 'path';
import { fetchLatestAndStage } from './fetch.js';
import { runParityDry, runParityApply } from './orchestrate.js';
import { ImapFlow } from 'imapflow';

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
  } else if (cmd === 'folders') {
    const host = process.env.EMAIL_HOST || 'imap.gmail.com';
    const port = Number(process.env.EMAIL_PORT || 993);
    const user = process.env.EMAIL_USER || '';
    const pass = process.env.EMAIL_PASS || '';
    if (!user || !pass) {
      console.error('Missing EMAIL_USER or EMAIL_PASS in .env');
      process.exit(1);
    }
    const client = new ImapFlow({ host, port, secure: true, auth: { user, pass }, logger: false });
    await client.connect();
    try {
      const folders: Array<{ path: string; flags: string[]; specialUse?: string | false }>=[];
      const boxes = await client.list();
      for (const box of boxes) {
        folders.push({
          path: box.path,
          flags: Array.isArray(box.flags) ? box.flags : [],
          specialUse: (box as any).specialUse || false,
        });
      }
      folders.sort((a,b)=>a.path.localeCompare(b.path));
      for (const f of folders) {
        const flags = f.flags?.length ? f.flags.join(',') : '-';
        const special = f.specialUse || '-';
        console.log(`${f.path} | flags: ${flags} | specialUse: ${special}`);
      }
    } finally {
      try { await client.logout(); } catch {}
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


