import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  InmovaConfig,
  InmovaError,
  Property,
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyListParams,
  PaginatedResponse,
  ApiKey,
  CreateApiKeyInput,
  WebhookSubscription,
  CreateWebhookInput,
} from './types';

export class InmovaClient {
  private axiosInstance: AxiosInstance;
  private config: Required<InmovaConfig>;

  constructor(config: InmovaConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://inmovaapp.com/api/v1',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const inmovaError: InmovaError = {
            error: (error.response.data as any)?.error || 'Unknown error',
            code: (error.response.data as any)?.code,
            details: (error.response.data as any)?.details,
            statusCode: error.response.status,
          };
          throw inmovaError;
        }
        throw error;
      }
    );
  }

  /**
   * Properties API
   */
  properties = {
    /**
     * List properties with optional filters
     */
    list: async (params?: PropertyListParams): Promise<PaginatedResponse<Property>> => {
      const response = await this.axiosInstance.get<PaginatedResponse<Property>>('/properties', {
        params,
      });
      return response.data;
    },

    /**
     * Get a single property by ID
     */
    get: async (id: string): Promise<Property> => {
      const response = await this.axiosInstance.get<{ success: boolean; data: Property }>(
        `/properties/${id}`
      );
      return response.data.data;
    },

    /**
     * Create a new property
     */
    create: async (data: CreatePropertyInput): Promise<Property> => {
      const response = await this.axiosInstance.post<{ success: boolean; data: Property }>(
        '/properties',
        data
      );
      return response.data.data;
    },

    /**
     * Update an existing property
     */
    update: async (id: string, data: UpdatePropertyInput): Promise<Property> => {
      const response = await this.axiosInstance.put<{ success: boolean; data: Property }>(
        `/properties/${id}`,
        data
      );
      return response.data.data;
    },

    /**
     * Delete a property
     */
    delete: async (id: string): Promise<void> => {
      await this.axiosInstance.delete(`/properties/${id}`);
    },
  };

  /**
   * API Keys API
   */
  apiKeys = {
    /**
     * List API keys
     */
    list: async (): Promise<ApiKey[]> => {
      const response = await this.axiosInstance.get<{ success: boolean; data: ApiKey[] }>(
        '/api-keys'
      );
      return response.data.data;
    },

    /**
     * Create a new API key
     */
    create: async (data: CreateApiKeyInput): Promise<ApiKey> => {
      const response = await this.axiosInstance.post<{ success: boolean; data: ApiKey }>(
        '/api-keys',
        data
      );
      return response.data.data;
    },

    /**
     * Revoke an API key
     */
    revoke: async (id: string): Promise<void> => {
      await this.axiosInstance.delete(`/api-keys/${id}`);
    },
  };

  /**
   * Webhooks API
   */
  webhooks = {
    /**
     * List webhook subscriptions
     */
    list: async (): Promise<WebhookSubscription[]> => {
      const response = await this.axiosInstance.get<{
        success: boolean;
        data: WebhookSubscription[];
      }>('/webhooks');
      return response.data.data;
    },

    /**
     * Create a webhook subscription
     */
    create: async (data: CreateWebhookInput): Promise<WebhookSubscription> => {
      const response = await this.axiosInstance.post<{
        success: boolean;
        data: WebhookSubscription;
      }>('/webhooks', data);
      return response.data.data;
    },

    /**
     * Delete a webhook subscription
     */
    delete: async (id: string): Promise<void> => {
      await this.axiosInstance.delete(`/webhooks/${id}`);
    },

    /**
     * Verify webhook signature
     */
    verifySignature: (payload: string, signature: string, secret: string): boolean => {
      const crypto = require('crypto');
      const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      return signature === expectedSignature;
    },
  };
}
