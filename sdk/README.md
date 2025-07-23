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
console.log('Accounts:', accounts);

// Get specific account
const account = await CallPuritySDK.accounts.get('account-id');
console.log('Account:', account);
```

### DID Management

```typescript
// List DIDs with pagination
const dids = await CallPuritySDK.dids.list('account-id', 'org-id', 1, 20);
console.log('DIDs:', dids.dids);

// Add a new DID
const newDid = await CallPuritySDK.dids.add(
  'account-id', 
  'org-id', 
  '5551231234', // valid 10-digit number
  'My Branded DID'
);
console.log('New DID:', newDid);

// Bulk add DIDs
await CallPuritySDK.dids.bulk(
  'account-id', 
  'org-id', 
  'add', 
  [
    { number: '5551231234', branded_name: 'First DID' },
    { number: '5559876543', branded_name: 'Second DID' }
  ]
);
```

### Organization Management

```typescript
// Create new organization
const org = await CallPuritySDK.organizations.create('account-id', {
  business_info: {
    legal_company_name: "My Organization LLC",
    dba: "My Org",
    ein: "123456789",
    business_phone_number: "5551234567",
    employee_count: 10,
    website: "https://myorg.example.com",
    quantity_of_phone_numbers: 5,
    address: "123 Main St",
    city: "My City",
    state: "CA",
    zip_code: "90210"
  },
  contact_info: {
    first_name: "John",
    last_name: "Doe",
    email: "john@myorg.example.com",
    phone: "5559876543"
  },
  calling_behavior: {
    telecom_provider: "My Provider",
    own_dids: false,
    dialing_opt_in_data: true,
    using_opt_in_data_provider: false,
    tcpa_dnc_violation: null,
    calls_per_day: 100,
    max_redial_attempts_daily_per_lead: 3,
    max_redial_attempts_weekly_per_lead: 5
  }
});
console.log('Organization ID:', org.organization_id);

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
- Results should be logged in `test/TEST_RESULTS.integration.md` (integration) and `test/TEST_RESULTS.unit.md` (unit).

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

#### `accounts.list(): Promise<AccountWithOrganizations[]>`
Get all accounts with their organizations.

#### `accounts.get(accountId: string): Promise<Account>`
Get specific account details by ID.

### Organizations

#### `organizations.create(accountId: string, payload: CreateOrganizationRequest): Promise<CreateOrganizationResponse>`
Create a new organization within an account.

#### `organizations.get(accountId: string, organizationId: string): Promise<OrganizationDetailResponse>`
Get organization details.

### DIDs

#### `dids.list(accountId: string, orgId: string, page?: number, pageSize?: number): Promise<OrganizationDidListResponse>`
List DIDs with pagination support.

#### `dids.get(accountId: string, orgId: string, number: string): Promise<OrganizationDidResponse>`
Get specific DID details.

#### `dids.add(accountId: string, orgId: string, number: string, brandedName?: string): Promise<void>`
Add a new DID with optional branded name.

#### `dids.remove(accountId: string, orgId: string, number: string): Promise<void>`
Remove a DID.

#### `dids.bulk(accountId: string, orgId: string, action: "add" | "delete", numbers: Array<{number: string, branded_name?: string}>): Promise<void>`
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

See `test/TEST_RESULTS.unit.md` and `test/TEST_RESULTS.integration.md` for detailed test results and coverage information.

## License
MIT
