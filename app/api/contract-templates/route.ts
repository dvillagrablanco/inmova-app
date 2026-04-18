/**
 * Alias de /api/legal-templates (filtrado a categorías de contratos).
 * Mantiene compatibilidad con la UI de /firma-digital/templates.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = await getPrisma();

    const where: any = { activo: true };
    if (session.user.role !== 'super_admin' && session.user.companyId) {
      where.companyId = session.user.companyId;
    }

    const templates = await prisma.legalTemplate
      .findMany({
        where,
        orderBy: { createdAt: 'desc' },
      })
      .catch(() => [] as any[]);

    return NextResponse.json(templates);
  } catch (error) {
    logger.error('Error fetching contract templates:', error as any);
    return NextResponse.json([], { status: 200 });
  }
}
