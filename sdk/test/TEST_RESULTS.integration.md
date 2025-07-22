# CallPurity SDK Integration Test Results

## Test Execution Summary

**Date:** July 22, 2025
**Test Runner:** Vitest (integration mode)
**Environment:** Sandbox API

## Test Execution Command

```bash
cd sdk
npm run test:int -- --reporter=verbose
```

## Results

### Test Run: July 22, 2025 - 14:23:02

**Status:** ❌ All tests failed (6/6)
**Duration:** 2.47s

#### Test Results Summary:
- **test/integration/auth.integration.test.ts**: ❌ 1 test failed
- **test/integration/accounts.integration.test.ts**: ❌ 2 tests failed  
- **test/integration/dids.integration.test.ts**: ❌ 1 test failed
- **test/integration/organizations.integration.test.ts**: ❌ 2 tests failed

#### Detailed Failures:

1. **Auth Test Failure**
   - Error: `status: 422` (Unprocessable Entity)
   - Issue: Invalid request format or validation error
   - Likely Cause: Invalid credentials, wrong API endpoint, or malformed request payload

2. **Accounts Test Failures**
   - First test: `accounts.data` is not an array (assertion failure)
   - Second test: `status: 404` when trying to get account by ID
   - Likely Cause: No accounts exist, or invalid/missing account ID

3. **DIDs Test Failure**
   - Error: `status: 404` when trying to add/remove DIDs
   - Likely Cause: Invalid `TEST_ACCOUNT_ID` or `TEST_ORG_ID`, or account/org doesn't exist

4. **Organizations Test Failures**
   - Error: `status: 404` for both getting and creating organizations
   - Likely Cause: Invalid `TEST_ACCOUNT_ID` or account doesn't exist

#### Issues Identified:
1. **Auth credentials** - 422 error suggests login is failing
2. **TEST_ACCOUNT_ID** - Missing or invalid
3. **TEST_ORG_ID** - Missing or invalid  
4. **API endpoint** - May need to verify correct sandbox URL

#### Next Steps:
- Verify `.env` file contains valid credentials
- Ensure `TEST_ACCOUNT_ID` and `TEST_ORG_ID` are set and valid
- Confirm API endpoint is correct for sandbox environment
- Test auth flow independently before running other integration tests

---

*This file is for human-readable integration test logs and notes. Update after each integration test run.* 