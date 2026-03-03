import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/contracts/fianzas
 * Returns fianza summary for all active contracts.
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as any).role as any,
      primaryCompanyId: session.user?.companyId,
      request,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }

    const companyFilter =
      scope.scopeCompanyIds.length > 1
        ? { in: scope.scopeCompanyIds }
        : scope.activeCompanyId;

    const contracts = await prisma.contract.findMany({
      where: {
        estado: 'activo',
        unit: { building: { companyId: companyFilter } },
      },
      include: {
        unit: {
          select: {
            id: true,
            numero: true,
            building: { select: { id: true, nombre: true } },
          },
        },
        tenant: { select: { id: true, nombreCompleto: true } },
        fianzaDeposits: { select: { id: true, estado: true, importeFianza: true } },
      },
    });

    let totalFianzas = 0;
    let depositadas = 0;
    let pendientes = 0;
    const items: Array<{
      id: string;
      buildingName: string;
      unitNumber: string;
      tenantName: string;
      importe: number;
      depositada: boolean;
    }> = [];

    for (const c of contracts) {
      const importe = Number(c.deposito || 0) * (c.mesesFianza || 1);
      const depositada =
        c.fianzaDeposits.length > 0 &&
        c.fianzaDeposits.some((fd) => fd.estado === 'depositada');

      totalFianzas += importe;
      if (depositada) depositadas++;
      else pendientes++;

      items.push({
        id: c.id,
        buildingName: c.unit?.building?.nombre || 'Sin edificio',
        unitNumber: c.unit?.numero || '-',
        tenantName: c.tenant?.nombreCompleto || 'Sin inquilino',
        importe,
        depositada,
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalFianzas,
        totalContratos: contracts.length,
        depositadas,
        pendientes,
      },
      items: items.filter((i) => i.importe > 0),
    });
  } catch (error: any) {
    logger.error('[Fianzas API]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error obteniendo fianzas' }, { status: 500 });
  }
}
