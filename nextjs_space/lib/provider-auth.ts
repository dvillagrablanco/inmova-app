import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d'; // 7 días
const COOKIE_NAME = 'provider-auth-token';

export interface ProviderTokenPayload {
  providerId: string;
  email: string;
  companyId: string;
  nombre: string;
}

/**
 * Genera un JWT token para un proveedor
 */
export function generateProviderToken(payload: ProviderTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

/**
 * Verifica y decodifica un JWT token
 */
export function verifyProviderToken(token: string): ProviderTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as ProviderTokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Establece el token de autenticación en una cookie httpOnly
 */
export async function setProviderAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: '/',
  });
}

/**
 * Elimina la cookie de autenticación
 */
export async function removeProviderAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Obtiene el proveedor autenticado desde el token en la cookie
 */
export async function getAuthenticatedProvider() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const payload = verifyProviderToken(token);
    if (!payload) {
      return null;
    }

    // Verificar que el proveedor existe y está activo
    const provider = await prisma.provider.findUnique({
      where: { id: payload.providerId },
      include: {
        company: {
          select: {
            id: true,
            nombre: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!provider || !provider.activo) {
      return null;
    }

    return {
      ...provider,
      password: undefined, // No exponer el password
    };
  } catch (error) {
    console.error('Error al obtener proveedor autenticado:', error);
    return null;
  }
}

/**
 * Extrae el token del request (cookie o header)
 */
export function getTokenFromRequest(req: NextRequest): string | null {
  // Primero intentar obtener de la cookie
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // Si no hay cookie, intentar obtener del header Authorization
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Middleware para verificar autenticación en API routes
 */
export async function requireProviderAuth(req: NextRequest) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return { authenticated: false, error: 'No autenticado', status: 401 };
  }

  const payload = verifyProviderToken(token);
  if (!payload) {
    return { authenticated: false, error: 'Token inválido o expirado', status: 401 };
  }

  // Verificar que el proveedor existe y está activo
  const provider = await prisma.provider.findUnique({
    where: { id: payload.providerId },
  });

  if (!provider || !provider.activo) {
    return { authenticated: false, error: 'Proveedor no encontrado o inactivo', status: 403 };
  }

  return {
    authenticated: true,
    provider: {
      ...provider,
      password: undefined,
    },
  };
}
