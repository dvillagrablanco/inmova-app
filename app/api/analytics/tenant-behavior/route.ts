import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId requerido' },
        { status: 400 }
      );
    }

    const companyId = session?.user?.companyId;

    // Verify tenant belongs to company
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        companyId,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Inquilino no encontrado' },
        { status: 404 }
      );
    }

    // Get behavior history
    const behaviors = await prisma.tenantBehavior.findMany({
      where: { tenantId },
      orderBy: { fecha: 'desc' },
      take: 12,
    });

    return NextResponse.json({ behaviors });
  } catch (error: any) {
    logger.error('Error fetching tenant behavior:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar comportamiento' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { tenantId } = await request.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId requerido' },
        { status: 400 }
      );
    }

    const companyId = session?.user?.companyId;

    // Verify tenant belongs to company
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        companyId,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Inquilino no encontrado' },
        { status: 404 }
      );
    }

    const { analyzeTenantBehavior } = (await import('@/lib/analytics-service')) as any;
    const behavior = await analyzeTenantBehavior(tenantId);

    return NextResponse.json({ behavior }, { status: 201 });
  } catch (error: any) {
    logger.error('Error analyzing tenant behavior:', error);
    return NextResponse.json(
      { error: error.message || 'Error al analizar comportamiento' },
      { status: 500 }
    );
  }
}
