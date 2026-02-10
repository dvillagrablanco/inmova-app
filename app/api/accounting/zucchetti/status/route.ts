/**
 * GET /api/accounting/zucchetti/status
 * Devuelve el estado de la integración Zucchetti/Altai para la empresa activa
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { isAltaiConfigured, getZucchettiAuthMode } from '@/lib/zucchetti-altai-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ configured: false });
    }

    const { searchParams } = new URL(req.url);
    const queryCompanyId = searchParams.get('companyId');
    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const activeCompanyId = queryCompanyId || cookieCompanyId || session.user.companyId;

    const company = await prisma.company.findUnique({
      where: { id: activeCompanyId },
      select: {
        zucchettiEnabled: true,
        zucchettiCompanyId: true,
        zucchettiLastSync: true,
        zucchettiTokenExpiry: true,
        zucchettiSyncErrors: true,
      },
    });

    if (!company) {
      return NextResponse.json({ configured: false });
    }

    const altaiConfigured = isAltaiConfigured();
    const authMode = getZucchettiAuthMode();
    const tokenExpired = company.zucchettiTokenExpiry
      ? company.zucchettiTokenExpiry < new Date()
      : true;

    return NextResponse.json({
      configured: company.zucchettiEnabled && altaiConfigured,
      enabled: company.zucchettiEnabled,
      connected: company.zucchettiEnabled && !!company.zucchettiCompanyId && !tokenExpired,
      altaiConfigured,
      authMode,
      companyCode: company.zucchettiCompanyId,
      lastSync: company.zucchettiLastSync?.toISOString() || null,
      syncErrors: company.zucchettiSyncErrors,
      needsCredentials: company.zucchettiEnabled && !altaiConfigured,
    });
  } catch (error) {
    logger.error('[Zucchetti Status]', error);
    return NextResponse.json({ configured: false });
  }
}
