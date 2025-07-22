import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrganizationsModule } from '../../modules/organizations.js';

describe('Organizations Module', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
    };
  });

  it('should get organization by ID', async () => {
    const mockOrganization = {
      registration_date: '2024-01-01T00:00:00Z',
      approval_status: 'approved',
      name: 'Test Organization',
    };

    mockClient.get.mockResolvedValue({ data: mockOrganization });

    const organizationsModule = createOrganizationsModule(mockClient);
    const result = await organizationsModule.get('acc-456', 'org-123');

    expect(mockClient.get).toHaveBeenCalledWith('/account/acc-456/organization/org-123');
    expect(result).toEqual(mockOrganization);
    expect(result.registration_date).toBe('2024-01-01T00:00:00Z');
    expect(result.approval_status).toBe('approved');
  });

  it('should create organization with valid payload', async () => {
    const createPayload = {
      business_info: {
        legal_company_name: "Test Organization LLC",
        dba: "Test Org",
        ein: "123456789",
        business_phone_number: "5551234567",
        employee_count: 10,
        website: "https://testorg.example.com",
        quantity_of_phone_numbers: 5,
        address: "123 Test Street",
        city: "Test City",
        state: "CA",
        zip_code: "90210"
      },
      contact_info: {
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
        phone: "5559876543"
      },
      calling_behavior: {
        telecom_provider: "Test Provider",
        own_dids: false,
        dialing_opt_in_data: true,
        using_opt_in_data_provider: false,
        tcpa_dnc_violation: null,
        calls_per_day: 100,
        max_redial_attempts_daily_per_lead: 3,
        max_redial_attempts_weekly_per_lead: 5
      }
    };

    const mockCreatedOrganization = {
      organization_id: 'org-789',
    };

    mockClient.post.mockResolvedValue({ data: mockCreatedOrganization });

    const organizationsModule = createOrganizationsModule(mockClient);
    const result = await organizationsModule.create('acc-456', createPayload);

    expect(mockClient.post).toHaveBeenCalledWith('/account/acc-456/organization/', createPayload);
    expect(result).toEqual(mockCreatedOrganization);
    expect(result.organization_id).toBe('org-789');
  });

  it('should validate organization creation payload structure', async () => {
    const createPayload = {
      business_info: {
        legal_company_name: "Test Organization LLC",
        dba: "Test Org",
        ein: "123456789",
        business_phone_number: "5551234567",
        employee_count: 10,
        website: "https://testorg.example.com",
        quantity_of_phone_numbers: 5,
        address: "123 Test Street",
        city: "Test City",
        state: "CA",
        zip_code: "90210"
      },
      contact_info: {
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
        phone: "5559876543"
      },
      calling_behavior: {
        telecom_provider: "Test Provider",
        own_dids: false,
        dialing_opt_in_data: true,
        using_opt_in_data_provider: false,
        tcpa_dnc_violation: null,
        calls_per_day: 100,
        max_redial_attempts_daily_per_lead: 3,
        max_redial_attempts_weekly_per_lead: 5
      }
    };

    const mockCreatedOrganization = {
      organization_id: 'org-123',
    };

    mockClient.post.mockResolvedValue({ data: mockCreatedOrganization });

    const organizationsModule = createOrganizationsModule(mockClient);
    const result = await organizationsModule.create('acc-456', createPayload);

    // Validate payload structure
    expect(createPayload).toHaveProperty('business_info');
    expect(createPayload).toHaveProperty('contact_info');
    expect(createPayload).toHaveProperty('calling_behavior');
    expect(createPayload.business_info.legal_company_name).toBe('Test Organization LLC');

    // Validate response structure
    expect(result).toHaveProperty('organization_id');
    expect(typeof result.organization_id).toBe('string');
  });

  it('should handle organization creation with minimal payload', async () => {
    const createPayload = {
      business_info: {
        legal_company_name: "Minimal Org LLC",
        dba: null,
        ein: "987654321",
        business_phone_number: "5551234567",
        employee_count: null,
        website: null,
        quantity_of_phone_numbers: null,
        address: "456 Minimal St",
        city: "Minimal City",
        state: "CA",
        zip_code: "90210"
      },
      contact_info: {
        first_name: "Minimal",
        last_name: "User",
        email: "minimal@example.com",
        phone: "5551234567"
      },
      calling_behavior: {
        telecom_provider: null,
        own_dids: null,
        dialing_opt_in_data: null,
        using_opt_in_data_provider: null,
        tcpa_dnc_violation: null,
        calls_per_day: null,
        max_redial_attempts_daily_per_lead: null,
        max_redial_attempts_weekly_per_lead: null
      }
    };

    const mockCreatedOrganization = {
      organization_id: 'org-123',
    };

    mockClient.post.mockResolvedValue({ data: mockCreatedOrganization });

    const organizationsModule = createOrganizationsModule(mockClient);
    const result = await organizationsModule.create('acc-456', createPayload);

    expect(mockClient.post).toHaveBeenCalledWith('/account/acc-456/organization/', createPayload);
    expect(result.organization_id).toBe('org-123');
  });
}); 