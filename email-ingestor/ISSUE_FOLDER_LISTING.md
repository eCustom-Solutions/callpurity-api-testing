## IMAP folder listing: what went wrong and the fixes

### Context
We added a convenience script to print all available IMAP mailboxes so we can pick the right label for the ingestor. While wiring it up, several issues surfaced with our initial implementation and environment assumptions.

### Symptoms observed
- Running the folder list scripts crashed with a cryptic Node printout like:
  - `[Object: null prototype]` followed by an uncaught exception trace.
- TypeScript compile errors:
  - “Type 'Promise<ListResponse[]>' must have a '[Symbol.asyncIterator]()' method…”
  - “Type 'true' is not assignable to type 'false | Logger | undefined'.”
  - “Property 'exists' does not exist on type 'ListResponse'.”

### Root causes
- API mismatch in `imapflow.list()` usage:
  - We used `for await (const box of client.list())`, assuming it returns an async iterator. In our `imapflow` version, `list()` returns a `Promise<ListResponse[]>`. Attempting to iterate it as an async iterator throws at runtime.
- Wrong logger type:
  - We set `logger: true`. The `imapflow` client expects `false` (to disable) or a Logger object. Passing `true` fails type-checking and is incorrect.
- Non-existent `exists` field:
  - We tried to print per-mailbox message counts via `box.exists`. `ListResponse` does not include live message counts. To get counts, you must call `client.status(path, { messages: true })` or `mailboxOpen(path)` and read `exists`, which is an extra network round-trip per folder.
- Environment variable naming drift:
  - Some files referenced `EMAIL_HOST`/`EMAIL_PORT`, others `EMAIL_IMAP_HOST`/`EMAIL_IMAP_PORT`. This inconsistency can cause connections to aim at the wrong host/port or fail when only one naming scheme is set.

### Fixes applied
- Read-agnostic fetching (related context):
  - We updated `src/fetch.ts` to stop filtering by unread status; it now fetches all messages in the configured mailbox, newest first, while still honoring the sender allowlist. Also added a safe timestamp fallback for filenames.
- Folder listing scripts:
  - Switched to `const boxes = await client.list();` then iterate the array instead of `for await`.
  - Set `logger: false` for the client to satisfy types and reduce noise.
  - Removed reliance on `box.exists`. We now print path/flags/specialUse and can optionally add counts later.
  - Added a `folders` command in `src/cli.ts` and a standalone `src/list-folders.ts` for listing.
- Env normalization:
  - Folder list now reads `EMAIL_HOST`/`EMAIL_PORT` (and falls back to `EMAIL_IMAP_HOST`/`EMAIL_IMAP_PORT` if present). Goal is to standardize on `EMAIL_HOST`/`EMAIL_PORT` across the module.

### Remaining work / recommendations
- If message counts are desired:
  - Implement optional counts behind a flag (e.g., `--counts`) that calls `client.status(path, { messages: true })` per folder. This adds extra round-trips, so keep it off by default.
- Standardize environment variables:
  - Migrate all code to use `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_LABEL` (and `EMAIL_LABEL_PROCESSED`). Keep compatibility shims temporarily.
- Hardening:
  - Add unit/integration tests for the folder lister and the fetcher with a mock IMAP server.
  - Improve error reporting (turn cryptic errors into actionable messages).

### How to run
1. Ensure `.env` contains:
   - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`
2. List folders via either:
   - `npm run folders` (CLI command)
   - `npm run list:folders` (standalone script)

Both print lines like:
```
<path> | flags: <flags> | specialUse: <special> 
```

If you want counts, we can add a follow-up that queries `status()` per folder.

## Upstream-validated briefing (ImapFlow docs/issues)

### What blew up (symptoms)
- Cryptic Node crash during folder listing.
- TypeScript errors around:
  - Treating `client.list()` like an async iterator.
  - Passing `logger: true`.
  - Accessing `box.exists`.

### Root causes (validated against upstream)
1. `client.list()` is not async-iterable
   - ImapFlow `list()` returns a `Promise<Array<ListResponse>>`, not an async generator. You must `await client.list()` and loop the returned array. The official docs show array iteration, not `for await`.
2. Wrong `logger` type
   - The `logger` option accepts `false` (to disable) or a logger object. There is no `true` sentinel. Passing `true` fails types and intent. Docs and issues show `logger: false` as the accepted pattern.
3. Mailbox counts don’t come from `ListResponse`
   - `list()` returns `ListResponse` (path/flags/etc.); message counts are not included. To get counts use `client.status(path, { messages: true })` or open the mailbox and read `.exists` from the returned `MailboxObject`.
4. Bonus context: fetch semantics
   - `client.fetch()` is an async generator (so `for await` is correct), but `list()` is not. Docs distinguish the two.

### Fixes to keep (match upstream guidance)
- Switch to array iteration
  ```ts
  const boxes = await client.list();
  for (const box of boxes) {
    // use box.path, box.flags, (box as any).specialUse
  }
  ```
- Set `logger: false`
- Drop `box.exists`; if counts are required, call:
  ```ts
  const { messages } = await client.status(box.path, { messages: true });
  // or: const mbox = await client.mailboxOpen(box.path); console.log(mbox.exists);
  ```

### Recommended hardening
- Counts behind a flag (default off; each `status()` is a network round-trip)
- Environment normalization: prefer `EMAIL_HOST/PORT/USER/PASS` with IMAP-prefixed fallbacks (temporary)
- Minimal tests for `list()` shape and env resolution using a mock server
- Gmail reminder: labels/folders map via IMAP; rely on `list()` -> `path` and don’t assume counts without `status()`/`mailboxOpen()`

### Ready-to-paste PR summary

Title: Fix IMAP folder listing: correct list() usage, disable logger, remove nonexistent fields

Summary:
- Replace `for await (const box of client.list())` with:
  ```ts
  const boxes = await client.list();
  for (const box of boxes) { /* ... */ }
  ```
  ImapFlow `list()` returns `Promise<Array<ListResponse>>` (per docs).
- Set `logger: false` (docs: object | boolean; `false` disables logging).
- Remove `box.exists`; `ListResponse` has no counts. If counts are needed, call:
  ```ts
  const { messages } = await client.status(path, { messages: true });
  ```
  or read `mailbox.exists` from `mailboxOpen()` result.
- Normalize env variables: prefer `EMAIL_HOST/PORT`, keep IMAP-prefixed fallbacks.

Why: Prevent runtime crash and TS errors; align with upstream API; avoid unnecessary IMAP round-trips.

---

### What we tried, with results (direct quotes)

This section captures the actual commands run and their outputs while implementing and debugging the folder listing.

- Initial attempt to run the standalone folder lister:

  Command:
  ```bash
  npm run list:folders
  ```

  Output (excerpt):
  ```
  (node:65128) ExperimentalWarning: `--experimental-loader` may be removed in the future;
  node:internal/modules/run_main:122
      triggerUncaughtException(
      ^
  [Object: null prototype] {
    [Symbol(nodejs.util.inspect.custom)]: [Function: [nodejs.util.inspect.custom]]
  }
  Node.js v22.15.0
  ```

  Interpretation: our code crashed before printing any folders. The `[Object: null prototype]` suggests an unhandled promise rejection or thrown non-Error value during iteration.

- Tried running directly with `node` to confirm it wasn’t an npm script quirk:

  Command:
  ```bash
  node --loader ts-node/esm src/list-folders.ts
  ```

  Output (same as above):
  ```
  node:internal/modules/run_main:122
      triggerUncaughtException(
      ^
  [Object: null prototype] {
    [Symbol(nodejs.util.inspect.custom)]: [Function: [nodejs.util.inspect.custom]]
  }
  ```

- Compiled TypeScript to see type-level issues:

  Command:
  ```bash
  ./node_modules/.bin/tsc -p .
  ```

  Output (first pass):
  ```
  src/cli.ts(40,31): error TS2504: Type 'Promise<ListResponse[]>' must have a '[Symbol.asyncIterator]()' method that returns an async iterator.
  src/list-folders.ts(24,59): error TS2322: Type 'true' is not assignable to type 'false | Logger | undefined'.
  src/list-folders.ts(40,29): error TS2504: Type 'Promise<ListResponse[]>' must have a '[Symbol.asyncIterator]()' method that returns an async iterator.
  ```

  Interpretation: confirms two issues: using `for await (const box of client.list())` incorrectly, and passing `logger: true`.

- After switching to array iteration and `logger: false`, more TS errors surfaced due to using a non-existent `exists` field:

  Output:
  ```
  src/cli.ts(45,23): error TS2339: Property 'exists' does not exist on type 'ListResponse'.
  src/list-folders.ts(49,21): error TS2339: Property 'exists' does not exist on type 'ListResponse'.
  ```

  Fix: removed `exists` usage (would require a `status()` call per mailbox).

- Sanity check that ts-node loader worked in this environment:

  Command:
  ```bash
  node --loader ts-node/esm -e "import { ImapFlow } from 'imapflow'; console.log('imapflow ok')"
  ```

  Output:
  ```
  imapflow ok
  ```

- Related fetcher error encountered earlier (while making fetching read-agnostic):

  Output (excerpt):
  ```
  Error: TypeError: Cannot read properties of undefined (reading 'getFullYear')
      at toTs (file:///.../email-ingestor/src/fetch.ts:106:17)
      at fetchLatestAndStage (file:///.../email-ingestor/src/fetch.ts:37:50)
  ```

  Fix: derive a safe timestamp from `internalDate || envelope.date || new Date()`.

### Current status
- `src/list-folders.ts` and `cli.ts folders` now use `await client.list()` correctly and no longer refer to `exists`.
- Client logger is disabled (`logger: false`), resolving the type issue.
- Environment keys normalized in the lister: prefers `EMAIL_HOST`/`EMAIL_PORT` (falls back to IMAP variants).
- The fetcher is read-agnostic and timestamp-safe.

### Verification steps
1. Ensure `.env` has valid `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`.
2. Run either:
   - `npm run folders`
   - `npm run list:folders`
3. You should see output like:
   ```
   INBOX | flags: \\Inbox | specialUse: -
   Astrid/Parity | flags: - | specialUse: -
   parity-checker/inbox | flags: - | specialUse: -
   ...
   ```



