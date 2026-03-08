import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';

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
  const prisma = await getPrisma();
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token y contraseña requeridos' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Mínimo 8 caracteres' }, { status: 400 });
    }

    // Find tenant by invitation token (stored temporarily in password field)
    const tenant = await prisma.tenant.findFirst({
      where: { password: token },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Token de invitación no válido o ya utilizado' }, { status: 404 });
    }

    // Set real password
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { password: hashedPassword },
    });

    logger.info('[Tenant Activate] Tenant activated:', tenant.email);

    return NextResponse.json({ success: true, message: 'Cuenta activada correctamente' });
  } catch (error: any) {
    logger.error('[Tenant Activate]:', error);
    return NextResponse.json({ error: 'Error activando cuenta' }, { status: 500 });
  }
}
