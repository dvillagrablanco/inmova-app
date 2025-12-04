import { NextRequest, NextResponse } from 'next/server';
import { acceptInvitation } from '@/lib/tenant-invitation-service';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invitationCode, password, confirmPassword } = body;

    // Validaciones
    if (!invitationCode || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Las contraseñas no coinciden' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Aceptar la invitación y configurar la contraseña
    const tenant = await acceptInvitation(invitationCode, password);

    logger.info('Inquilino registrado exitosamente', {
      tenantId: tenant.id,
      email: tenant.email
    });

    return NextResponse.json({
      success: true,
      message: 'Registro completado exitosamente',
      tenant: {
        id: tenant.id,
        email: tenant.email,
        nombreCompleto: tenant.nombreCompleto
      }
    });
  } catch (error: any) {
    logger.error('Error en registro de inquilino', {
      error: error.message,
      stack: error.stack
    });
    
    return NextResponse.json(
      { error: error.message || 'Error al completar el registro' },
      { status: 500 }
    );
  }
}
