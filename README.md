# CallPurity API Testing & Automation

A comprehensive toolkit for testing, validating, and automating CallPurity API operations, including DID (Direct Inward Dialing) management and synchronization.

## 🏗️ Architecture

This repository is organized as a **monorepo** with the following modules:

- **📧 Email Ingestor** - Automatically fetches CSV attachments from emails and stages them for processing
- **🔍 Parity Checker** - Compares source-of-truth CSVs with API state and synchronizes differences
- **🛠️ SDK** - TypeScript client library for CallPurity API operations
- **🎯 Root Orchestrator** - Coordinates end-to-end workflows between all modules

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 8+
- CallPurity API credentials
- Gmail account with app-specific password (for email ingestion)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd callpurity-api-testing

# Install dependencies for all modules
npm install

# Set up environment variables (see Configuration section)
cp email-ingestor/.env.example email-ingestor/.env
cp parity-checker/.env.example parity-checker/.env
```

## 🎯 Root Orchestrator (Recommended)

The **root orchestrator** provides a unified interface for all workflows:

```bash
# Core workflow commands
npm run fetch      # Fetch latest email + stage CSV
npm run dry        # Fetch + run parity checker dry-run  
npm run weekly     # Complete workflow: fetch + dry-run + apply + export
npm run status     # Show orchestrator and module status
npm run help       # Show available commands

# Direct module access
npm run parity:dry    # Direct parity checker dry-run
npm run parity:apply  # Direct parity checker apply
npm run sdk:test      # Run SDK tests
```

### Complete Workflow Example

```bash
# Run the complete automation pipeline
npm run weekly

# This will:
# 1. Fetch CSV from Astrid's email
# 2. Run dry-run to see what would change
# 3. Apply changes to the API (with safety caps)
# 4. Export final state for verification
```

## 📧 Email Ingestor

Automatically fetches CSV attachments from Gmail and stages them for processing.

### Features
- **IMAP Integration** - Connects to Gmail with app-specific passwords
- **Smart Filtering** - Only processes emails from allowed senders
- **CSV Extraction** - Automatically detects and extracts CSV attachments
- **File Staging** - Organizes files in structured directories
- **Email Processing** - Marks emails as read and moves to processed labels

### Configuration
```bash
# email-ingestor/.env
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_LABEL_INBOX=parity-checker/inbox
EMAIL_LABEL_PROCESSED=parity-checker/processed
EMAIL_SENDER_ALLOWLIST=astrid@company.com
PARITY_ROOT=../parity-checker
```

### Usage
```bash
cd email-ingestor
npm run fetch      # Fetch and stage latest email
npm run dry        # Fetch + run parity checker dry-run
npm run weekly     # Fetch + run parity checker apply
npm run folders    # List available Gmail labels
```

## 🔍 Parity Checker

Compares source-of-truth CSVs with current API state and synchronizes differences.

### Features
- **Smart Comparison** - Identifies additions, deletions, and mismatches
- **Safety Caps** - Configurable limits for add/delete operations
- **Second-Pass Verification** - Direct API checks to avoid stale data
- **Bulk Operations** - Efficient API calls for large changes
- **Post-Verification** - Confirms changes were applied correctly

### Configuration
```bash
# parity-checker/.env
EMAIL=your-email@company.com
PASSWORD=your-password
API_BASE_URL=https://api-lab.callpurity.com/latest
TEST_ACCOUNT_ID=acc-your-account-id
TEST_ORG_ID=org-your-org-id
```

### Usage
```bash
cd parity-checker
npm run sync:dry      # Show what would change (dry-run)
npm run sync:apply    # Apply changes to API
npm run export:dids   # Export current API state
npm run verify:dids   # Verify specific DIDs exist
```

## 🛠️ SDK

TypeScript client library for CallPurity API operations.

### Features
- **Authentication** - Handles login and token management
- **DID Management** - List, get, add, remove, and bulk operations
- **Account & Organization** - Management operations
- **Type Safety** - Full TypeScript support

### Usage
```typescript
import { CallPuritySDK } from './sdk/client.js';

// Authenticate
await CallPuritySDK.auth.login(email, password);

// List DIDs
const dids = await CallPuritySDK.dids.list(accountId, orgId, page, pageSize);

// Add DID
await CallPuritySDK.dids.add(accountId, orgId, phoneNumber, brandedName);
```

## 🔄 Complete Workflow

### 1. Email Ingestion
```bash
npm run fetch
# Fetches CSV from Gmail, stages in parity-checker/data/input/astrid/
```

### 2. Dry-Run Analysis
```bash
npm run dry
# Shows what changes would be made without applying them
```

### 3. Apply Changes
```bash
npm run weekly
# Complete workflow: fetch + dry-run + apply + export
```

### 4. Verification
```bash
npm run parity:export
# Exports final API state for verification
```

## 🛡️ Safety Features

- **Confirmation Required** - Apply operations require `--yes` flag
- **Safety Caps** - Default max 2000 additions/deletions per run
- **Second-Pass Verification** - Direct API checks to avoid stale data
- **Post-Apply Verification** - Confirms all changes were applied
- **Error Handling** - Comprehensive error handling and logging

## 📁 File Structure

```
callpurity-api-testing/
├── orchestrator.js          # Root orchestrator
├── package.json            # Root package with orchestrator scripts
├── email-ingestor/         # Email processing module
│   ├── src/
│   │   ├── cli.ts         # Email CLI
│   │   ├── fetch.ts       # Email fetching logic
│   │   └── orchestrate.ts # Module orchestration
│   └── .env               # Email configuration
├── parity-checker/         # DID synchronization module
│   ├── src/
│   │   ├── cli.ts         # Parity checker CLI
│   │   ├── loaders/       # Data loading
│   │   ├── core/          # Reconciliation logic
│   │   └── output/        # Output formatters
│   └── .env               # API configuration
├── sdk/                    # API client library
│   ├── src/
│   │   ├── client.ts      # Main SDK client
│   │   └── modules/       # API modules
│   └── package.json
└── README.md               # This file
```

## 🚨 Troubleshooting

### Common Issues

1. **API 500 Errors** - Check environment variables and API credentials
2. **IMAP Connection Issues** - Verify Gmail app-specific password
3. **TypeScript Errors** - Ensure Node.js 18+ and proper ESM setup
4. **Permission Errors** - Check file permissions and directory access

### Debug Commands

```bash
# Check orchestrator status
npm run status

# Test email connection
npm run orchestrator:folders

# Test parity checker directly
npm run parity:dry

# Check module versions
npm run status
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

## 📄 License

[Add your license information here]

---

**🎯 The root orchestrator provides a single command interface for the complete workflow from email ingestion to API synchronization!**
