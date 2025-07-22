import { describe, it, expect, beforeAll } from 'vitest';
import CallPuritySDK from '../../client.js';

const accountId = process.env.TEST_ACCOUNT_ID!;
const orgId = process.env.TEST_ORG_ID!;

describe('Organizations (integration)', () => {
  beforeAll(async () => {
    await CallPuritySDK.auth.login(process.env.EMAIL!, process.env.PASSWORD!);
  });

  it('gets organization by ID', async () => {
    const org = await CallPuritySDK.organizations.get(accountId, orgId);
    expect(org).toHaveProperty('registration_date');
    expect(org).toHaveProperty('approval_status');
  });

  it('creates a new organization', async () => {
    const testOrgPayload = {
      business_info: {
        legal_company_name: "Integration Test Org LLC",
        dba: "Test Org",
        ein: "987654321",
        business_phone_number: "5551234567",
        employee_count: 5,
        website: "https://integration-test.example.com",
        quantity_of_phone_numbers: 3,
        address: "456 Test Ave",
        city: "Test City",
        state: "CA",
        zip_code: "90210"
      },
      contact_info: {
        first_name: "Integration",
        last_name: "Test",
        email: "integration@test.example.com",
        phone: "5559876543"
      },
      calling_behavior: {
        telecom_provider: "Test Provider",
        own_dids: false,
        dialing_opt_in_data: true,
        using_opt_in_data_provider: false,
        tcpa_dnc_violation: null,
        calls_per_day: 50,
        max_redial_attempts_daily_per_lead: 2,
        max_redial_attempts_weekly_per_lead: 3
      }
    };
    
    const created = await CallPuritySDK.organizations.create(accountId, testOrgPayload);
    expect(created).toHaveProperty('organization_id');
    expect(typeof created.organization_id).toBe('string');
  });
}); 