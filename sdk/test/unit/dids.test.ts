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
        dids: [
          {
            number: '+1234567890',
            branded_name: 'Test DID',
            approved: true,
            tmobile_caller_id: 'Test Caller',
            verizon_caller_id: 'Test Caller',
            att_caller_id: 'Test Caller',
            tmobile_is_spam: false,
            verizon_is_spam: false,
            att_is_spam: false,
          },
        ],
        page: 1,
        page_size: 20,
        total_count: 1,
        total_pages: 1,
      },
    };

    mockClient.get.mockResolvedValue(mockResponse);

    const didsModule = createDidsModule(mockClient);
    const result = await didsModule.list('acc-123', 'org-456', 1, 20);

    expect(mockClient.get).toHaveBeenCalledWith('/account/acc-123/organization/org-456/dids', {
      params: { page: 1, page_size: 20 },
    });

    expect(result).toEqual(mockResponse.data);
  });

  it('should add a DID', async () => {
    mockClient.post.mockResolvedValue({});

    const didsModule = createDidsModule(mockClient);
    await didsModule.add('acc-123', 'org-456', '+1234567890', 'Test DID');

    expect(mockClient.post).toHaveBeenCalledWith('/account/acc-123/organization/org-456/did', {
      number: '+1234567890',
      branded_name: 'Test DID',
    });
  });

  it('should remove a DID', async () => {
    mockClient.delete.mockResolvedValue({});

    const didsModule = createDidsModule(mockClient);
    await didsModule.remove('acc-123', 'org-456', '+1234567890');

    expect(mockClient.delete).toHaveBeenCalledWith('/account/acc-123/organization/org-456/did/+1234567890');
  });

  it('should perform bulk operations', async () => {
    mockClient.post.mockResolvedValue({});

    const didsModule = createDidsModule(mockClient);
    await didsModule.bulk('acc-123', 'org-456', 'add', [
      { number: '+1234567890', branded_name: 'Test DID 1' },
      { number: '+0987654321', branded_name: 'Test DID 2' }
    ]);

    expect(mockClient.post).toHaveBeenCalledWith('/account/acc-123/organization/org-456/did/bulk', {
      action: 'add',
      numbers: [
        { number: '+1234567890', branded_name: 'Test DID 1' },
        { number: '+0987654321', branded_name: 'Test DID 2' }
      ],
      organization_id: 'org-456',
    });
  });
}); 