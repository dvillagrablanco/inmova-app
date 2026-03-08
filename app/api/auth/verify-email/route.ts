import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/auth/verify-email?token=xxx&type=owner|tenant
 * Verifica email de propietario o inquilino
 */
export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const type = searchParams.get('type') || 'owner';

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=token_missing', req.url));
    }

    if (type === 'owner') {
      const owner = await prisma.owner.findFirst({
        where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
      });
      if (!owner) {
        return NextResponse.redirect(new URL('/login?error=token_invalid', req.url));
      }
      await prisma.owner.update({
        where: { id: owner.id },
        data: { emailVerificado: true, resetToken: null, resetTokenExpiry: null },
      });
      return NextResponse.redirect(new URL('/auth-propietario/login?verified=true', req.url));
    }

    if (type === 'tenant') {
      // Tenant activation uses a different flow (set password page)
      const tenant = await prisma.tenant.findFirst({
        where: { password: token }, // token stored temporarily in password field
      });
      if (!tenant) {
        return NextResponse.redirect(new URL('/login?error=token_invalid', req.url));
      }
      return NextResponse.redirect(new URL(`/portal-inquilino/activar?token=${token}`, req.url));
    }

    return NextResponse.redirect(new URL('/login?error=type_invalid', req.url));
  } catch (error: any) {
    logger.error('[Verify Email]:', error);
    return NextResponse.redirect(new URL('/login?error=server_error', req.url));
  }
}
