# 🧹 CallPurity API Testing Repository - Cleanup & Improvement TODO

## 📋 **Overview**
This document outlines the cleanup and improvement tasks needed to bring the repository to production-ready status. The repository is currently functional but needs refinement for autonomous operation and maintainability.

---

## 🗂️ **1. Repository Cleanup Tasks**

### **1.1 Remove Obsolete Directories & Files**
- [ ] **Remove `prompts/` folder** - Contains old development prompts that are no longer needed
  - `01_environment-setup.txt` (0.0B, empty file)
  - `02_sdk-generation.txt` (3.6KB)
  - `03_integration_test_generation.txt` (7.0KB)
  - `04_parity_checker_mvp.txt` (0.0B, empty file)

- [ ] **Clean up root-level temporary files**
  - `compare_datasets.js` - One-time analysis script
  - `dataset_comparison.json` - One-time analysis output
  - `api_current_dids_actual.csv` - One-time export
  - `astrid_csv_numbers.csv` - One-time export copy
  - `api_current_dids.csv` - Empty/malformed export

### **1.2 Consolidate Documentation**
- [ ] **Refactor root README.md** - Currently 7.3KB, needs streamlining
  - Remove duplicate information that's in module-specific READMEs
  - Focus on high-level architecture and quick start
  - Add troubleshooting section
  - Update with current working examples

- [ ] **Update module READMEs** - Ensure consistency across all modules
  - `parity-checker/README.md` (8.5KB) - Good, but could use examples
  - `email-ingestor/README.md` (6.6KB) - Good, but needs label fix documentation
  - `sdk/README.md` (7.0KB) - Good, comprehensive
  - `project-reporter/README.md` (1.8KB) - Standalone utility, consider removal

- [ ] **Consolidate ORCHESTRATOR.md and QUICKSTART.md**
  - `ORCHESTRATOR.md` (8.1KB) - Merge with main README
  - `QUICKSTART.md` (3.6KB) - Merge with main README

### **1.3 Code Quality & Structure**
- [ ] **Remove duplicate TODO files**
  - `parity-checker/TODO.md` (1.7KB)
  - `email-ingestor/TODO.md` (2.3KB)
  - Consolidate into this root `todo.md`

- [ ] **Clean up test files**
  - `email-ingestor/test-fetch.js` - Development test file
  - `email-ingestor/ISSUE_FOLDER_LISTING.md` - Issue documentation

- [ ] **Standardize .gitignore files**
  - Root `.gitignore` (1.1KB) - Comprehensive
  - `parity-checker/.gitignore` (142B) - Minimal
  - `email-ingestor/.gitignore` (102B) - Minimal
  - `sdk/.gitignore` (25B) - Minimal
  - Consider consolidating into root-level

---

## 📝 **2. Logging & Monitoring Improvements**

### **2.1 Structured Logging System**
- [ ] **Implement structured logging framework**
  - Replace `console.log` with structured logger
  - Add log levels (DEBUG, INFO, WARN, ERROR)
  - Include timestamps and correlation IDs
  - Support JSON format for machine parsing

- [ ] **Add logging to all modules**
  - Root orchestrator
  - Email ingestor
  - Parity checker
  - SDK operations

### **2.2 Log Storage & Retention**
- [ ] **Design log storage strategy**
  - Local file storage with rotation
  - GitHub integration for long-term storage
  - Cloud logging service consideration
  - Log aggregation and search capabilities

- [ ] **Implement log rotation**
  - Daily log files
  - Compress old logs
  - Retention policies (30/90/365 days)

### **2.3 Monitoring & Alerting**
- [ ] **Add health checks**
  - API connectivity status
  - Email service status
  - File system health
  - Database/state consistency

- [ ] **Implement alerting**
  - Failed email fetches
  - API errors
  - Large change volumes
  - System resource issues

---

## 📧 **3. Email Label System Fixes**

### **3.1 Current Issue Analysis**
**Problem**: The current system only adds the `processed` label but doesn't remove the `inbox` label, causing emails to appear in both locations.

**Current Code** (from `email-ingestor/src/fetch.ts:120-125`):
```typescript
// Mark as processed (seen + label)
await client.messageFlagsAdd(m.uid, ['\\Seen']);
try { 
  await client.mailboxCreate(processedLabel); 
} catch {}
await client.messageMove(m.uid, processedLabel);
```

### **3.2 Required Changes**
- [ ] **Fix label removal logic**
  - Remove message from `inbox` label before moving to `processed`
  - Use `client.messageFlagsRemove()` to remove inbox label
  - Ensure atomic operation (remove + add in sequence)

- [ ] **Improve label management**
  - Verify label existence before operations
  - Handle label creation failures gracefully
  - Add retry logic for label operations

- [ ] **Add label verification**
  - Confirm message is only in `processed` label
  - Log any label inconsistencies
  - Add cleanup for orphaned messages

### **3.3 Implementation Plan**
```typescript
// Pseudo-code for proper label handling
await client.messageFlagsRemove(m.uid, ['\\Inbox']);  // Remove inbox label
await client.messageMove(m.uid, processedLabel);      // Move to processed
await client.messageFlagsAdd(m.uid, ['\\Seen']);     // Mark as read
```

---

## 🔧 **4. Additional Improvements**

### **4.1 Error Handling**
- [ ] **Standardize error handling across modules**
  - Consistent error types and messages
  - Proper error propagation
  - User-friendly error messages
  - Error recovery strategies

- [ ] **Add retry mechanisms**
  - API call retries with exponential backoff
  - Email operation retries
  - File operation retries

### **4.2 Configuration Management**
- [ ] **Centralize configuration**
  - Single `.env` file at root level
  - Environment-specific configs (dev/staging/prod)
  - Configuration validation
  - Sensitive data encryption

- [ ] **Add configuration validation**
  - Required environment variables
  - Format validation (email, URLs, etc.)
  - Dependency checking

### **4.3 Testing & Quality**
- [ ] **Improve test coverage**
  - Unit tests for all modules
  - Integration tests for workflows
  - End-to-end testing
  - Performance testing

- [ ] **Add CI/CD pipeline**
  - Automated testing
  - Code quality checks
  - Security scanning
  - Automated deployment

### **4.4 Performance & Scalability**
- [ ] **Optimize bulk operations**
  - Batch size tuning
  - Parallel processing where safe
  - Memory usage optimization
  - Progress tracking for large operations

- [ ] **Add caching layer**
  - API response caching
  - File system caching
  - Configuration caching

---

## 🎯 **5. Priority & Implementation Order**

### **Phase 1: Critical Fixes (Week 1)**
1. Fix email label system (Section 3)
2. Remove obsolete files and directories (Section 1.1)
3. Implement basic structured logging (Section 2.1)

### **Phase 2: Documentation & Structure (Week 2)**
1. Consolidate and refactor READMEs (Section 1.2)
2. Standardize .gitignore files (Section 1.3)
3. Consolidate TODO files (Section 1.3)

### **Phase 3: Logging & Monitoring (Week 3-4)**
1. Complete logging implementation (Section 2)
2. Add health checks and monitoring (Section 2.3)
3. Implement log storage strategy (Section 2.2)

### **Phase 4: Quality & Performance (Week 5-6)**
1. Error handling improvements (Section 4.1)
2. Configuration management (Section 4.2)
3. Testing improvements (Section 4.3)

---

## 📊 **6. Current Repository Status**

### **Working Components** ✅
- Root orchestrator with complete workflow
- Email ingestor with IMAP integration
- Parity checker with safety caps
- SDK with full API coverage
- Basic logging and error handling

### **Needs Attention** ⚠️
- Email label management (critical)
- Documentation consolidation
- Logging infrastructure
- Error handling standardization

### **Ready for Removal** 🗑️
- Prompts folder
- Temporary analysis files
- Duplicate TODO files
- Development test files

---

## 🚀 **7. Success Criteria**

- [ ] **Autonomous Operation**: System can run without manual intervention
- [ ] **Comprehensive Logging**: All operations are logged and searchable
- [ ] **Clean Repository**: No obsolete files or duplicate documentation
- [ ] **Error Recovery**: System handles failures gracefully
- [ ] **Monitoring**: Health status and alerts are available
- [ ] **Documentation**: Clear, consistent, and up-to-date

---

*Last Updated: $(date)*
*Repository: CallPurity API Testing & Automation*
*Status: Planning Phase*
