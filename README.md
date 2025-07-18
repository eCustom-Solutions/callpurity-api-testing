# CallPurity API Testing

This project contains a complete, production-ready CallPurity SDK for API testing and development.

## Project Structure

- `sdk/` - The complete CallPurity SDK implementation
  - `modules/` - SDK modules (auth, accounts, organizations, dids)
  - `test/` - Comprehensive unit test suite
  - `utils/` - Utility functions and validators
  - `client.ts` - Main HTTP client with interceptors
  - `config.ts` - Configuration and token management
  - `types.ts` - TypeScript interfaces and types
  - `index.ts` - SDK entry point with example usage
- `prompts/` - Development prompts and documentation
  - `01_environment-setup.txt` - Environment setup instructions
  - `02_sdk-generation.txt` - SDK generation specifications

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

## Getting Started

1. Navigate to the SDK directory: `cd sdk`
2. Install dependencies: `npm install`
3. Set up environment variables in `.env`:
   ```
   EMAIL=your-email@example.com
   PASSWORD=your-password
   API_BASE_URL=https://api.callpurity.com/v1
   ```
4. Run tests: `npm test`
5. Build the project: `npm run build`
6. Run the development server: `npm run dev`

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
