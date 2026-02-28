import { NextRequest, NextResponse } from 'next/server';
import { validateInvitationCode } from '@/lib/tenant-invitation-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Código de invitación requerido' },
        { status: 400 }
      );
    }

    const validation = await validateInvitationCode(code);

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, error: validation.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      tenantName: validation.invitation?.tenant.nombreCompleto,
      email: validation.invitation?.email,
      companyName: validation.invitation?.company.nombre
    });
  } catch (error: any) {
    logger.error('Error al validar invitación', {
      error: error.message
    });
    
    return NextResponse.json(
      { error: 'Error al validar invitación' },
      { status: 500 }
    );
  }
}
