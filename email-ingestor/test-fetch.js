#!/usr/bin/env node
import dotenv from 'dotenv';
import { ImapFlow } from 'imapflow';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

async function testFetch() {
  console.log('Testing email fetch...');
  
  const host = process.env.EMAIL_HOST || 'imap.gmail.com';
  const port = Number(process.env.EMAIL_PORT || 993);
  const user = process.env.EMAIL_USER || '';
  const pass = process.env.EMAIL_PASS || '';
  const inboxLabel = process.env.EMAIL_LABEL_INBOX || 'parity-checker/inbox';
  const processedLabel = process.env.EMAIL_LABEL_PROCESSED || 'parity-checker/processed';
  
  console.log(`Connecting to ${host}:${port} as ${user}`);
  console.log(`Inbox label: ${inboxLabel}`);
  console.log(`Processed label: ${processedLabel}`);
  
  if (!user || !pass) {
    console.error('Missing EMAIL_USER or EMAIL_PASS in .env');
    process.exit(1);
  }
  
  const client = new ImapFlow({ 
    host, 
    port, 
    secure: true, 
    auth: { user, pass }, 
    logger: false 
  });
  
  try {
    await client.connect();
    console.log('Connected successfully!');
    
    // List available mailboxes
    const boxes = await client.list();
    console.log('\nAvailable mailboxes:');
    for (const box of boxes) {
      console.log(`  - ${box.path}`);
    }
    
    // Try to open the inbox label
    try {
      await client.mailboxOpen(inboxLabel);
      console.log(`\nOpened mailbox: ${inboxLabel}`);
      
      // Get message count
      const status = await client.status(inboxLabel, { messages: true });
      console.log(`Messages in ${inboxLabel}: ${status.messages || 0}`);
      
      if (status.messages && status.messages > 0) {
        console.log('\nFetching first message...');
        const lock = await client.getMailboxLock(inboxLabel);
        try {
          for await (const msg of client.fetch('1', { 
            envelope: true, 
            bodyStructure: true,
            source: true 
          })) {
            console.log('Message envelope:', msg.envelope);
            console.log('Message size:', msg.source?.length || 0, 'bytes');
            break; // Just get the first one
          }
        } finally {
          lock.release();
        }
      }
      
    } catch (err) {
      console.log(`Could not open mailbox ${inboxLabel}:`, err.message);
    }
    
  } catch (err) {
    console.error('Connection error:', err);
  } finally {
    try {
      await client.logout();
      console.log('Disconnected');
    } catch {}
  }
}

testFetch().catch(console.error);
