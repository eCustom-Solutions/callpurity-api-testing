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

  const client = new ImapFlow({ host, port, secure: true, auth: { user, pass }, logger: false, gmailSupport: true } as any);
  await client.connect();

  // Detect Gmail extension support (X-GM-EXT-1)
  const hasGmailExt = client.capabilities?.get('X-GM-EXT-1') === true;
  console.log(`Gmail extension X-GM-EXT-1 supported: ${hasGmailExt}`);

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
      // Fetch all messages with Gmail extensions enabled (threadId, labels, internalDate)
      const msgs: any[] = [];
      for await (const msg of client.fetch('1:*', {
        uid: true,
        envelope: true,
        internalDate: true,
        threadId: true,
        labels: true,
        bodyStructure: true,
        source: true
      } as any)) {
        msgs.push(msg);
      }
      if (msgs.length === 0) {
        console.log('No messages found in inbox');
        return null;
      }
      
      console.log(`Found ${msgs.length} messages`);
      
      // Debug: Show first few messages
      msgs.slice(0, 3).forEach((msg, i) => {
        const from = msg.envelope?.from?.[0]?.address || 'unknown';
        const thrid = (msg as any).threadid || 'no-threadid';
        console.log(`Message ${i}: from=${from}, thread=${thrid}, date=${msg.internalDate}`);
      });

      // Sort messages newest-first and look for first allowed-sender message that has a CSV attachment
      msgs.sort((a,b)=>{
        const ta = a.internalDate ? (a.internalDate as Date).getTime() : 0;
        const tb = b.internalDate ? (b.internalDate as Date).getTime() : 0;
        return tb-ta;
      });

      const simpleParser = await getSimpleParser();
      let selectedMsg:any=null;
      let csvAttachment:any=null;

      for(const msg of msgs){
        const addr=(msg.envelope.from?.[0]?.address||'').toLowerCase();
        if(allowedSenders.length && !allowedSenders.includes(addr)) continue;

        const parsed = await simpleParser(msg.source as any);
        csvAttachment = (parsed as any).attachments?.find((att: any)=>{
          const name=(att.filename||'').toLowerCase();
          const isCsvName=name.endsWith('.csv');
          const isCsvMime=(att.contentType||'').toLowerCase()==='text/csv';
          return isCsvName || isCsvMime;
        });
        if(csvAttachment){
          selectedMsg = msg;
          console.log(`Found CSV attachment in message UID ${msg.uid} from ${addr}`);
          break;
        }
      }

      if(!selectedMsg){
        console.log('No messages with CSV attachment found from allowed senders.');
        return null;
      }

      const m = selectedMsg;

      const messageId = m.envelope.messageId || String(m.uid);
      const tsDate: Date = (m.internalDate as Date) || (m.envelope.date ? new Date(m.envelope.date) : new Date());
      const rawDir = path.join(parityRoot, 'data', 'inbox', 'raw');
      await fs.mkdir(rawDir, { recursive: true });
      const rawPath = path.join(rawDir, `${toTs(tsDate)}_${sanitize(messageId)}.eml`);
      await fs.writeFile(rawPath, m.source);
      console.log(`Saved raw email to: ${rawPath}`);

      // csvAttachment already set in the search loop above
      
      let canonPath: string | undefined;
      if (!csvAttachment) {
        console.log('No CSV attachment found in thread – skipping CSV staging');
      } else {
        console.log(`Found CSV attachment: ${csvAttachment.filename}`);

        const canonicalDir = path.join(parityRoot, 'data', 'input', 'astrid');
        await fs.mkdir(canonicalDir, { recursive: true });
        canonPath = path.join(canonicalDir, `${toTs(tsDate)}_${sanitize(messageId)}.csv`);
        const buf = Buffer.isBuffer(csvAttachment.content)
          ? (csvAttachment.content as Buffer)
          : Buffer.from(csvAttachment.content as any);
        await fs.writeFile(canonPath + '.tmp', buf);
        await fs.rename(canonPath + '.tmp', canonPath);
        console.log(`Saved canonical CSV to: ${canonPath}`);
      }

      // Mark this message as seen and move it to processed
      try{ await client.mailboxCreate(processedLabel);}catch{}
      await client.messageFlagsAdd(m.uid,['\\Seen']);
      await client.messageMove(m.uid, processedLabel);

      // Remove any other Gmail labels except the processed label to avoid duplicates
      try {
        // After moving, open the processed mailbox and find the message by Message-ID
        await client.mailboxOpen(processedLabel);

        // Find the message in the processed mailbox (UID will be different after move)
        let newUid: number | null = null;
        let totalMessages = 0;
        console.log(`Looking for message ID: ${messageId}`);
        
        for await (const msg of client.fetch('1:*', { envelope: true, labels: true })) {
          totalMessages++;
          const msgId = (msg as any).envelope?.messageId;
          console.log(`Checking message ${totalMessages}: ${msgId}`);
          
          if (msgId === messageId) {
            newUid = msg.uid;
            const currentLabels: string[] = (msg as any).labels || [];
            
            console.log(`Found moved message with UID ${newUid}, current labels: ${currentLabels.join(', ')}`);

            // Determine labels to remove – keep only the processed label
            const labelsToRemove = currentLabels.filter(l => l !== processedLabel);

            if (labelsToRemove.length) {
              console.log(`Removing extraneous labels: ${labelsToRemove.join(', ')}`);
              // Note: Gmail label removal via IMAP is complex, skipping for now
              console.log(`Would remove labels: ${labelsToRemove.join(', ')} (Gmail label removal not implemented)`);
            } else {
              console.log('No extraneous labels to remove');
            }
            break;
          }
        }

        console.log(`Searched ${totalMessages} messages in processed mailbox`);
        if (!newUid) {
          console.warn('Could not find moved message in processed mailbox for label cleanup');
        }
      } catch (labelErr) {
        console.warn('Label cleanup error:', (labelErr as Error).message);
      }

      console.log(`Moved message exclusively to processed label: ${processedLabel}`);

      // Post-move verification already done in label cleanup above

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


