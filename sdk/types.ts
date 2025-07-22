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
  account_name: string;
  organizations: Organization[];
}

export interface AccountWithOrganizations {
  account_id: string;
  account_name: string;
  organizations: Organization[];
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

export interface CreateOrganizationResponse {
  organization_id: string;
}

export interface OrganizationDetailResponse {
  registration_date: string;
  approval_status: string;
  name: string | null;
}

export interface OrganizationDid {
  number: string;
  branded_name: string | null;
  approved: boolean;
  tmobile_caller_id: string | null;
  verizon_caller_id: string | null;
  att_caller_id: string | null;
  tmobile_is_spam: boolean | null;
  verizon_is_spam: boolean | null;
  att_is_spam: boolean | null;
}

export interface OrganizationDidRequest {
  number: string;
  branded_name: string | null;
}

export interface OrganizationDidListResponse {
  dids: OrganizationDid[];
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
}

export interface OrganizationDidResponse {
  did: OrganizationDid;
}

export interface BulkDidCrudRequest {
  numbers: OrganizationDidRequest[];
  organization_id: string;
  action: "add" | "delete";
}

export interface BulkDidCrudResponse {
  processedCount: number;
  skippedCount: number;
  inputCount: number;
  invalidCount: number;
}

// Legacy types for backward compatibility
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