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
 * GET /api/contracts/expiring?days=90
 * Returns contracts expiring within the next N days, grouped by urgency.
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

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '90', 10);

    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    const contracts = await prisma.contract.findMany({
      where: {
        estado: 'activo',
        fechaFin: { gte: today, lte: futureDate },
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
      },
      orderBy: { fechaFin: 'asc' },
    });

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const data = contracts.map((c) => {
      const fechaFin = new Date(c.fechaFin);
      const daysUntil = Math.ceil((fechaFin.getTime() - now) / dayMs);
      return {
        id: c.id,
        buildingName: c.unit?.building?.nombre || 'Sin edificio',
        unitNumber: c.unit?.numero || '-',
        tenantName: c.tenant?.nombreCompleto || 'Sin inquilino',
        fechaFin: c.fechaFin,
        rentaMensual: Number(c.rentaMensual || 0),
        renovacionAutomatica: c.renovacionAutomatica,
        daysUntil,
      };
    });

    const critico = data.filter((d) => d.daysUntil < 30);
    const alerta = data.filter((d) => d.daysUntil >= 30 && d.daysUntil < 60);
    const info = data.filter((d) => d.daysUntil >= 60 && d.daysUntil <= 90);

    return NextResponse.json({
      success: true,
      data: { critico, alerta, info },
      total: data.length,
    });
  } catch (error: any) {
    logger.error('[Expiring API]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error obteniendo contratos' }, { status: 500 });
  }
}
