import { ImapFlow } from 'imapflow';
import fs from 'fs/promises';
import path from 'path';
// Defer importing mailparser to runtime to avoid ESM interop issues with ts-node/esm
let simpleParserFn: any | null = null;
async function getSimpleParser(): Promise<any> {
  if (!simpleParserFn) {
    const mod: any = await import('mailparser');
    simpleParserFn = mod.simpleParser || mod.default?.simpleParser || mod;
  }
  return simpleParserFn;
}

type FetchResult = {
  messageId: string;
  savedRawPath?: string;
  canonicalCsvPath?: string;
};

export async function fetchLatestAndStage(): Promise<FetchResult | null> {
  // Check required environment variables
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 993);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const inboxLabel = process.env.EMAIL_LABEL_INBOX || 'parity-checker/inbox';
  const processedLabel = process.env.EMAIL_LABEL_PROCESSED || 'parity-checker/processed';
  const allowedSenders = (process.env.EMAIL_SENDER_ALLOWLIST || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const parityRoot = process.env.PARITY_ROOT || path.resolve(process.cwd(), '../parity-checker');

  if (!host || !user || !pass) {
    throw new Error('Missing required environment variables: EMAIL_HOST, EMAIL_USER, EMAIL_PASS');
  }

  console.log(`Connecting to ${host}:${port} as ${user}`);
  console.log(`Inbox label: ${inboxLabel}`);
  console.log(`Processed label: ${processedLabel}`);

  const client = new ImapFlow({ host, port, secure: true, auth: { user, pass }, logger: false });
  await client.connect();
  try {
    // Check if inbox label exists, create if it doesn't
    try {
      await client.mailboxOpen(inboxLabel);
    } catch (err) {
      console.log(`Creating inbox label: ${inboxLabel}`);
      await client.mailboxCreate(inboxLabel);
      await client.mailboxOpen(inboxLabel);
    }

    const lock = await client.getMailboxLock(inboxLabel);
    try {
      // Fetch all messages in the label (read-agnostic), newest first
      const msgs = [] as any[];
      for await (const msg of client.fetch('1:*', { envelope: true, bodyStructure: true, source: true })) {
        msgs.push(msg);
      }
      if (msgs.length === 0) {
        console.log('No messages found in inbox');
        return null;
      }
      
      msgs.sort((a, b) => (b.internalDate as any) - (a.internalDate as any));
      console.log(`Found ${msgs.length} messages, processing newest first`);
      
      // Find the most recent message that matches sender allowlist (if provided)
      const m = msgs.find(mm => {
        const fromAddr = (mm.envelope.from?.[0]?.address || '').toLowerCase();
        const matches = allowedSenders.length ? allowedSenders.includes(fromAddr) : true;
        if (matches) {
          console.log(`Processing message from: ${fromAddr}`);
        }
        return matches;
      });
      
      if (!m) {
        console.log('No messages from allowed senders found');
        return null;
      }

      const messageId = m.envelope.messageId || String(m.uid);
      const tsDate: Date = (m.internalDate as Date) || (m.envelope.date ? new Date(m.envelope.date) : new Date());
      const rawDir = path.join(parityRoot, 'data', 'inbox', 'raw');
      await fs.mkdir(rawDir, { recursive: true });
      const rawPath = path.join(rawDir, `${toTs(tsDate)}_${sanitize(messageId)}.eml`);
      await fs.writeFile(rawPath, m.source);
      console.log(`Saved raw email to: ${rawPath}`);

      // Extract CSV attachment by parsing raw EML to avoid MIME part id ambiguity
      const simpleParser = await getSimpleParser();
      const parsed = await simpleParser(m.source as any);
      const csvAttachment = (parsed as any).attachments?.find((att: any) => {
        const name = (att.filename || '').toLowerCase();
        const isCsvName = name.endsWith('.csv');
        const isCsvMime = (att.contentType || '').toLowerCase() === 'text/csv';
        return isCsvName || isCsvMime;
      });
      
      if (!csvAttachment) {
        console.log('No CSV attachment found in message');
        return { messageId, savedRawPath: rawPath };
      }

      console.log(`Found CSV attachment: ${csvAttachment.filename}`);

      const canonicalDir = path.join(parityRoot, 'data', 'input', 'astrid');
      await fs.mkdir(canonicalDir, { recursive: true });
      const canonPath = path.join(canonicalDir, `${toTs(tsDate)}_${sanitize(messageId)}.csv`);
      const buf = Buffer.isBuffer(csvAttachment.content)
        ? (csvAttachment.content as Buffer)
        : Buffer.from(csvAttachment.content as any);
      await fs.writeFile(canonPath + '.tmp', buf);
      await fs.rename(canonPath + '.tmp', canonPath);
      console.log(`Saved canonical CSV to: ${canonPath}`);

      // Mark as processed (seen + label)
      await client.messageFlagsAdd(m.uid, ['\\Seen']);
      try { 
        await client.mailboxCreate(processedLabel); 
      } catch {}
      await client.messageMove(m.uid, processedLabel);
      console.log(`Moved message to processed label: ${processedLabel}`);

      // Post-move verification: confirm it's under processed label with same Message-ID
      await client.mailboxOpen(processedLabel);
      let verified = false;
      for await (const msg of client.fetch('1:*', { envelope: true })) {
        if ((msg as any).envelope?.messageId === messageId) {
          verified = true;
          break;
        }
      }
      if (!verified) {
        console.warn('Post-move verification: message not found under processed label by Message-ID');
      } else {
        console.log('Post-move verification: message found under processed label');
      }

      return { messageId, savedRawPath: rawPath, canonicalCsvPath: canonPath };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

function flattenParts(part: any, out: any[] = []): any[] {
  if (!part) return out;
  if (part.childNodes && Array.isArray(part.childNodes)) {
    for (const c of part.childNodes) flattenParts(c, out);
  } else if (part.childNodes && part.childNodes.values) {
    for (const c of part.childNodes.values()) flattenParts(c, out);
  }
  out.push(part);
  return out;
}

function sanitize(s: string): string {
  return s.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

function toTs(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function streamToBuffer(stream: AsyncIterable<Buffer> | NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  // @ts-ignore
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}


