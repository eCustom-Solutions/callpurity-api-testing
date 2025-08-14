# 🚀 CallPurity Automation - Quick Start Guide

Get up and running with the complete CallPurity automation toolkit in 5 minutes.

## 🎯 What This Does

**Automatically syncs phone numbers from email CSV attachments to your CallPurity API:**

1. **📧 Fetches CSV attachments** from Gmail (from Astrid)
2. **🔍 Compares** CSV with current API state  
3. **🔄 Synchronizes** differences (adds/removes DIDs)
4. **✅ Verifies** all changes were applied

## ⚡ Quick Start (5 minutes)

### 1. Install Dependencies
```bash
git clone <your-repo>
cd callpurity-api-testing
npm install
```

### 2. Configure Environment
```bash
# Email ingestor (Gmail)
cp email-ingestor/.env.example email-ingestor/.env
# Edit: EMAIL_USER, EMAIL_PASS (app-specific password)

# Parity checker (CallPurity API)  
cp parity-checker/.env.example parity-checker/.env
# Edit: EMAIL, PASSWORD, TEST_ACCOUNT_ID, TEST_ORG_ID
```

### 3. Test the System
```bash
# Check system status
npm run status

# Test email connection
npm run fetch

# Run complete workflow (dry-run first)
npm run dry
```

## 🎮 Main Commands

| Command | What It Does | When to Use |
|---------|--------------|-------------|
| `npm run fetch` | Get latest CSV from email | Daily monitoring |
| `npm run dry` | See what would change | Planning/review |
| `npm run weekly` | Complete sync workflow | Production automation |
| `npm run status` | Check system health | Troubleshooting |

## 🔧 Setup Requirements

### Gmail Setup
- ✅ Enable 2FA on Gmail
- ✅ Generate app-specific password
- ✅ Create labels: `parity-checker/inbox`, `parity-checker/processed`

### CallPurity Setup  
- ✅ API credentials (email/password)
- ✅ Account ID and Organization ID
- ✅ Access to sandbox/production API

## 📁 What Gets Created

```
parity-checker/
├── data/
│   ├── input/astrid/     # CSV files from emails
│   ├── inbox/raw/        # Raw email files
│   └── samples/          # Sample data
├── reports/
│   ├── json/             # Difference reports
│   └── markdown/         # Human-readable reports
└── logs/                 # Processing logs
```

## 🚨 Common Issues & Fixes

### "API 500 Error"
```bash
# Check credentials
cat parity-checker/.env | grep -E "(EMAIL|PASSWORD)"

# Test connection
npm run parity:verify
```

### "IMAP Connection Failed"  
```bash
# Check Gmail setup
cat email-ingestor/.env | grep EMAIL

# Test connection
npm run fetch
```

### "No CSV Found"
```bash
# Check if email-ingestor ran first
ls parity-checker/data/input/astrid/

# Run fetch manually
npm run fetch
```

## 🔄 Complete Workflow Example

```bash
# 1. Fetch latest CSV from Astrid's email
npm run fetch

# 2. See what would change (dry-run)
npm run dry

# 3. Apply changes (with confirmation)
npm run weekly

# 4. Verify changes
npm run parity:export
```

## 🛡️ Safety Features

- **Confirmation required** for all API changes
- **Safety caps** (max 2000 add/delete per run)
- **Second-pass verification** to avoid false positives
- **Post-apply verification** to confirm changes
- **Comprehensive logging** for audit trails

## 📚 Next Steps

- **Read the full docs**: `README.md`, `ORCHESTRATOR.md`
- **Test with sample data**: `npm run dry`
- **Set up automation**: Cron jobs, CI/CD
- **Monitor and verify**: Check reports and logs

## 🆘 Need Help?

```bash
# Show all commands
npm run help

# Check system status  
npm run status

# View detailed docs
cat README.md
cat ORCHESTRATOR.md
```

---

**🎯 You're ready to automate CallPurity DID synchronization! Start with `npm run fetch` to test the system.**
