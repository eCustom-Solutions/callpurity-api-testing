# 🎯 CallPurity Root Orchestrator

The **root orchestrator** is the central command interface that coordinates all workflows between the email-ingestor, parity-checker, and SDK modules.

## 🚀 Quick Start

```bash
# Check orchestrator status
npm run status

# Run complete workflow
npm run weekly

# Get help
npm run help
```

## 📋 Available Commands

### Core Workflow Commands

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run fetch` | Fetch latest email + stage CSV | Daily monitoring, data collection |
| `npm run dry` | Fetch + run parity checker dry-run | Preview changes before applying |
| `npm run weekly` | Complete workflow: fetch + dry-run + apply + export | Production automation |
| `npm run status` | Show orchestrator and module status | System health check |
| `npm run help` | Show available commands | Get help |

### Direct Module Access

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run parity:dry` | Direct parity checker dry-run | Test parity checker independently |
| `npm run parity:apply` | Direct parity checker apply | Manual synchronization |
| `npm run parity:export` | Export current API state | Data verification |
| `npm run parity:verify` | Verify specific DIDs exist | Troubleshooting |
| `npm run sdk:test` | Run SDK tests | Development/testing |
| `npm run sdk:build` | Build SDK | Development |

## 🔄 Complete Workflow: `npm run weekly`

The `weekly` command runs the complete automation pipeline:

### Step 1: Email Ingestion
- Connects to Gmail via IMAP
- Fetches latest unread email from `parity-checker/inbox`
- Extracts CSV attachment
- Stages files in organized directories:
  - Raw email: `parity-checker/data/inbox/raw/`
  - Canonical CSV: `parity-checker/data/input/astrid/`
- Marks email as processed

### Step 2: Dry-Run Analysis
- Loads staged CSV (source of truth)
- Fetches current API state
- Compares and identifies differences:
  - Numbers to add
  - Numbers to delete
  - Numbers with mismatched branded names
- Generates detailed report

### Step 3: Apply Changes
- Applies changes with safety caps (default: max 2000 add/delete)
- Uses bulk operations for efficiency
- Requires confirmation (`--yes` flag)
- Handles errors gracefully

### Step 4: Post-Verification
- Fetches updated API state
- Re-runs comparison
- Exports final state for verification
- Confirms all changes were applied

## 🛡️ Safety Features

### Confirmation Required
```bash
# Apply operations require explicit confirmation
npm run weekly  # Will prompt for confirmation
npm run parity:apply  # Direct access also requires --yes
```

### Safety Caps
```bash
# Default limits (configurable)
--max-add 2000      # Maximum additions per run
--max-delete 2000   # Maximum deletions per run
```

### Second-Pass Verification
- Direct API `GET` calls to verify existence
- Avoids stale data from paginated `list` responses
- Filters out false positives/negatives

### Post-Apply Verification
- Re-fetches API state after changes
- Re-computes differences
- Exports verification report

## 📁 File Organization

The orchestrator creates and manages these directories:

```
parity-checker/
├── data/
│   ├── inbox/
│   │   ├── raw/                    # Raw email files (.eml)
│   │   └── rejected/               # Failed processing attempts
│   ├── input/
│   │   └── astrid/                 # Canonical CSV files
│   └── samples/                    # Sample data for testing
├── reports/
│   ├── json/                       # JSON difference reports
│   └── markdown/                   # Human-readable reports
└── logs/                           # Processing logs
```

## 🔧 Configuration

### Environment Variables

The orchestrator uses environment variables from both modules:

**Email Ingestor** (`email-ingestor/.env`):
```bash
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_LABEL_INBOX=parity-checker/inbox
EMAIL_LABEL_PROCESSED=parity-checker/processed
EMAIL_SENDER_ALLOWLIST=astrid@company.com
PARITY_ROOT=../parity-checker
```

**Parity Checker** (`parity-checker/.env`):
```bash
EMAIL=your-email@company.com
PASSWORD=your-password
API_BASE_URL=https://api-lab.callpurity.com/latest
TEST_ACCOUNT_ID=acc-your-account-id
TEST_ORG_ID=org-your-org-id
```

### Gmail Setup

1. **Enable 2FA** on your Gmail account
2. **Generate app-specific password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Use app password** in `EMAIL_PASS` (not your regular password)

## 🚨 Troubleshooting

### Common Issues

#### 1. API 500 Errors
```bash
# Check environment variables
npm run status

# Test parity checker directly
npm run parity:dry

# Verify API credentials
cd parity-checker
npm run verify:dids
```

#### 2. IMAP Connection Issues
```bash
# Test email connection
npm run fetch

# Check Gmail labels
npm run orchestrator:folders

# Verify app-specific password
# (Not your regular Gmail password)
```

#### 3. TypeScript/ESM Errors
```bash
# Ensure Node.js 18+
node --version

# Check module compatibility
npm run status

# Reinstall dependencies if needed
npm install
```

### Debug Commands

```bash
# Check system status
npm run status

# Test individual components
npm run fetch          # Test email ingestion
npm run parity:dry     # Test parity checker
npm run sdk:test       # Test SDK

# View logs and reports
ls parity-checker/reports/
ls parity-checker/logs/
```

### Error Recovery

#### Partial Failures
If the workflow fails partway through:

1. **Check the last successful step** in the output
2. **Verify file staging**:
   ```bash
   ls parity-checker/data/input/astrid/
   ls parity-checker/data/inbox/raw/
   ```
3. **Re-run from the failed step** or use direct module commands

#### Data Verification
```bash
# Export current API state
npm run parity:export

# Compare with source CSV
cd parity-checker
npm run compare:csv source.csv exported.csv
```

## 🔄 Automation & Scheduling

### Cron Jobs
```bash
# Weekly automation (every Monday at 9 AM)
0 9 * * 1 cd /path/to/callpurity-api-testing && npm run weekly

# Daily monitoring (fetch only)
0 8 * * 1-5 cd /path/to/callpurity-api-testing && npm run fetch
```

### CI/CD Integration
```bash
# GitHub Actions example
- name: Run Weekly Sync
  run: npm run weekly
  env:
    EMAIL: ${{ secrets.EMAIL }}
    PASSWORD: ${{ secrets.PASSWORD }}
    # ... other secrets
```

## 📊 Monitoring & Reporting

### Status Monitoring
```bash
# Check system health
npm run status

# View recent reports
ls -la parity-checker/reports/json/
ls -la parity-checker/reports/markdown/
```

### Log Analysis
```bash
# View processing logs
tail -f parity-checker/logs/orchestrator.log

# Check for errors
grep -i error parity-checker/logs/*.log
```

## 🚀 Advanced Usage

### Custom Workflow Options
```bash
# Run with custom limits
cd parity-checker
npm run sync:apply -- --max-add 1000 --max-delete 1000

# Run with verification
npm run sync:apply -- --verify-before-apply
```

### Programmatic Usage
```javascript
import { CallPurityOrchestrator } from './orchestrator.js';

const orchestrator = new CallPurityOrchestrator();

// Custom workflow
await orchestrator.runCompleteWorkflow({
  dryRunOnly: false,
  maxAdd: 1500,
  maxDelete: 1500,
  exportState: true
});
```

## 🤝 Support

### Getting Help
```bash
# Show available commands
npm run help

# Check system status
npm run status

# View module versions
npm run status
```

### Common Workflows

| Scenario | Command | Description |
|----------|---------|-------------|
| **Daily monitoring** | `npm run fetch` | Check for new emails, stage CSVs |
| **Weekly planning** | `npm run dry` | See what changes would be made |
| **Production sync** | `npm run weekly` | Complete automation workflow |
| **Troubleshooting** | `npm run status` | Check system health |
| **Manual sync** | `npm run parity:apply` | Direct API synchronization |

---

**🎯 The root orchestrator provides a single command interface for the complete workflow from email ingestion to API synchronization!**
