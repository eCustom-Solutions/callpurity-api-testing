import dotenv from "dotenv";
import { ImapFlow } from "imapflow";

dotenv.config();

console.log("[list-folders] start");

async function main() {
  const host = process.env.EMAIL_HOST || process.env.EMAIL_IMAP_HOST || "imap.gmail.com";
  const port = Number(process.env.EMAIL_PORT || process.env.EMAIL_IMAP_PORT || 993);
  const secure = (process.env.EMAIL_IMAP_SECURE || "true").toLowerCase() !== "false";
  const auth = {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
  };

  if (!auth.user || !auth.pass) {
    console.error("Missing EMAIL_USER or EMAIL_PASS in .env");
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`Connecting to ${host}:${port} secure=${secure} as ${auth.user}`);
  const client = new ImapFlow({ host, port, secure, auth, logger: false });
  try {
    await client.connect();
    // eslint-disable-next-line no-console
    console.log('Connected. Listing mailboxes...');

    const folders: Array<{
      path: string;
      flags: string[];
      specialUse?: string | false;
      listed?: boolean;
      subscribed?: boolean;
      delimiter?: string;
    }> = [];

    const boxes = await client.list();
    for (const box of boxes) {
      folders.push({
        path: box.path,
        flags: Array.isArray(box.flags) ? box.flags : [],
        specialUse: (box as any).specialUse || false,
        listed: box.listed,
        subscribed: box.subscribed,
         delimiter: box.delimiter,
      });
    }

    // Sort: Inbox first, then alphabetically
    folders.sort((a, b) => {
      const ainbox = a.flags?.includes("\\Inbox") || a.path.toLowerCase() === "inbox" ? 0 : 1;
      const binbox = b.flags?.includes("\\Inbox") || b.path.toLowerCase() === "inbox" ? 0 : 1;
      if (ainbox !== binbox) return ainbox - binbox;
      return a.path.localeCompare(b.path);
    });

    // Pretty print
    for (const f of folders) {
      const flags = f.flags?.length ? f.flags.join(",") : "-";
      const special = f.specialUse || "-";
      console.log(`${f.path} | flags: ${flags} | specialUse: ${special}`);
    }

  } finally {
    try { await client.logout(); } catch {}
  }
}

main().catch(err => {
  console.error("Error listing folders:", err?.message || err);
  process.exit(1);
});


