/**
 * CSRF Protection Implementation
 * Protección contra ataques Cross-Site Request Forgery
 *
 * Compatible con Edge Runtime (usa Web Crypto API)
 */

import { NextRequest, NextResponse } from 'next/server';

// Secret para firmar tokens CSRF (debe estar en .env en producción)
const CSRF_SECRET = process.env.CSRF_SECRET || 'inmova-csrf-secret-change-in-production';
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Convierte un ArrayBuffer a string hexadecimal
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convierte un string a ArrayBuffer
 */
function stringToBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Genera un token CSRF seguro usando Web Crypto API
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return bufferToHex(array.buffer);
}

// ----------------------------------------------------------------------------
// Aliases de compatibilidad (nomenclatura legacy en rutas API)
// ----------------------------------------------------------------------------
export const generateCSRFToken = generateCsrfToken;

/**
 * Firma un token CSRF con HMAC usando Web Crypto API
 */
export async function signCsrfToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(CSRF_SECRET);

  // Importar la clave para HMAC
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Firmar el token
  const signature = await crypto.subtle.sign('HMAC', key, stringToBuffer(token));

  return bufferToHex(signature);
}

/**
 * Verifica que un token CSRF es válido
 */
export async function verifyCsrfToken(token: string, signature: string): Promise<boolean> {
  const expectedSignature = await signCsrfToken(token);

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

export const getCSRFTokenFromCookie = getCsrfTokenFromCookies;

/**
 * Setea la cookie CSRF en una respuesta (compatibilidad con rutas legacy).
 */
export function setCSRFCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 horas
  });

  // Para que el cliente pueda leerlo si lo necesita
  response.headers.set('X-CSRF-Token', token);
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
export async function validateCsrfToken(request: NextRequest): Promise<boolean> {
  const cookieToken = getCsrfTokenFromCookies(request);
  const requestToken = getCsrfTokenFromRequest(request);

  if (!cookieToken || !requestToken) {
    return false;
  }

  // Verificar que los tokens coinciden (comparación simple para tokens no firmados)
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
  const isValid = await validateCsrfToken(request);
  if (!isValid) {
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
    const isValid = await validateCsrfToken(request);
    if (!isValid) {
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
 */
import React from 'react';

export function CsrfTokenMeta({ token }: { token: string }) {
  return React.createElement('meta', { name: 'csrf-token', content: token });
}

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
