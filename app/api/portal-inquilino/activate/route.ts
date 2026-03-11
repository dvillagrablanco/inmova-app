import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { acceptInvitation } from '@/lib/tenant-invitation-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/portal-inquilino/activate
 * Activar cuenta de inquilino (establecer contraseña desde invitación)
 */
export async function POST(req: NextRequest) {
  try {
    const { token, code, password } = await req.json();
    const invitationCode = String(code || token || '')
      .trim()
      .toUpperCase();

    if (!invitationCode || !password) {
      return NextResponse.json({ error: 'Código y contraseña requeridos' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Mínimo 8 caracteres' }, { status: 400 });
    }

    const tenant = await acceptInvitation(invitationCode, password);

    logger.info('[Tenant Activate] Tenant activated:', tenant.email);

    return NextResponse.json({ success: true, message: 'Cuenta activada correctamente' });
  } catch (error: any) {
    logger.error('[Tenant Activate]:', error);
    return NextResponse.json({ error: 'Error activando cuenta' }, { status: 500 });
  }
}
