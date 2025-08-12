# Email Ingestor – TODO

Purpose: Automatically fetch Astrid’s weekly CSV email, validate/normalize phone numbers, and stage a canonical CSV for the parity checker.

## MVP Scope
- Fetch latest unread email from a specific Gmail label (e.g., `Astrid/Parity`) and sender allowlist.
- Download the CSV attachment; write atomically to disk.
- Normalize numbers to 10-digit DIDs, de-duplicate, and validate non-empty.
- Save canonical CSV to `parity-checker/data/input/astrid/<YYYYMMDD_HHmmss>_<messageId>.csv` plus sidecar metadata.
- Mark email as Processed (label) and optionally mark as read on success.

## Idempotency & Tracking
- Use Gmail `messageId` and attachment checksum to avoid reprocessing.
- Local manifest file (JSON) to log processed messageId → saved file and sha256.
- Only process unread + not-Processed emails.

## Config (.env / config.json)
- `EMAIL_HOST/PORT/USER/PASS` (or Gmail API creds if using OAuth).
- `EMAIL_LABEL_INBOX`, `EMAIL_LABEL_PROCESSED`.
- `EMAIL_SENDER_ALLOWLIST` (comma-separated).
- Optional subject regex and attachment extension filter.

## CLI Commands
- `email:fetch`: fetch + stage latest valid CSV; write canonical CSV and metadata.
- `email:dry`: fetch + run parity-checker dry-run on the new file.
- `email:weekly`: fetch → apply parity with caps → post-verify → export.

## Error Handling
- If no email by Monday cutoff (e.g., 10:00), alert (email/Slack) and skip apply.
- If CSV invalid/empty/multiple attachments → quarantine to `data/inbox/rejected/` and alert.

## File Layout
- `email-ingestor/`
  - `src/` (fetch.ts, validate.ts, manifest.ts, cli.ts)
  - Writes to:
    - Raw: `parity-checker/data/inbox/raw/`
    - Canonical: `parity-checker/data/input/astrid/`
    - Rejected: `parity-checker/data/inbox/rejected/`

## Tech Choices
- Start with IMAP/SMTP (less OAuth friction). Consider Gmail API later.
- Reuse parity-checker normalization rules.

## Open Questions
- SLA for email arrival (what cutoff to alert?).
- Final alerting destination (email vs Slack webhook).
- Whether to automatically run apply when a new CSV arrives mid-week or only on Mondays.

## Next Steps
- Scaffold `src/` with IMAP fetch and local manifest.
- Implement normalization + dedupe identical to parity-checker.
- Add scripts and docs to run locally and via cron.
