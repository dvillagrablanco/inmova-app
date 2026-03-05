/**
 * SSRF Protection
 * 
 * Validates URLs to prevent Server-Side Request Forgery attacks.
 * Blocks requests to private/internal IP ranges and localhost.
 * 
 * OWASP A10:2021 – Server-Side Request Forgery (SSRF)
 */

import logger from '@/lib/logger';

const PRIVATE_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^127\./,
  /^0\./,
  /^169\.254\./, // Link-local
  /^fc00:/i, // IPv6 private
  /^fe80:/i, // IPv6 link-local
  /^::1$/, // IPv6 loopback
  /^fd/i, // IPv6 unique local
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'metadata.google.internal',
  'metadata.google',
  '169.254.169.254', // AWS metadata
  'metadata',
  'kubernetes.default',
];

const ALLOWED_DOMAINS = [
  'api.stripe.com',
  'challenges.cloudflare.com',
  'api.anthropic.com',
  'smtp.gmail.com',
  'api.twilio.com',
  'nominatim.openstreetmap.org',
  'subastas.boe.es',
  'inmova.s3.amazonaws.com',
  'inmova.s3.eu-north-1.amazonaws.com',
];

/**
 * Validate a URL is safe to request (not SSRF)
 */
export function validateUrl(urlString: string, options?: { allowList?: string[] }): { safe: boolean; error?: string } {
  try {
    const url = new URL(urlString);

    // Block non-http(s) protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { safe: false, error: `Protocolo no permitido: ${url.protocol}` };
    }

    // Block blocked hostnames
    const hostname = url.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.some(h => hostname === h || hostname.endsWith('.' + h))) {
      logger.warn(`[SSRF] Blocked hostname: ${hostname}`);
      return { safe: false, error: 'Hostname bloqueado' };
    }

    // Block private IPs
    if (PRIVATE_IP_RANGES.some(regex => regex.test(hostname))) {
      logger.warn(`[SSRF] Blocked private IP: ${hostname}`);
      return { safe: false, error: 'IP privada no permitida' };
    }

    // If allow list provided, enforce it
    if (options?.allowList) {
      const allowed = [...ALLOWED_DOMAINS, ...options.allowList];
      if (!allowed.some(d => hostname === d || hostname.endsWith('.' + d))) {
        return { safe: false, error: `Dominio no en lista blanca: ${hostname}` };
      }
    }

    return { safe: true };
  } catch {
    return { safe: false, error: 'URL inválida' };
  }
}

/**
 * Safe fetch that validates URL before requesting
 */
export async function safeFetch(url: string, options?: RequestInit & { allowList?: string[] }): Promise<Response> {
  const validation = validateUrl(url, { allowList: options?.allowList });
  if (!validation.safe) {
    throw new Error(`SSRF blocked: ${validation.error}`);
  }

  const { allowList, ...fetchOptions } = options || {};
  return fetch(url, { ...fetchOptions, signal: AbortSignal.timeout(30000) });
}
