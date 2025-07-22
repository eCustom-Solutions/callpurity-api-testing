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
      id: 'acc-123',
      name: 'Test Account',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    mockClient.get.mockResolvedValue({ data: mockAccount });

    const accountsModule = createAccountsModule(mockClient);
    const result = await accountsModule.get('acc-123');

    expect(mockClient.get).toHaveBeenCalledWith('/accounts/acc-123');
    expect(result).toEqual(mockAccount);
  });

  it('should list accounts with pagination', async () => {
    const mockAccountsResponse = {
      data: [
        {
          id: 'acc-123',
          name: 'Test Account 1',
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'acc-456',
          name: 'Test Account 2',
          status: 'active',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 2,
        totalPages: 1,
      },
    };

    mockClient.get.mockResolvedValue({ data: mockAccountsResponse });

    const accountsModule = createAccountsModule(mockClient);
    const result = await accountsModule.list();

    expect(mockClient.get).toHaveBeenCalledWith('/accounts');
    expect(result).toEqual(mockAccountsResponse);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].id).toBe('acc-123');
    expect(result.data[1].id).toBe('acc-456');
  });

  it('should handle empty accounts list', async () => {
    const mockEmptyResponse = {
      data: [],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
      },
    };

    mockClient.get.mockResolvedValue({ data: mockEmptyResponse });

    const accountsModule = createAccountsModule(mockClient);
    const result = await accountsModule.list();

    expect(mockClient.get).toHaveBeenCalledWith('/accounts');
    expect(result.data).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
  });
}); 