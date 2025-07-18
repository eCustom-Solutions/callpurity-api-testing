import { AxiosInstance } from 'axios';
import { AuthResponse, LoginRequest, RefreshRequest } from '../types.js';
import { setAccessToken } from '../config.js';

export const createAuthModule = (client: AxiosInstance) => ({
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await client.post<AuthResponse>('/auth/login', {
      email,
      password,
    } as LoginRequest);
    
    const authData = response.data;
    setAccessToken(authData.access_token);
    
    return authData;
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const response = await client.post<AuthResponse>('/auth/refresh', {
      refreshToken,
    } as RefreshRequest);
    
    const authData = response.data;
    setAccessToken(authData.access_token);
    
    return authData;
  },
}); 