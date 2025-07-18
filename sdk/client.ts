import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { API_BASE_URL, getAccessToken } from './config.js';
import { ApiError } from './types.js';

export interface CallPurityClient {
  auth: ReturnType<typeof createAuthModule>;
  accounts: ReturnType<typeof createAccountsModule>;
  organizations: ReturnType<typeof createOrganizationsModule>;
  dids: ReturnType<typeof createDidsModule>;
}

// Create axios instance with base configuration
const instance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
instance.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle errors
instance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const apiError: ApiError = {
        message: data.message || 'API request failed',
        status,
        code: data.code,
      };
      throw apiError;
    }
    throw error;
  }
);

// Import module factories
import { createAuthModule } from './modules/auth.js';
import { createAccountsModule } from './modules/accounts.js';
import { createOrganizationsModule } from './modules/organizations.js';
import { createDidsModule } from './modules/dids.js';

// Compose the SDK
export const CallPuritySDK = {
  auth: createAuthModule(instance),
  accounts: createAccountsModule(instance),
  organizations: createOrganizationsModule(instance),
  dids: createDidsModule(instance),
} satisfies CallPurityClient;

export default CallPuritySDK;
