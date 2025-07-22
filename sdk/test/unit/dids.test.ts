import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDidsModule } from '../../modules/dids.js';

describe('DIDs Module', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    };
  });

  it('should list DIDs with pagination', async () => {
    const mockResponse = {
      data: {
        data: [
          {
            number: '+1234567890',
            accountId: 'acc-123',
            organizationId: 'org-456',
            status: 'active',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
        },
      },
    };

    mockClient.get.mockResolvedValue(mockResponse);

    const didsModule = createDidsModule(mockClient);
    const result = await didsModule.list('acc-123', 'org-456', 1, 20);

    expect(mockClient.get).toHaveBeenCalledWith('/accounts/acc-123/organizations/org-456/dids', {
      params: { page: 1, pageSize: 20 },
    });

    expect(result).toEqual(mockResponse.data);
  });

  it('should add a DID', async () => {
    const mockResponse = {
      data: {
        number: '+1234567890',
        accountId: 'acc-123',
        organizationId: 'org-456',
        brandedName: 'Test DID',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    };

    mockClient.post.mockResolvedValue(mockResponse);

    const didsModule = createDidsModule(mockClient);
    const result = await didsModule.add('acc-123', 'org-456', '+1234567890', 'Test DID');

    expect(mockClient.post).toHaveBeenCalledWith('/accounts/acc-123/organizations/org-456/dids', {
      number: '+1234567890',
      brandedName: 'Test DID',
    });

    expect(result).toEqual(mockResponse.data);
  });

  it('should remove a DID', async () => {
    mockClient.delete.mockResolvedValue({});

    const didsModule = createDidsModule(mockClient);
    await didsModule.remove('acc-123', 'org-456', '+1234567890');

    expect(mockClient.delete).toHaveBeenCalledWith('/accounts/acc-123/organizations/org-456/dids/+1234567890');
  });

  it('should perform bulk operations', async () => {
    mockClient.post.mockResolvedValue({});

    const didsModule = createDidsModule(mockClient);
    await didsModule.bulk('acc-123', 'org-456', 'add', ['+1234567890', '+0987654321']);

    expect(mockClient.post).toHaveBeenCalledWith('/accounts/acc-123/organizations/org-456/dids/bulk', {
      action: 'add',
      numbers: ['+1234567890', '+0987654321'],
    });
  });
}); 