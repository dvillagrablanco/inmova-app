import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import logger, { logError } from './logger';

/**
 * Genera un token CSRF aleatorio
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verifica un token CSRF
 */
export function verifyCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) {
    return false;
  }

  // Usar comparación de tiempo constante para prevenir timing attacks
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
}

/**
 * Nombre de la cookie para el token CSRF
 */
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Configura el token CSRF en una cookie
 */
export function setCSRFCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 horas
    path: '/',
  });

  return response;
}

/**
 * Obtiene el token CSRF de la cookie
 */
export function getCSRFTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value || null;
}

/**
 * Obtiene el token CSRF del header o body
 */
export function getCSRFTokenFromRequest(request: NextRequest): string | null {
  // Primero intentar del header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (headerToken) {
    return headerToken;
  }

  // Luego intentar del body (para forms HTML tradicionales)
  // Nota: esto requiere que el body ya esté parseado
  return null;
}

/**
 * Middleware de CSRF para API routes
 */
export async function validateCSRF(request: NextRequest): Promise<boolean> {
  // Solo validar para métodos que modifican datos
  const method = request.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return true; // GET, HEAD, OPTIONS no requieren CSRF
  }

  // Excepciones: rutas de autenticación
  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/signup') ||
    pathname.startsWith('/api/portal-inquilino/login')
  ) {
    return true;
  }

  const cookieToken = getCSRFTokenFromCookie(request);
  const requestToken = getCSRFTokenFromRequest(request);

  if (!cookieToken || !requestToken) {
    logError(new Error('CSRF token missing'), {
      path: pathname,
      method,
      hasCookie: !!cookieToken,
      hasHeader: !!requestToken,
    });
    return false;
  }

  try {
    const isValid = verifyCSRFToken(requestToken, cookieToken);

    if (!isValid) {
      logError(new Error('CSRF token mismatch'), {
        path: pathname,
        method,
      });
    }

    return isValid;
  } catch (error) {
    logError(error instanceof Error ? error : new Error('CSRF validation error'), {
      path: pathname,
      method,
    });
    return false;
  }
}

/**
 * Hook para obtener el token CSRF en el cliente
 */
export async function getCSRFToken(): Promise<string> {
  try {
    const response = await fetch('/api/csrf-token');
    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token');
    }
    const data = await response.json();
    return data.token;
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Failed to get CSRF token'));
    throw error;
  }
}

/**
 * Helper para incluir el token CSRF en fetch requests
 */
export async function fetchWithCSRF(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getCSRFToken();

  const headers = new Headers(options.headers || {});
  headers.set(CSRF_HEADER_NAME, token);

  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin',
  });
}
