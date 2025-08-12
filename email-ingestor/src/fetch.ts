import { ImapFlow } from 'imapflow';
import fs from 'fs/promises';
import path from 'path';

type FetchResult = {
  messageId: string;
  savedRawPath?: string;
  canonicalCsvPath?: string;
};

export async function fetchLatestAndStage(): Promise<FetchResult | null> {
  const host = process.env.EMAIL_HOST!;
  const port = Number(process.env.EMAIL_PORT || 993);
  const user = process.env.EMAIL_USER!;
  const pass = process.env.EMAIL_PASS!;
  const inboxLabel = process.env.EMAIL_LABEL_INBOX!;
  const processedLabel = process.env.EMAIL_LABEL_PROCESSED || 'Processed';
  const allowedSenders = (process.env.EMAIL_SENDER_ALLOWLIST || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const parityRoot = process.env.PARITY_ROOT || path.resolve(process.cwd(), '../parity-checker');

  const client = new ImapFlow({ host, port, secure: true, auth: { user, pass } });
  await client.connect();
  try {
    await client.mailboxOpen(inboxLabel);
    const lock = await client.getMailboxLock(inboxLabel);
    try {
      // Fetch newest unread
      const query = { seen: false };
      const msgs = [] as any[];
      for await (const msg of client.fetch(query, { envelope: true, bodyStructure: true, source: true })) {
        msgs.push(msg);
      }
      if (msgs.length === 0) return null;
      msgs.sort((a, b) => (b.internalDate as any) - (a.internalDate as any));
      const m = msgs[0];
      const from = (m.envelope.from?.[0]?.address || '').toLowerCase();
      if (allowedSenders.length && !allowedSenders.includes(from)) return null;

      const messageId = m.envelope.messageId || String(m.uid);
      const rawDir = path.join(parityRoot, 'data', 'inbox', 'raw');
      await fs.mkdir(rawDir, { recursive: true });
      const rawPath = path.join(rawDir, `${toTs(m.internalDate)}_${sanitize(messageId)}.eml`);
      await fs.writeFile(rawPath, m.source);

      // Extract first CSV attachment if present (simple heuristic)
      const bs: any = m.bodyStructure;
      const parts = flattenParts(bs);
      const csvPart = parts.find(p => (p.disposition?.type || '').toLowerCase() === 'attachment' && String(p.disposition?.params?.filename || '').toLowerCase().endsWith('.csv'));
      if (!csvPart) return { messageId, savedRawPath: rawPath };

      const canonicalDir = path.join(parityRoot, 'data', 'input', 'astrid');
      await fs.mkdir(canonicalDir, { recursive: true });
      const canonPath = path.join(canonicalDir, `${toTs(m.internalDate)}_${sanitize(messageId)}.csv`);
      const { content } = await client.download(m.uid, csvPart.part);
      const buf = await streamToBuffer(content);
      await fs.writeFile(canonPath + '.tmp', buf);
      await fs.rename(canonPath + '.tmp', canonPath);

      // Mark as processed (seen + label)
      await client.messageFlagsAdd(m.uid, ['\\Seen']);
      try { await client.mailboxCreate(processedLabel); } catch {}
      await client.messageMove(m.uid, processedLabel);

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


