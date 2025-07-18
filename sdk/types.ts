export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: string;
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