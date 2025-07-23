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

  it('should add a DID (throws for invalid number)', async () => {
    const didsModule = createDidsModule(mockClient);
    // Invalid number
    await expect(didsModule.add('acc-123', 'org-456', '+1234567890', 'Test DID')).rejects.toThrow('Invalid DID number');
    // Valid number
    mockClient.post.mockResolvedValue({});
    await expect(didsModule.add('acc-123', 'org-456', '5551231234', 'Test DID')).resolves.toBeUndefined();
  });

  it('should remove a DID (throws for invalid number)', async () => {
    const didsModule = createDidsModule(mockClient);
    // Invalid number
    await expect(didsModule.remove('acc-123', 'org-456', '+1234567890')).rejects.toThrow('Invalid DID number');
    // Valid number
    mockClient.delete.mockResolvedValue({});
    await expect(didsModule.remove('acc-123', 'org-456', '5551231234')).resolves.toBeUndefined();
  });

  it('should perform bulk operations (throws for invalid number)', async () => {
    const didsModule = createDidsModule(mockClient);
    // Invalid number in bulk
    await expect(didsModule.bulk('acc-123', 'org-456', 'add', [
      { number: '+1234567890', branded_name: 'Test DID 1' },
      { number: '5551231234', branded_name: 'Test DID 2' }
    ])).rejects.toThrow('Invalid DID number');
    // All valid numbers
    mockClient.post.mockResolvedValue({});
    await expect(didsModule.bulk('acc-123', 'org-456', 'add', [
      { number: '5551231234', branded_name: 'Test DID 1' },
      { number: '5559876543', branded_name: 'Test DID 2' }
    ])).resolves.toBeUndefined();
  });

  it('should throw error for invalid DID number in add', async () => {
    const didsModule = createDidsModule(mockClient);
    await expect(didsModule.add('acc-123', 'org-456', '+15551231234', 'Test DID')).rejects.toThrow('Invalid DID number');
    await expect(didsModule.add('acc-123', 'org-456', '1234567890', 'Test DID')).rejects.toThrow('Invalid DID number');
  });

  it('should throw error for invalid DID number in remove', async () => {
    const didsModule = createDidsModule(mockClient);
    await expect(didsModule.remove('acc-123', 'org-456', '+15551231234')).rejects.toThrow('Invalid DID number');
    await expect(didsModule.remove('acc-123', 'org-456', '1234567890')).rejects.toThrow('Invalid DID number');
  });

  it('should throw error for invalid DID number in bulk', async () => {
    const didsModule = createDidsModule(mockClient);
    await expect(didsModule.bulk('acc-123', 'org-456', 'add', [
      { number: '+15551231234', branded_name: 'Test DID 1' },
      { number: '5551231234', branded_name: 'Test DID 2' }
    ])).rejects.toThrow('Invalid DID number');
    await expect(didsModule.bulk('acc-123', 'org-456', 'add', [
      { number: '5551231234', branded_name: 'Test DID 1' },
      { number: '1234567890', branded_name: 'Test DID 2' }
    ])).rejects.toThrow('Invalid DID number');
  });

  it('should succeed for valid DID number in add/remove/bulk', async () => {
    mockClient.post.mockResolvedValue({});
    mockClient.delete.mockResolvedValue({});
    const didsModule = createDidsModule(mockClient);
    await expect(didsModule.add('acc-123', 'org-456', '5551231234', 'Test DID')).resolves.toBeUndefined();
    await expect(didsModule.remove('acc-123', 'org-456', '5551231234')).resolves.toBeUndefined();
    await expect(didsModule.bulk('acc-123', 'org-456', 'add', [
      { number: '5551231234', branded_name: 'Test DID 1' },
      { number: '5559876543', branded_name: 'Test DID 2' }
    ])).resolves.toBeUndefined();
  });
}); 