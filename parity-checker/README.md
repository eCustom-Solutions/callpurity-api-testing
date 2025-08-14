# 🔍 CallPurity Parity Checker

Compares source-of-truth CSVs with current API state and synchronizes differences. Part of the complete CallPurity automation toolkit.

## 🚀 Quick Start

### Prerequisites
- CallPurity API credentials
- Node.js 18+ and npm 8+
- Account and Organization IDs

### Installation
```bash
cd parity-checker
npm install
cp .env.example .env
# Edit .env with your API credentials
```

### Basic Usage
```bash
# Show what would change (dry-run)
npm run sync:dry

# Apply changes to API
npm run sync:apply

# Export current API state
npm run export:dids
```

## 🎯 Root Orchestrator (Recommended)

The **root orchestrator** provides a unified interface for all workflows:

```bash
# From the project root directory
npm run fetch      # Fetch latest email + stage CSV
npm run dry        # Fetch + run parity checker dry-run  
npm run weekly     # Complete workflow: fetch + dry-run + apply + export
npm run status     # Show orchestrator and module status
npm run help       # Show available commands
```

**💡 Use the root orchestrator for production workflows!**

## 🔧 Configuration

### Environment Variables

Create `.env` file with your CallPurity credentials:

```bash
# API Credentials
EMAIL=your-email@company.com
PASSWORD=your-password

# API Configuration
API_BASE_URL=https://api-lab.callpurity.com/latest

# Test Account/Organization IDs
TEST_ACCOUNT_ID=acc-your-account-id
TEST_ORG_ID=org-your-org-id
```

### Getting Account/Organization IDs

1. **Use the SDK discovery script**:
   ```bash
   cd sdk
   npm run discover
   ```

2. **Or check your CallPurity dashboard** for the IDs

## 🔍 How It Works

### 1. Data Loading
- **Source CSV**: Loads from `data/input/astrid/` (staged by email-ingestor)
- **API State**: Fetches current DIDs from CallPurity API
- **Normalization**: Converts all numbers to 10-digit DID format

### 2. Reconciliation
- **Comparison**: Identifies differences between source and API
- **Categories**:
  - `toAdd`: Numbers in CSV but not in API
  - `toDelete`: Numbers in API but not in CSV
  - `mismatches`: Numbers with different branded names

### 3. Second-Pass Verification
- **Direct API calls**: Uses `dids.get` to verify existence
- **Avoids stale data**: Bypasses paginated `list` inconsistencies
- **Filters candidates**: Removes false positives/negatives

### 4. Application
- **Safety caps**: Configurable limits (default: max 2000 add/delete)
- **Bulk operations**: Efficient API calls for large changes
- **Confirmation required**: `--yes` flag for apply operations

## 📋 Available Commands

### Module Commands
```bash
npm run sync:dry      # Show what would change (dry-run)
npm run sync:apply    # Apply changes to API
npm run export:dids   # Export current API state
npm run verify:dids   # Verify specific DIDs exist
npm run delete:dids   # Delete specific DIDs
npm run compare:csv   # Compare two CSV files
```

### Root Orchestrator Commands
```bash
# From project root
npm run parity:dry    # Direct parity checker dry-run
npm run parity:apply  # Direct parity checker apply
npm run parity:export # Export current API state
npm run parity:verify # Verify specific DIDs exist
```

## 🛡️ Safety Features

### Confirmation Required
```bash
# Apply operations require explicit confirmation
npm run sync:apply -- --yes

# Or use the root orchestrator
npm run weekly  # Will prompt for confirmation
```

### Safety Caps
```bash
# Default limits (configurable)
--max-add 2000      # Maximum additions per run
--max-delete 2000   # Maximum deletions per run

# Custom limits
npm run sync:apply -- --max-add 1000 --max-delete 1000 --yes
```

### Second-Pass Verification
- **Pre-apply**: Direct API checks to verify candidates
- **Post-apply**: Re-fetches state to confirm changes
- **Export verification**: Final state export for audit

## 📁 File Organization

The parity checker works with these directories:

```
parity-checker/
├── data/
│   ├── input/
│   │   └── astrid/                 # CSV files from email-ingestor
│   ├── samples/                    # Sample data for testing
│   └── inbox/                      # Raw emails (from email-ingestor)
├── reports/
│   ├── json/                       # JSON difference reports
│   └── markdown/                   # Human-readable reports
└── logs/                           # Processing logs
```

## 🔄 Integration with Email Ingestor

The parity checker automatically uses files staged by the email-ingestor:

1. **CSV Input**: `data/input/astrid/` (latest timestamped file)
2. **Raw Emails**: `data/inbox/raw/` (for reference)
3. **Workflow**: Integrated via root orchestrator

### Complete Workflow
```bash
# From project root
npm run weekly

# This runs:
# 1. email-ingestor: fetch and stage CSV
# 2. parity-checker: dry-run analysis
# 3. parity-checker: apply changes (if confirmed)
# 4. parity-checker: export verification
```

## 📊 Output & Reporting

### Dry-Run Reports
```bash
npm run sync:dry

# Shows:
# - Numbers to add (with branded names)
# - Numbers to delete
# - Numbers with mismatches
# - Summary statistics
```

### JSON Reports
```bash
# Automatically generated in reports/json/
# Contains detailed difference data for programmatic use
```

### Markdown Reports
```bash
# Human-readable reports in reports/markdown/
# Includes summaries and detailed breakdowns
```

## 🚨 Troubleshooting

### Common Issues

#### 1. API 500 Errors
```bash
# Check environment variables
cat .env | grep -E "(EMAIL|PASSWORD|API_BASE_URL)"

# Test API connection
npm run verify:dids

# Verify credentials
npm run export:dids
```

#### 2. Missing Environment Variables
```bash
# Check required variables
cat .env | grep -E "(TEST_ACCOUNT_ID|TEST_ORG_ID)"

# Set missing variables
echo 'TEST_ACCOUNT_ID="acc-your-id"' >> .env
echo 'TEST_ORG_ID="org-your-id"' >> .env
```

#### 3. File Not Found Errors
```bash
# Check if CSV files exist
ls -la data/input/astrid/

# Ensure email-ingestor has run first
npm run fetch  # From project root
```

### Debug Commands

```bash
# Test individual components
npm run export:dids   # Test API connection
npm run verify:dids   # Test DID verification
npm run sync:dry      # Test reconciliation

# Check file staging
ls -la data/input/astrid/
ls -la reports/json/
ls -la reports/markdown/
```

## 🚀 Advanced Usage

### Custom Reconciliation
```typescript
import { loadCallPurityDIDs } from './src/loaders/callpurity.js';
import { loadCSVDIDs } from './src/loaders/csv.js';
import { reconcile } from './src/core/reconcile.js';

// Custom reconciliation
const apiDIDs = await loadCallPurityDIDs(accountId, orgId);
const csvDIDs = await loadCSVDIDs(csvPath);
const result = await reconcile(csvDIDs, apiDIDs);
```

### Bulk Operations
```bash
# Custom bulk limits
npm run sync:apply -- --max-add 5000 --max-delete 5000 --yes

# With verification
npm run sync:apply -- --verify-before-apply --yes
```

### Data Export
```bash
# Export current state
npm run export:dids

# Compare with source
npm run compare:csv source.csv exported.csv
```

## 📊 Monitoring & Verification

### Status Checks
```bash
# Check module status
npm run status

# View recent reports
ls -la reports/json/
ls -la reports/markdown/
```

### Data Verification
```bash
# Export current state
npm run export:dids

# Verify specific DIDs
npm run verify:dids

# Compare with source
npm run compare:csv source.csv exported.csv
```

## 🔄 Automation

### Cron Jobs
```bash
# Weekly automation (every Monday at 9 AM)
0 9 * * 1 cd /path/to/callpurity-api-testing && npm run weekly

# Daily monitoring (dry-run only)
0 8 * * 1-5 cd /path/to/callpurity-api-testing && npm run dry
```

### CI/CD Integration
```bash
# GitHub Actions example
- name: Run Weekly Sync
  run: npm run weekly
  env:
    EMAIL: ${{ secrets.EMAIL }}
    PASSWORD: ${{ secrets.PASSWORD }}
    TEST_ACCOUNT_ID: ${{ secrets.TEST_ACCOUNT_ID }}
    TEST_ORG_ID: ${{ secrets.TEST_ORG_ID }}
```

## 🤝 Support

### Getting Help
```bash
# Show available commands
npm run help

# Check system status
npm run status

# View module documentation
cat README.md
```

### Common Workflows

| Scenario | Command | Description |
|----------|---------|-------------|
| **Planning** | `npm run sync:dry` | See what changes would be made |
| **Production** | `npm run sync:apply` | Apply changes to API |
| **Verification** | `npm run export:dids` | Export current state |
| **Troubleshooting** | `npm run verify:dids` | Check specific DIDs |
| **Complete workflow** | `npm run weekly` | Full automation pipeline |

---

**🔍 The parity checker compares source-of-truth CSVs with API state and synchronizes differences with comprehensive safety features!**