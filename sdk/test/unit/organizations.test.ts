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
      id: 'org-123',
      accountId: 'acc-456',
      name: 'Test Organization',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    mockClient.get.mockResolvedValue({ data: mockOrganization });

    const organizationsModule = createOrganizationsModule(mockClient);
    const result = await organizationsModule.get('acc-456', 'org-123');

    expect(mockClient.get).toHaveBeenCalledWith('/accounts/acc-456/organizations/org-123');
    expect(result).toEqual(mockOrganization);
    expect(result.accountId).toBe('acc-456');
    expect(result.id).toBe('org-123');
  });

  it('should create organization with valid payload', async () => {
    const createPayload = {
      name: 'New Organization',
    };

    const mockCreatedOrganization = {
      id: 'org-789',
      accountId: 'acc-456',
      name: 'New Organization',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    mockClient.post.mockResolvedValue({ data: mockCreatedOrganization });

    const organizationsModule = createOrganizationsModule(mockClient);
    const result = await organizationsModule.create('acc-456', createPayload);

    expect(mockClient.post).toHaveBeenCalledWith('/accounts/acc-456/organizations', createPayload);
    expect(result).toEqual(mockCreatedOrganization);
    expect(result.name).toBe('New Organization');
    expect(result.accountId).toBe('acc-456');
  });

  it('should validate organization creation payload structure', async () => {
    const createPayload = {
      name: 'Test Organization',
    };

    const mockCreatedOrganization = {
      id: 'org-123',
      accountId: 'acc-456',
      name: 'Test Organization',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    mockClient.post.mockResolvedValue({ data: mockCreatedOrganization });

    const organizationsModule = createOrganizationsModule(mockClient);
    const result = await organizationsModule.create('acc-456', createPayload);

    // Validate payload structure
    expect(createPayload).toHaveProperty('name');
    expect(typeof createPayload.name).toBe('string');
    expect(createPayload.name.length).toBeGreaterThan(0);

    // Validate response structure
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('accountId');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('updatedAt');
  });

  it('should handle organization creation with empty name', async () => {
    const createPayload = {
      name: '',
    };

    const mockCreatedOrganization = {
      id: 'org-123',
      accountId: 'acc-456',
      name: '',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    mockClient.post.mockResolvedValue({ data: mockCreatedOrganization });

    const organizationsModule = createOrganizationsModule(mockClient);
    const result = await organizationsModule.create('acc-456', createPayload);

    expect(mockClient.post).toHaveBeenCalledWith('/accounts/acc-456/organizations', createPayload);
    expect(result.name).toBe('');
  });
}); 