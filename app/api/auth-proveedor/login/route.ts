import { NextRequest, NextResponse } from 'next/server';

import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';
import { generateProviderToken, setProviderAuthCookie } from '@/lib/provider-auth';
import { isAccountLocked, recordFailedAttempt, clearLockout } from '@/lib/account-lockout';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma loading (auditoria 2026-02-11)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// POST /api/auth-proveedor/login - Login para proveedores
export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Check account lockout before any DB query
    const lockStatus = isAccountLocked(email);
    if (lockStatus.locked) {
      const minutesLeft = Math.ceil(lockStatus.remainingSeconds / 60);
      return NextResponse.json(
        { error: `Cuenta bloqueada temporalmente. Intenta de nuevo en ${minutesLeft} minutos.` },
        { status: 429 }
      );
    }

    // Buscar proveedor por email
    const proveedor = await prisma.provider.findFirst({
      where: { email },
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

    if (!proveedor) {
      // Record failed attempt even for non-existent accounts (prevents enumeration timing)
      recordFailedAttempt(email);
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar que el proveedor está activo
    if (!proveedor.activo) {
      return NextResponse.json(
        { error: 'Cuenta inactiva. Contacta con administración.' },
        { status: 403 }
      );
    }

    // Verificar contraseña
    if (!proveedor.password) {
      return NextResponse.json(
        { error: 'Cuenta sin configurar. Contacta con administración.' },
        { status: 403 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, proveedor.password);

    if (!isPasswordValid) {
      const lockResult = recordFailedAttempt(email);
      if (lockResult.locked) {
        return NextResponse.json(
          { error: 'Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Login exitoso: clear lockout
    clearLockout(email);

    // Actualizar último acceso
    await prisma.provider.update({
      where: { id: proveedor.id },
      data: { ultimoAcceso: new Date() },
    });

    // Generar token JWT
    const token = generateProviderToken({
      providerId: proveedor.id,
      email: proveedor.email || '',
      companyId: proveedor.companyId,
      nombre: proveedor.nombre,
    });

    // Establecer cookie httpOnly
    setProviderAuthCookie(token);

    // Devolver datos del proveedor (sin password)
    const { password: _, ...proveedorSinPassword } = proveedor;

    return NextResponse.json({
      success: true,
      proveedor: proveedorSinPassword,
      message: 'Inicio de sesión exitoso',
    });
  } catch (error) {
    logger.error('Error en login de proveedor:', error);
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}
