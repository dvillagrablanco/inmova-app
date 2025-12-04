import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createTenantInvitation } from '@/lib/tenant-invitation-service';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tenantId, expirationDays = 7 } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'ID de inquilino requerido' },
        { status: 400 }
      );
    }

    // Crear la invitación
    const invitation = await createTenantInvitation(
      tenantId,
      session.user.id,
      expirationDays
    );

    logger.info('Invitación creada', {
      invitationId: invitation.id,
      tenantId,
      createdBy: session.user.id,
      code: invitation.invitationCode
    });

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        code: invitation.invitationCode,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
        status: invitation.status
      }
    });
  } catch (error: any) {
    logger.error('Error al crear invitación', {
      error: error.message,
      stack: error.stack
    });
    
    return NextResponse.json(
      { error: error.message || 'Error al crear invitación' },
      { status: 500 }
    );
  }
}
