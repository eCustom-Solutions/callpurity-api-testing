# CallPurity SDK

## Overview
A complete TypeScript SDK for the CallPurity API with full authentication, account management, organization management, and DID (Direct Inward Dialing) capabilities.

## Features

### 🔐 Authentication Module
- **Login**: Authenticate with email and password
- **Refresh**: Refresh access tokens using refresh tokens
- **Token Management**: Automatic token storage and retrieval

### 📊 Accounts Module
- **List**: Get all accounts with pagination
- **Get**: Retrieve specific account details by ID

### 🏢 Organizations Module
- **Create**: Create new organizations within accounts
- **Get**: Retrieve organization details

### 📞 DIDs Module
- **List**: Get DIDs with pagination support
- **Get**: Retrieve specific DID details
- **Add**: Add new DIDs with optional branded names
- **Remove**: Delete DIDs
- **Bulk Operations**: Add or delete multiple DIDs at once

### 🛠️ Utilities
- **Validators**: Phone number and EIN validation
- **Type Safety**: Full TypeScript support with comprehensive interfaces
- **Error Handling**: Structured error responses with status codes

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the SDK directory:

```env
EMAIL=your-email@example.com
PASSWORD=your-password
API_BASE_URL=https://api.callpurity.com/latest
# Optional for integration tests:
TEST_ACCOUNT_ID=your-test-account-id
TEST_ORG_ID=your-test-org-id
```

### 🔍 Discovering Test IDs

To automatically discover valid account and organization IDs for testing, use the bootstrap discovery script:

```bash
npm run discover
```

This script will:
1. Authenticate using your credentials
2. List all available accounts
3. Attempt to discover organizations for each account
4. Output copy-pasteable `.env` configuration values

This is particularly useful for setting up integration tests without manually discovering IDs.

## Usage

### Basic Usage

```typescript
import { CallPuritySDK } from './client.js';

// Login to get access token
const authResponse = await CallPuritySDK.auth.login('user@example.com', 'password');
console.log('Access token:', authResponse.access_token);

// List all accounts
const accounts = await CallPuritySDK.accounts.list();
console.log('Accounts:', accounts.data);

// Get specific account
const account = await CallPuritySDK.accounts.get('account-id');
console.log('Account:', account);
```

### DID Management

```typescript
// List DIDs with pagination
const dids = await CallPuritySDK.dids.list('account-id', 'org-id', 1, 20);
console.log('DIDs:', dids.data);

// Add a new DID
const newDid = await CallPuritySDK.dids.add(
  'account-id', 
  'org-id', 
  '+1234567890', 
  'My Branded DID'
);
console.log('New DID:', newDid);

// Bulk add DIDs
await CallPuritySDK.dids.bulk(
  'account-id', 
  'org-id', 
  'add', 
  ['+1234567890', '+0987654321']
);
```

### Organization Management

```typescript
// Create new organization
const org = await CallPuritySDK.organizations.create('account-id', {
  name: 'My Organization'
});
console.log('Organization:', org);

// Get organization details
const organization = await CallPuritySDK.organizations.get('account-id', 'org-id');
console.log('Organization:', organization);
```

## Development

### Running Tests

#### Unit Tests
```bash
npm run test
npm run test:unit
```

#### Integration Tests
```bash
npm run test:int
```
- Integration tests are in `test/integration/` and require real API credentials.
- Results should be logged in `test/TEST_RESULTS.integration.md`.

#### Discovery Script
```bash
npm run discover
```
- Automatically discovers account and organization IDs for testing
- Useful for setting up `.env` configuration for integration tests

### Building

```bash
# Build the project
npm run build

# Run in development mode
npm run dev
```

## API Reference

### Authentication

#### `auth.login(email: string, password: string): Promise<AuthResponse>`
Authenticate with email and password. Returns access token, refresh token, and expiration information.

**Response structure:**
```typescript
{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
}
```

#### `auth.refresh(refreshToken: string): Promise<AuthResponse>`
Refresh the access token using a refresh token.

### Accounts

#### `accounts.list(): Promise<PaginatedResponse<Account>>`
Get all accounts with pagination support.

#### `accounts.get(accountId: string): Promise<Account>`
Get specific account details by ID.

### Organizations

#### `organizations.create(accountId: string, payload: CreateOrganizationRequest): Promise<Organization>`
Create a new organization within an account.

#### `organizations.get(accountId: string, organizationId: string): Promise<Organization>`
Get organization details.

### DIDs

#### `dids.list(accountId: string, orgId: string, page?: number, pageSize?: number): Promise<PaginatedResponse<DID>>`
List DIDs with pagination support.

#### `dids.get(accountId: string, orgId: string, number: string): Promise<DID>`
Get specific DID details.

#### `dids.add(accountId: string, orgId: string, number: string, brandedName?: string): Promise<DID>`
Add a new DID with optional branded name.

#### `dids.remove(accountId: string, orgId: string, number: string): Promise<void>`
Remove a DID.

#### `dids.bulk(accountId: string, orgId: string, action: "add" | "delete", numbers: string[]): Promise<void>`
Perform bulk operations on multiple DIDs.

## Error Handling

The SDK throws structured `ApiError` objects with the following properties:
- `message`: Human-readable error message
- `status`: HTTP status code
- `code`: Optional error code

```typescript
try {
  await CallPuritySDK.auth.login('invalid@email.com', 'wrongpassword');
} catch (error) {
  if (error.status === 401) {
    console.log('Authentication failed:', error.message);
  }
}
```

## Testing

The SDK includes a comprehensive test suite using Vitest. Tests cover:
- Authentication flows
- DID management operations
- API endpoint validation
- Request/response handling
- Error scenarios

See `test/TEST_RESULTS.md` for detailed test results and coverage information.

## License
MIT
