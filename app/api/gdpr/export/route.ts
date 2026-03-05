/**
 * GDPR: Data Export
 * GET /api/gdpr/export
 * 
 * Exports all personal data for the authenticated user or tenant.
 * GDPR Article 20 - Right to data portability
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import { audit } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const userId = session.user.id;

    // Collect all user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        companyId: true,
      },
    });

    // Get user's company data
    const company = user?.companyId ? await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { id: true, nombre: true, cif: true },
    }) : null;

    // Get audit logs for this user
    const auditLogs = await prisma.auditLog.findMany({
      where: { userId },
      select: { action: true, entityType: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }).catch(() => []);

    const exportData = {
      exportDate: new Date().toISOString(),
      gdprArticle: 'Article 20 - Right to data portability',
      user,
      company,
      auditLogs,
      _note: 'Este archivo contiene todos sus datos personales almacenados en Inmova App.',
    };

    await audit({
      action: 'EXPORT_DATA',
      userId,
      entityType: 'User',
      entityId: userId,
      severity: 'warning',
    });

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="inmova-datos-personales-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error: any) {
    logger.error('[GDPR Export Error]:', error);
    return NextResponse.json({ error: 'Error exportando datos' }, { status: 500 });
  }
}
