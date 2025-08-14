#!/usr/bin/env ts-node
import dotenv from 'dotenv';
import path from 'path';
import { fetchLatestAndStage } from './fetch.js';
import { runParityDry, runParityApply } from './orchestrate.js';
import { ImapFlow } from 'imapflow';

dotenv.config();

async function main() {
  const cmd = process.argv[2] || 'fetch';
  
  try {
    if (cmd === 'fetch') {
      console.log('Fetching latest email and staging CSV...');
      const result = await fetchLatestAndStage();
      if (result) {
        console.log('✅ Fetch successful:', result);
      } else {
        console.log('ℹ️  No new emails to process');
      }
    } else if (cmd === 'dry') {
      console.log('Fetching and running dry-run...');
      const result = await fetchLatestAndStage();
      if (result?.canonicalCsvPath) {
        await runParityDry(result.canonicalCsvPath);
      } else {
        console.log('ℹ️  No CSV to process for dry-run');
      }
    } else if (cmd === 'weekly') {
      console.log('Fetching and running weekly apply...');
      const result = await fetchLatestAndStage();
      if (result?.canonicalCsvPath) {
        await runParityApply(result.canonicalCsvPath);
      } else {
        console.log('ℹ️  No CSV to process for weekly apply');
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
      
      console.log(`Listing folders for ${user} on ${host}:${port}...`);
      const client = new ImapFlow({ host, port, secure: true, auth: { user, pass }, logger: false });
      await client.connect();
      
      try {
        const folders: Array<{ path: string; flags: string[]; specialUse?: string | false }> = [];
        const boxes = await client.list();
        for (const box of boxes) {
          folders.push({
            path: box.path,
            flags: Array.isArray(box.flags) ? box.flags : [],
            specialUse: (box as any).specialUse || false,
          });
        }
        folders.sort((a, b) => a.path.localeCompare(b.path));
        
        console.log('\nAvailable mailboxes:');
        for (const f of folders) {
          const flags = f.flags?.length ? f.flags.join(',') : '-';
          const special = f.specialUse || '-';
          console.log(`${f.path} | flags: ${flags} | specialUse: ${special}`);
        }
      } finally {
        try { 
          await client.logout(); 
        } catch {}
      }
    } else {
      console.error('Unknown command. Use: fetch | dry | weekly | folders');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      if (error.stack) {
        console.error('Stack:', error.stack);
      }
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
});


