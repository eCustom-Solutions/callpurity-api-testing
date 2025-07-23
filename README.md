# CallPurity API Testing

This project contains a complete, production-ready CallPurity SDK for API testing and development.

## Project Structure

- `sdk/` - The complete CallPurity SDK implementation
  - `modules/` - SDK modules (auth, accounts, organizations, dids)
  - `scripts/` - Utility scripts
    - `bootstrap-discovery.ts` - Auto-discover account/org IDs for testing
  - `test/` - Test suite
    - `unit/` - Unit tests for all modules
    - `integration/` - Integration tests (real API calls)
    - `TEST_RESULTS.unit.md` - Unit test results
    - `TEST_RESULTS.integration.md` - Integration test results
  - `utils/` - Utility functions and validators
  - `client.ts` - Main HTTP client with interceptors
  - `config.ts` - Configuration and token management
  - `types.ts` - TypeScript interfaces and types
  - `index.ts` - SDK entry point with example usage
- `parity-checker/` - CLI tool for comparing CSV phone numbers with CallPurity DIDs
  - `index.ts` - Main entry point
  - `reconcile.ts` - Reconciliation logic
  - `loader/` - Data loading modules
    - `csv.ts` - CSV file parsing and normalization
    - `callpurity.ts` - CallPurity API integration via SDK
  - `writer/` - Output formatting
    - `stdout.ts` - Human-readable report generation
  - `package.json` - Dependencies and scripts
  - `sample_numbers.csv` - Sample data for testing
- `prompts/` - Development prompts and documentation
  - `01_environment-setup.txt` - Environment setup instructions
  - `02_sdk-generation.txt` - SDK generation specifications
  - `04_parity_checker_mvp.txt` - Parity checker CLI tool specification

## Features

### 🔐 Authentication
- Login with email/password
- Token refresh functionality
- Automatic token storage and management

### 📊 Account Management
- List all accounts
- Get account details by ID

### 🏢 Organization Management
- Create new organizations
- Get organization details

### 📞 DID Management
- List DIDs with pagination
- Add/remove individual DIDs
- Bulk operations (add/delete multiple DIDs)
- Branded name support

### 🧪 Testing
- Comprehensive unit test suite with Vitest
- Mocked HTTP requests for reliable testing
- 100% test coverage for core functionality
- **Integration tests** for real API flows (see below)

### 🔄 Parity Checker CLI
- Compare CSV phone numbers with CallPurity DIDs
- Generate dry-run reports of adds/deletes/mismatches
- Modular architecture with separate loaders and writers
- Sample data included for testing

## Getting Started

1. Navigate to the SDK directory: `cd sdk`
2. Install dependencies: `npm install`
3. Set up environment variables in `.env`:
   ```
   EMAIL=your-email@example.com
   PASSWORD=your-password
   API_BASE_URL=https://api.callpurity.com/latest
   # Optional for integration tests:
   TEST_ACCOUNT_ID=your-test-account-id
   TEST_ORG_ID=your-test-org-id
   ```
4. Run unit tests: `npm run test` or `npm run test:unit`
5. Run integration tests: `npm run test:int`
6. **Discover test IDs**: `npm run discover` (auto-finds account/org IDs for testing)
7. Build the project: `npm run build`
8. Run the development server: `npm run dev`

## Quick Example

```typescript
import { CallPuritySDK } from './client.js';

// Login
await CallPuritySDK.auth.login('user@example.com', 'password');

// List accounts
const accounts = await CallPuritySDK.accounts.list();

// Add a DID
await CallPuritySDK.dids.add('account-id', 'org-id', '+1234567890', 'My DID');
```

## Parity Checker Usage

```bash
cd parity-checker
npm install
npm start -- --csv sample_numbers.csv --account-id YOUR_ACCOUNT_ID --org-id YOUR_ORG_ID
```

## Integration Testing

- Integration tests are located in `sdk/test/integration/`.
- They require real API credentials and may modify sandbox data.
- Results and notes should be logged in `sdk/test/TEST_RESULTS.integration.md` after each run.
- See `.env.example` for required environment variables.

---
