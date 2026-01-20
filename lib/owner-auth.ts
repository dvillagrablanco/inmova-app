import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from './db';

import logger from '@/lib/logger';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d'; // 7 días
const COOKIE_NAME = 'owner-auth-token';

export interface OwnerTokenPayload {
  ownerId: string;
  email: string;
  companyId: string;
  nombreCompleto: string;
}

/**
 * Genera un JWT token para un propietario
 */
export function generateOwnerToken(payload: OwnerTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

/**
 * Verifica y decodifica un JWT token
 */
export function verifyOwnerToken(token: string): OwnerTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as OwnerTokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Establece el token de autenticación en una cookie httpOnly
 */
export async function setOwnerAuthCookie(token: string) {
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
export async function removeOwnerAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Obtiene el propietario autenticado desde el token en la cookie
 */
export async function getAuthenticatedOwner() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const payload = verifyOwnerToken(token);
    if (!payload) {
      return null;
    }

    // Verificar que el propietario existe y está activo
    const owner = await prisma.owner.findUnique({
      where: { id: payload.ownerId },
      include: {
        company: {
          select: {
            id: true,
            nombre: true,
            logoUrl: true,
          },
        },
        ownerBuildings: {
          include: {
            building: {
              select: {
                id: true,
                nombre: true,
                direccion: true,
                tipo: true,
                imagenes: true,
              },
            },
          },
        },
      },
    });

    if (!owner || !owner.activo) {
      return null;
    }

    return {
      ...owner,
      password: undefined, // No exponer el password
    };
  } catch (error) {
    logger.error('Error al obtener propietario autenticado:', error);
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
export async function requireOwnerAuth(req: NextRequest) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return { authenticated: false, error: 'No autenticado', status: 401 };
  }

  const payload = verifyOwnerToken(token);
  if (!payload) {
    return { authenticated: false, error: 'Token inválido o expirado', status: 401 };
  }

  // Verificar que el propietario existe y está activo
  const owner = await prisma.owner.findUnique({
    where: { id: payload.ownerId },
    include: {
      ownerBuildings: {
        include: {
          building: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      },
    },
  });

  if (!owner || !owner.activo) {
    return { authenticated: false, error: 'Propietario no encontrado o inactivo', status: 403 };
  }

  return {
    authenticated: true,
    owner: {
      ...owner,
      password: undefined,
    },
  };
}

/**
 * Verifica si el propietario tiene acceso a un edificio específico
 */
export async function ownerHasAccessToBuilding(ownerId: string, buildingId: string): Promise<boolean> {
  const ownerBuilding = await prisma.ownerBuilding.findFirst({
    where: {
      ownerId,
      buildingId,
    },
  });
  
  return !!ownerBuilding;
}
