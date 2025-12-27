/**
 * CSRF Protection Implementation
 * Protección contra ataques Cross-Site Request Forgery
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHmac } from 'crypto';

// Secret para firmar tokens CSRF (debe estar en .env en producción)
const CSRF_SECRET = process.env.CSRF_SECRET || 'inmova-csrf-secret-change-in-production';
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Genera un token CSRF seguro
 */
export function generateCsrfToken(): string {
  const token = randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  return token;
}

/**
 * Firma un token CSRF con HMAC
 */
export function signCsrfToken(token: string): string {
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(token);
  return hmac.digest('hex');
}

/**
 * Verifica que un token CSRF es válido
 */
export function verifyCsrfToken(token: string, signature: string): boolean {
  const expectedSignature = signCsrfToken(token);

  // Comparación constante en tiempo para prevenir timing attacks
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Obtiene el token CSRF de las cookies
 */
export function getCsrfTokenFromCookies(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value || null;
}

/**
 * Obtiene el token CSRF del header o body
 */
export function getCsrfTokenFromRequest(request: NextRequest): string | null {
  // Primero intentar del header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (headerToken) return headerToken;

  // Fallback: intentar del body (para forms HTML tradicionales)
  // Nota: esto requiere parsear el body, que puede no estar disponible en middleware
  return null;
}

/**
 * Valida el token CSRF de una petición
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const cookieToken = getCsrfTokenFromCookies(request);
  const requestToken = getCsrfTokenFromRequest(request);

  if (!cookieToken || !requestToken) {
    return false;
  }

  // Verificar que los tokens coinciden
  return cookieToken === requestToken;
}

/**
 * Middleware de protección CSRF
 */
export async function csrfProtectionMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname, method } = request.nextUrl;

  // Solo aplicar CSRF protection en métodos que modifican estado
  const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!protectedMethods.includes(method)) {
    return null; // No aplicar protección
  }

  // Excluir rutas que no necesitan CSRF (webhooks, APIs públicas)
  const excludedPaths = [
    '/api/webhook',
    '/api/stripe/webhook',
    '/api/health',
    '/api/auth/callback', // OAuth callbacks
  ];

  if (excludedPaths.some((path) => pathname.startsWith(path))) {
    return null;
  }

  // Validar token CSRF
  if (!validateCsrfToken(request)) {
    return NextResponse.json(
      {
        error: 'Invalid CSRF token',
        message: 'CSRF validation failed. Please refresh the page and try again.',
      },
      {
        status: 403,
      }
    );
  }

  return null; // Token válido, continuar
}

/**
 * Agrega el token CSRF a la respuesta
 */
export function addCsrfTokenToResponse(response: NextResponse): NextResponse {
  // Generar nuevo token si no existe
  let token = response.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (!token) {
    token = generateCsrfToken();

    // Agregar cookie con el token
    response.cookies.set(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 horas
    });

    // Agregar header para que el cliente pueda leerlo
    response.headers.set('X-CSRF-Token', token);
  }

  return response;
}

/**
 * Helper para aplicar protección CSRF en API routes
 */
export async function withCsrfProtection(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Validar CSRF token
  const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (protectedMethods.includes(request.method)) {
    if (!validateCsrfToken(request)) {
      return NextResponse.json(
        {
          error: 'Invalid CSRF token',
          message: 'CSRF validation failed.',
        },
        { status: 403 }
      );
    }
  }

  // Ejecutar handler
  const response = await handler();

  // Agregar/renovar token CSRF en la respuesta
  return addCsrfTokenToResponse(response);
}

/**
 * Hook para obtener el token CSRF en el cliente
 * Este token debe ser incluido en todas las peticiones POST/PUT/PATCH/DELETE
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;

  // Buscar en meta tag
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    return metaTag.getAttribute('content');
  }

  // Buscar en cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }

  return null;
}

/**
 * Componente React para incluir el token CSRF en el HTML
 * TODO: Mover a un archivo .tsx
 */
/* export function CsrfTokenMeta({ token }: { token: string }) {
  return <meta name="csrf-token" content={token} />;
} */

/**
 * Fetch wrapper que incluye automáticamente el token CSRF
 */
export async function csrfFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getCsrfToken();

  const headers = new Headers(options.headers);
  if (token) {
    headers.set(CSRF_HEADER_NAME, token);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin', // Importante para cookies
  });
}
