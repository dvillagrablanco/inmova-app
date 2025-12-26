import { NextRequest, NextResponse } from 'next/server';
import { resetPassword, validateResetToken } from '@/lib/tenant-invitation-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password, confirmPassword } = body;

    // Validaciones
    if (!token || !password || !confirmPassword) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Las contraseñas no coinciden' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Restablecer la contraseña
    await resetPassword(token, password);

    logger.info('Contraseña restablecida exitosamente', { token });

    return NextResponse.json({
      success: true,
      message: 'Contraseña restablecida exitosamente',
    });
  } catch (error: any) {
    logger.error('Error al restablecer contraseña', {
      error: error.message,
    });

    return NextResponse.json(
      { error: error.message || 'Error al restablecer la contraseña' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    }

    // Validar el token
    const validation = await validateResetToken(token);

    if (!validation.valid) {
      return NextResponse.json({ valid: false, error: validation.error }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      tenantName: validation.resetToken?.tenant.nombreCompleto,
    });
  } catch (error: any) {
    logger.error('Error al validar token', {
      error: error.message,
    });

    return NextResponse.json({ error: 'Error al validar el token' }, { status: 500 });
  }
}
