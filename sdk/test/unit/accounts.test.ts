import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAccountsModule } from '../../modules/accounts.js';

describe('Accounts Module', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      get: vi.fn(),
    };
  });

  it('should get account by ID', async () => {
    const mockAccount = {
      account_name: 'Test Account',
      organizations: [
        {
          organization_id: 'org-123',
          organization_name: 'Test Organization',
        },
      ],
    };

    mockClient.get.mockResolvedValue({ data: mockAccount });

    const accountsModule = createAccountsModule(mockClient);
    const result = await accountsModule.get('acc-123');

    expect(mockClient.get).toHaveBeenCalledWith('/account/acc-123');
    expect(result).toEqual(mockAccount);
    expect(result.account_name).toBe('Test Account');
    expect(result.organizations).toHaveLength(1);
  });

  it('should list accounts with pagination', async () => {
    const mockAccountsResponse = [
      {
        account_id: 'acc-123',
        account_name: 'Test Account 1',
        organizations: [
          {
            organization_id: 'org-123',
            organization_name: 'Test Organization 1',
          },
        ],
      },
      {
        account_id: 'acc-456',
        account_name: 'Test Account 2',
        organizations: [
          {
            organization_id: 'org-456',
            organization_name: 'Test Organization 2',
          },
        ],
      },
    ];

    mockClient.get.mockResolvedValue({ data: mockAccountsResponse });

    const accountsModule = createAccountsModule(mockClient);
    const result = await accountsModule.list();

    expect(mockClient.get).toHaveBeenCalledWith('/accounts');
    expect(result).toEqual(mockAccountsResponse);
    expect(result).toHaveLength(2);
    expect(result[0].account_id).toBe('acc-123');
    expect(result[1].account_id).toBe('acc-456');
  });

  it('should handle empty accounts list', async () => {
    const mockEmptyResponse: any[] = [];

    mockClient.get.mockResolvedValue({ data: mockEmptyResponse });

    const accountsModule = createAccountsModule(mockClient);
    const result = await accountsModule.list();

    expect(mockClient.get).toHaveBeenCalledWith('/accounts');
    expect(result).toHaveLength(0);
  });
}); 