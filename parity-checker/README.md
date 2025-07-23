# Parity Checker

A CLI tool to perform a dry-run reconciliation between a source-of-truth CSV list of phone numbers and the current list of DIDs stored in CallPurity via the SDK.

## Features
- Reads a CSV file of phone numbers (source of truth)
- Fetches DIDs from CallPurity using the SDK
- Computes which numbers need to be added, deleted, or have mismatched branded names
- Prints a human-readable dry-run report (no API mutations)

## Usage

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the dry-run reconciliation:**
   ```bash
   npm run sync:dry -- --csv ./sample_numbers.csv
   ```
   - If `--csv` is not provided, defaults to `./sample_numbers.csv` if it exists.

## CLI Flags
- `--csv <path>`: Path to the source CSV file (default: `./sample_numbers.csv`)
- `--json <path>`: (Planned) Output diff result as JSON
- `--apply`: (Planned) Apply changes via API (not implemented in MVP)

## CSV Schema
- Header row expected: `number,branded_name,client,account,group`
- Only `number` and `branded_name` are used; extra columns are ignored

## Environment Variables
- `EMAIL`, `PASSWORD`, `API_BASE_URL`, `ACCOUNT_ID`, `ORG_ID` must be set in your `.env` file

## Example
```bash
npm run sync:dry -- --csv ./sample_numbers.csv
```

---

*This tool is for dry-run reconciliation only. No API mutations are performed in the MVP.* 