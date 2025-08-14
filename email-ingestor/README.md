# 📧 CallPurity Email Ingestor

Automatically fetches CSV attachments from Gmail and stages them for processing by the parity checker.

## 🚀 Quick Start

### Prerequisites
- Gmail account with 2FA enabled
- App-specific password (not your regular password)
- Node.js 18+ and npm 8+

### Installation
```bash
cd email-ingestor
npm install
cp .env.example .env
# Edit .env with your credentials
```

### Basic Usage
```bash
# Fetch latest email and stage CSV
npm run fetch

# List available Gmail labels
npm run folders

# Test IMAP connection
npm run list:folders
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

Create `.env` file with your Gmail credentials:

```bash
# IMAP Connection
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Gmail Labels
EMAIL_LABEL_INBOX=parity-checker/inbox
EMAIL_LABEL_PROCESSED=parity-checker/processed

# Security
EMAIL_SENDER_ALLOWLIST=astrid@company.com

# Integration
PARITY_ROOT=../parity-checker
```

### Gmail Setup

1. **Enable 2FA** on your Gmail account
2. **Generate app-specific password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Use app password** in `EMAIL_PASS` (not your regular password)

### Gmail Labels

The ingestor expects these labels to exist:
- `parity-checker/inbox` - Where new emails arrive
- `parity-checker/processed` - Where processed emails are moved

Create these labels in Gmail if they don't exist.

## 📧 How It Works

### 1. Email Fetching
- Connects to Gmail via IMAP
- Searches `parity-checker/inbox` label
- Processes emails from newest to oldest
- Only processes emails from allowed senders

### 2. CSV Detection
Automatically detects CSV attachments using:
- File extension (`.csv`)
- MIME type (`text/csv`, `application/csv`)
- Filename patterns (contains "phone numbers", "DIDs", etc.)

### 3. File Staging
Organizes files in structured directories:
```
parity-checker/
├── data/
│   ├── inbox/
│   │   └── raw/                    # Raw email files (.eml)
│   └── input/
│       └── astrid/                 # Canonical CSV files
```

### 4. Email Processing
- Marks email as read
- Moves to `parity-checker/processed` label
- Verifies successful processing

## 📋 Available Commands

### Module Commands
```bash
npm run fetch          # Fetch and stage latest email
npm run dry            # Fetch + run parity checker dry-run
npm run weekly         # Fetch + run parity checker apply
npm run folders        # List available Gmail labels
npm run list:folders   # Standalone folder listing
```

### Root Orchestrator Commands
```bash
# From project root
npm run fetch          # Same as above but coordinated
npm run dry            # Coordinated dry-run workflow
npm run weekly         # Complete automation pipeline
npm run status         # System status check
npm run help           # Show all available commands
```

## 🔍 Troubleshooting

### Common Issues

#### 1. IMAP Connection Failed
```bash
# Check credentials
cat .env | grep EMAIL

# Test connection
npm run list:folders

# Verify app-specific password (not regular password)
```

#### 2. No CSV Attachments Found
```bash
# Check email content
ls parity-checker/data/inbox/raw/

# Verify sender is in allowlist
cat .env | grep EMAIL_SENDER_ALLOWLIST
```

#### 3. Permission Errors
```bash
# Check directory permissions
ls -la parity-checker/data/

# Ensure directories exist
mkdir -p parity-checker/data/input/astrid
mkdir -p parity-checker/data/inbox/raw
```

### Debug Commands

```bash
# Test individual components
npm run list:folders   # Test IMAP connection
npm run fetch          # Test full pipeline

# Check file staging
ls -la parity-checker/data/input/astrid/
ls -la parity-checker/data/inbox/raw/

# View logs
tail -f parity-checker/logs/email-ingestor.log
```

## 🔄 Integration with Parity Checker

The email ingestor automatically stages files for the parity checker:

1. **Raw emails** → `parity-checker/data/inbox/raw/`
2. **CSV files** → `parity-checker/data/input/astrid/`
3. **Integration** → Parity checker uses staged CSVs as source of truth

### Workflow Integration

```bash
# Complete workflow from root
npm run weekly

# This runs:
# 1. email-ingestor: fetch and stage CSV
# 2. parity-checker: dry-run analysis
# 3. parity-checker: apply changes (if confirmed)
# 4. parity-checker: export verification
```

## 🛡️ Security Features

- **Sender allowlist** - Only processes emails from trusted senders
- **App-specific passwords** - No regular Gmail passwords stored
- **File isolation** - Staged files are in controlled directories
- **Error handling** - Graceful failure without data loss

## 📊 Monitoring

### Status Checks
```bash
# Check module status
npm run status

# Check file staging
ls -la parity-checker/data/input/astrid/
ls -la parity-checker/data/inbox/raw/
```

### Log Analysis
```bash
# View recent activity
tail -f parity-checker/logs/email-ingestor.log

# Check for errors
grep -i error parity-checker/logs/*.log
```

## 🚀 Advanced Usage

### Custom Email Processing
```typescript
import { fetchLatestAndStage } from './src/fetch.js';

// Custom processing
const result = await fetchLatestAndStage();
if (result?.canonicalCsvPath) {
  console.log('CSV staged at:', result.canonicalCsvPath);
}
```

### Automation
```bash
# Cron job for daily monitoring
0 8 * * 1-5 cd /path/to/callpurity-api-testing && npm run fetch

# CI/CD integration
npm run fetch  # In your deployment pipeline
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
| **Daily monitoring** | `npm run fetch` | Check for new emails, stage CSVs |
| **Weekly planning** | `npm run dry` | See what changes would be made |
| **Production sync** | `npm run weekly` | Complete automation workflow |
| **Troubleshooting** | `npm run status` | Check system health |

---

**📧 The email ingestor automatically fetches CSV attachments from Gmail and stages them for processing by the parity checker!**
