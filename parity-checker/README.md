# Parity Checker

A CLI tool to perform a dry-run reconciliation between a source-of-truth CSV list of phone numbers and the current list of DIDs stored in CallPurity via the SDK.

## Features
- Reads a CSV file of phone numbers (source of truth)
- Fetches DIDs from CallPurity using the SDK with pagination support
- Computes which numbers need to be added, deleted, or have mismatched branded names
- Prints a human-readable dry-run report (no API mutations)

## Implementation Status
- ✅ CSV Loader: Reads and validates phone numbers from CSV files
- ✅ CallPurity Loader: Fetches DIDs via SDK with pagination
- ✅ Reconciliation Logic: Pure function to compute differences, tested with sample data
- 🔄 Report Writer: Human-readable output formatting
- 🔄 CLI Integration: Wire up all components

## Reconciliation Logic
- The reconciliation step is a **pure function**: it takes two lists (CSV and API) and returns what to add, delete, or flag as mismatched.
- It does **not** touch the API or perform any side effects—making it easy to test and reason about.
- The logic is validated with sample test cases in the codebase.

## Usage

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file with:
   ```
   EMAIL=your-email@example.com
   PASSWORD=your-password
   API_BASE_URL=https://api.callpurity.com/latest
   TEST_ACCOUNT_ID=your-test-account-id
   TEST_ORG_ID=your-test-org-id
   ```

3. **Run the dry-run reconciliation:**
   ```bash
   npm run sync:dry -- --csv ./sample_numbers.csv
   ```
   - If `--csv` is not provided, defaults to `./sample_numbers.csv` if it exists.

## CLI Flags
- `--csv <path>`: Path to the source CSV file (default: `./sample_numbers.csv`)
- `--json <path>`: (Planned) Output diff result as JSON
- `--apply`: (Planned) Apply changes via API (not implemented in MVP)

## CSV Schema
- **Sample CSV format:** `Phone Number,Created At,Companies - Account → Name`
- **Standard format:** `number,branded_name,client,account,group`
- The loader maps `Phone Number` to `number` and supports both formats
- Only `number` and `branded_name` are used; extra columns are ignored
- Invalid phone numbers are skipped with validation using the SDK's `isValidPhoneNumber`

## Environment Variables
- `EMAIL`: Your CallPurity login email
- `PASSWORD`: Your CallPurity login password  
- `API_BASE_URL`: CallPurity API base URL (defaults to production)
- `TEST_ACCOUNT_ID`: Account ID for testing/development
- `TEST_ORG_ID`: Organization ID for testing/development

## Example
```bash
npm run sync:dry -- --csv ./sample_numbers.csv
```

---

*This tool is for dry-run reconciliation only. No API mutations are performed in the MVP.* 