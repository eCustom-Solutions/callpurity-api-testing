export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface Account {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  accountId: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
}

export interface DID {
  number: string;
  accountId: string;
  organizationId: string;
  brandedName?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddDIDRequest {
  number: string;
  brandedName?: string;
}

export interface BulkDIDRequest {
  action: "add" | "delete";
  numbers: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
} 