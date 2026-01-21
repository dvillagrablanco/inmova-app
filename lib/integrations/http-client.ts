import logger from '@/lib/logger';
import { executeWithCircuitBreaker } from './circuit-breaker';

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeoutMs?: number;
  circuitKey?: string;
}

export async function fetchJson<T>(
  url: string,
  options: HttpRequestOptions = {}
): Promise<{ data: T; response: Response }> {
  const timeoutMs = options.timeoutMs ?? 15_000;
  const circuitKey = options.circuitKey ?? url;

  return executeWithCircuitBreaker(circuitKey, async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      const text = await response.text();
      const data = text ? (JSON.parse(text) as T) : ({} as T);

      if (!response.ok) {
        logger.warn('[HTTP] Request failed', { url, status: response.status, body: text });
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      return { data, response };
    } finally {
      clearTimeout(timeout);
    }
  });
}
