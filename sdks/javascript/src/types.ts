/**
 * Inmova SDK Types
 */

export interface InmovaConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Property Types
export type PropertyStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'SOLD';
export type PropertyType =
  | 'APARTMENT'
  | 'HOUSE'
  | 'ROOM'
  | 'STUDIO'
  | 'OFFICE'
  | 'PARKING'
  | 'STORAGE';

export interface Property {
  id: string;
  address: string;
  city: string;
  postalCode?: string;
  country?: string;
  price: number;
  rooms?: number;
  bathrooms?: number;
  squareMeters?: number;
  floor?: number;
  status: PropertyStatus;
  type: PropertyType;
  description?: string;
  features?: string[];
  photos?: PropertyPhoto[];
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyPhoto {
  id: string;
  url: string;
  order: number;
}

export interface CreatePropertyInput {
  address: string;
  city: string;
  postalCode?: string;
  country?: string;
  price: number;
  rooms?: number;
  bathrooms?: number;
  squareMeters?: number;
  floor?: number;
  status?: PropertyStatus;
  type: PropertyType;
  description?: string;
  features?: string[];
}

export interface UpdatePropertyInput extends Partial<CreatePropertyInput> {}

export interface PropertyListParams extends PaginationParams {
  status?: PropertyStatus;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  type?: PropertyType;
}

// API Key Types
export type ApiKeyStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface ApiKey {
  id: string;
  companyId: string;
  key: string;
  keyPrefix: string;
  name: string;
  description?: string;
  scopes: string[];
  status: ApiKeyStatus;
  rateLimit: number;
  expiresAt?: string;
  lastUsedAt?: string;
  lastUsedIp?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiKeyInput {
  name: string;
  description?: string;
  scopes?: string[];
  rateLimit?: number;
  expiresAt?: string;
}

// Webhook Types
export type WebhookEventType =
  | 'PROPERTY_CREATED'
  | 'PROPERTY_UPDATED'
  | 'PROPERTY_DELETED'
  | 'TENANT_CREATED'
  | 'TENANT_UPDATED'
  | 'CONTRACT_CREATED'
  | 'CONTRACT_SIGNED'
  | 'PAYMENT_CREATED'
  | 'PAYMENT_RECEIVED'
  | 'MAINTENANCE_CREATED'
  | 'MAINTENANCE_RESOLVED'
  | 'DOCUMENT_UPLOADED'
  | 'USER_CREATED';

export interface WebhookSubscription {
  id: string;
  companyId: string;
  url: string;
  events: WebhookEventType[];
  description?: string;
  secret: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookInput {
  url: string;
  events: WebhookEventType[];
  description?: string;
}

// Error Types
export interface InmovaError {
  error: string;
  code?: string;
  details?: Record<string, any>;
  statusCode: number;
}
