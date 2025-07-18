import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { createAuthModule } from '../modules/auth.js';
import { setAccessToken } from '../config.js';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('Auth Module', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      post: vi.fn(),
    };
  });

  it('should login successfully and store access token', async () => {
    const mockResponse = {
      data: {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        expiresAt: '2024-01-01T00:00:00Z',
      },
    };

    mockClient.post.mockResolvedValue(mockResponse);

    const authModule = createAuthModule(mockClient);
    const result = await authModule.login('test@example.com', 'password123');

    expect(mockClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result).toEqual(mockResponse.data);
  });

  it('should refresh token successfully', async () => {
    const mockResponse = {
      data: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
        expiresAt: '2024-01-01T00:00:00Z',
      },
    };

    mockClient.post.mockResolvedValue(mockResponse);

    const authModule = createAuthModule(mockClient);
    const result = await authModule.refresh('old-refresh-token');

    expect(mockClient.post).toHaveBeenCalledWith('/auth/refresh', {
      refreshToken: 'old-refresh-token',
    });

    expect(result).toEqual(mockResponse.data);
  });
}); 