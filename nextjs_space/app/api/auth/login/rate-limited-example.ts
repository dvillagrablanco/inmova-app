/**
 * EJEMPLO: Cómo aplicar Rate Limiting en endpoints de autenticación
 * 
 * Este archivo es un EJEMPLO de cómo integrar rate limiting en tus APIs.
 * Copia este patrón a tus endpoints existentes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import logger, { logSecurityEvent } from '@/lib/logger';

export async function POST(request: NextRequest) {
  // ✅ PASO 1: Aplicar rate limiting PRIMERO
  const rateLimitResponse = await applyRateLimit(request, 'auth');
  if (rateLimitResponse) {
    // Si se excedió el rate limit, retornar 429 inmediatamente
    logger.warn('Rate limit exceeded on login attempt', {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });
    return rateLimitResponse;
  }

  // ✅ PASO 2: Tu lógica de autenticación
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      logSecurityEvent('login-failed-user-not-found', email);
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      logSecurityEvent('login-failed-invalid-password', email);
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Login exitoso
    logger.info('User logged in successfully', { userId: user.id });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Login error', { error });
    return NextResponse.json(
      { error: 'Error en el inicio de sesión' },
      { status: 500 }
    );
  }
}
