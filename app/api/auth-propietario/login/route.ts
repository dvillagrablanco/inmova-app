import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';
import { generateOwnerToken, setOwnerAuthCookie } from '@/lib/owner-auth';

export const dynamic = 'force-dynamic';

// POST /api/auth-propietario/login - Login para propietarios
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar propietario por email
    const owner = await prisma.owner.findFirst({
      where: { email },
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

    if (!owner) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar que el propietario está activo
    if (!owner.activo) {
      return NextResponse.json(
        { error: 'Cuenta inactiva. Contacta con administración.' },
        { status: 403 }
      );
    }

    // Verificar si la cuenta está bloqueada por intentos fallidos
    if (owner.lockoutUntil && owner.lockoutUntil > new Date()) {
      const minutosRestantes = Math.ceil(
        (owner.lockoutUntil.getTime() - Date.now()) / (1000 * 60)
      );
      return NextResponse.json(
        { 
          error: `Cuenta bloqueada temporalmente. Intenta de nuevo en ${minutosRestantes} minutos.` 
        },
        { status: 403 }
      );
    }

    // Verificar contraseña
    if (!owner.password) {
      return NextResponse.json(
        { error: 'Cuenta sin configurar. Contacta con administración.' },
        { status: 403 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, owner.password);

    if (!isPasswordValid) {
      // Incrementar contador de intentos fallidos
      const newLoginAttempts = (owner.loginAttempts || 0) + 1;
      const shouldLockout = newLoginAttempts >= 5;

      await prisma.owner.update({
        where: { id: owner.id },
        data: {
          loginAttempts: newLoginAttempts,
          lockoutUntil: shouldLockout 
            ? new Date(Date.now() + 30 * 60 * 1000) // Bloquear por 30 minutos
            : null,
        },
      });

      if (shouldLockout) {
        return NextResponse.json(
          { error: 'Demasiados intentos fallidos. Cuenta bloqueada por 30 minutos.' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Credenciales inválidas',
          intentosRestantes: 5 - newLoginAttempts,
        },
        { status: 401 }
      );
    }

    // Restablecer intentos de login y actualizar último acceso
    await prisma.owner.update({
      where: { id: owner.id },
      data: { 
        lastLogin: new Date(),
        loginAttempts: 0,
        lockoutUntil: null,
      },
    });

    // Generar token JWT
    const token = generateOwnerToken({
      ownerId: owner.id,
      email: owner.email || '',
      companyId: owner.companyId,
      nombreCompleto: owner.nombreCompleto,
    });

    // Establecer cookie httpOnly
    setOwnerAuthCookie(token);

    // Devolver datos del propietario (sin password)
    const { password: _, loginAttempts, lockoutUntil, resetToken, resetTokenExpiry, ...ownerSinPassword } = owner;

    return NextResponse.json({
      success: true,
      owner: ownerSinPassword,
      message: 'Inicio de sesión exitoso',
    });
  } catch (error) {
    logger.error('Error en login de propietario:', error);
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}
