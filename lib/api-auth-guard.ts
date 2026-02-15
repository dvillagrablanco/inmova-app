/**
 * API Auth Guard - Utilidad para proteger API routes
 * 
 * Proporciona helpers para verificar autenticacion en diferentes contextos:
 * - NextAuth sessions (dashboard, admin)
 * - JWT tokens (portales: proveedor, inquilino, propietario, partners)
 * - Cron secrets (jobs programados)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

/**
 * Verifica que el request tiene una sesion NextAuth valida.
 * Retorna la sesion si existe, o una respuesta 401 si no.
 */
export async function requireSession(request?: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return {
        authenticated: false as const,
        response: NextResponse.json(
          { error: 'No autenticado' },
          { status: 401 }
        ),
      };
    }
    return {
      authenticated: true as const,
      session,
      user: session.user,
    };
  } catch (error) {
    logger.error('[Auth Guard] Error verificando sesion:', error);
    return {
      authenticated: false as const,
      response: NextResponse.json(
        { error: 'Error de autenticacion' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Verifica que el request tiene un JWT valido en el header Authorization.
 * Usado por portales que tienen su propia autenticacion JWT.
 */
export async function requireJWT(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      authenticated: false as const,
      response: NextResponse.json(
        { error: 'Token de autorizacion requerido' },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.substring(7);
  const JWT_SECRET = process.env.NEXTAUTH_SECRET;

  if (!JWT_SECRET) {
    logger.error('[Auth Guard] NEXTAUTH_SECRET no configurado');
    return {
      authenticated: false as const,
      response: NextResponse.json(
        { error: 'Error de configuracion del servidor' },
        { status: 500 }
      ),
    };
  }

  try {
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, JWT_SECRET) as Record<string, unknown>;
    return {
      authenticated: true as const,
      payload: decoded,
    };
  } catch {
    return {
      authenticated: false as const,
      response: NextResponse.json(
        { error: 'Token invalido o expirado' },
        { status: 401 }
      ),
    };
  }
}

/**
 * Verifica que el request proviene de un cron job autorizado.
 * Compara el header Authorization con CRON_SECRET.
 */
export function requireCronSecret(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    logger.warn('[Auth Guard] CRON_SECRET no configurado - cron jobs desprotegidos');
    return { authenticated: true as const };
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return {
      authenticated: false as const,
      response: NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      ),
    };
  }

  return { authenticated: true as const };
}
