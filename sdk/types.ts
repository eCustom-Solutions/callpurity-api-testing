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

export interface BusinessInfo {
  legal_company_name: string;
  dba: string | null;
  ein: string;
  business_phone_number: string;
  employee_count: number | null;
  website: string | null;
  quantity_of_phone_numbers: number | null;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

export interface ContactInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface CallingBehavior {
  telecom_provider: string | null;
  own_dids: boolean | null;
  dialing_opt_in_data: boolean | null;
  using_opt_in_data_provider: boolean | null;
  tcpa_dnc_violation: string | null;
  calls_per_day: number | null;
  max_redial_attempts_daily_per_lead: number | null;
  max_redial_attempts_weekly_per_lead: number | null;
}

export interface CreateOrganizationRequest {
  business_info: BusinessInfo;
  contact_info: ContactInfo;
  calling_behavior: CallingBehavior;
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