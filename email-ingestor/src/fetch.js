import { ImapFlow } from 'imapflow';
import fs from 'fs/promises';
import path from 'path';
export async function fetchLatestAndStage() {
    const host = process.env.EMAIL_HOST;
    const port = Number(process.env.EMAIL_PORT || 993);
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const inboxLabel = process.env.EMAIL_LABEL_INBOX;
    const processedLabel = process.env.EMAIL_LABEL_PROCESSED || 'Processed';
    const allowedSenders = (process.env.EMAIL_SENDER_ALLOWLIST || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const parityRoot = process.env.PARITY_ROOT || path.resolve(process.cwd(), '../parity-checker');
    const client = new ImapFlow({ host, port, secure: true, auth: { user, pass } });
    await client.connect();
    try {
        await client.mailboxOpen(inboxLabel);
        const lock = await client.getMailboxLock(inboxLabel);
        try {
            // Fetch all messages in the label (read-agnostic), newest first
            const msgs = [];
            for await (const msg of client.fetch('1:*', { envelope: true, bodyStructure: true, source: true })) {
                msgs.push(msg);
            }
            if (msgs.length === 0)
                return null;
            msgs.sort((a, b) => b.internalDate - a.internalDate);
            // Find the most recent message that matches sender allowlist (if provided)
            const m = msgs.find(mm => {
                const fromAddr = (mm.envelope.from?.[0]?.address || '').toLowerCase();
                return allowedSenders.length ? allowedSenders.includes(fromAddr) : true;
            });
            if (!m)
                return null;
            const messageId = m.envelope.messageId || String(m.uid);
            const tsDate = m.internalDate || (m.envelope.date ? new Date(m.envelope.date) : new Date());
            const rawDir = path.join(parityRoot, 'data', 'inbox', 'raw');
            await fs.mkdir(rawDir, { recursive: true });
            const rawPath = path.join(rawDir, `${toTs(tsDate)}_${sanitize(messageId)}.eml`);
            await fs.writeFile(rawPath, m.source);
            console.log(`Saved raw email to: ${rawPath}`);
            // Extract first CSV attachment if present (robust heuristic)
            const bs = m.bodyStructure;
            const parts = flattenParts(bs);
            const getFilename = (p) => String(p?.disposition?.params?.filename ||
                p?.dispositionParameters?.filename ||
                p?.params?.name ||
                p?.parameters?.name ||
                '').toLowerCase();
            const isCsvPart = (p) => {
                const filename = getFilename(p);
                const disp = String(p?.disposition?.type || p?.disposition || '').toLowerCase();
                const type = String(p?.type || '').toLowerCase();
                const subtype = String(p?.subtype || '').toLowerCase();
                const isAttachment = disp.includes('attachment');
                const isCsvFilename = filename.endsWith('.csv');
                const isCsvMime = type === 'text' && subtype === 'csv';
                return (isAttachment && isCsvFilename) || isCsvMime || isCsvFilename;
            };
            const csvPart = parts.find(isCsvPart);
            if (!csvPart)
                return { messageId, savedRawPath: rawPath };
            const canonicalDir = path.join(parityRoot, 'data', 'input', 'astrid');
            await fs.mkdir(canonicalDir, { recursive: true });
            const canonPath = path.join(canonicalDir, `${toTs(tsDate)}_${sanitize(messageId)}.csv`);
            const partId = csvPart.part || csvPart.partId || csvPart.id || undefined;
            if (!partId) {
                throw new Error('CSV part found but missing part identifier');
            }
            const { content } = await client.download(m.uid, partId);
            const buf = await streamToBuffer(content);
            await fs.writeFile(canonPath + '.tmp', buf);
            await fs.rename(canonPath + '.tmp', canonPath);
            console.log(`Saved canonical CSV to: ${canonPath}`);
            // Mark as processed (seen + label)
            await client.messageFlagsAdd(m.uid, ['\\Seen']);
            try {
                await client.mailboxCreate(processedLabel);
            }
            catch { }
            await client.messageMove(m.uid, processedLabel);
            console.log(`Moved message to processed label: ${processedLabel}`);
            // Post-move verification: confirm it's under processed label with same Message-ID
            await client.mailboxOpen(processedLabel);
            let verified = false;
            for await (const msg of client.fetch('1:*', { envelope: true })) {
                if (msg.envelope?.messageId === messageId) {
                    verified = true;
                    break;
                }
            }
            if (!verified) {
                console.warn('Post-move verification: message not found under processed label by Message-ID');
            }
            else {
                console.log('Post-move verification: message found under processed label');
            }
            return { messageId, savedRawPath: rawPath, canonicalCsvPath: canonPath };
        }
        finally {
            lock.release();
        }
    }
    finally {
        await client.logout();
    }
}
function flattenParts(part, out = []) {
    if (!part)
        return out;
    if (part.childNodes && Array.isArray(part.childNodes)) {
        for (const c of part.childNodes)
            flattenParts(c, out);
    }
    else if (part.childNodes && part.childNodes.values) {
        for (const c of part.childNodes.values())
            flattenParts(c, out);
    }
    out.push(part);
    return out;
}
function sanitize(s) {
    return s.replace(/[^a-zA-Z0-9_.-]/g, '_');
}
function toTs(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
async function streamToBuffer(stream) {
    const chunks = [];
    // @ts-ignore
    for await (const chunk of stream)
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return Buffer.concat(chunks);
}
