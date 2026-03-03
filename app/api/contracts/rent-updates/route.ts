import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { addMonths, startOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/contracts/rent-updates
 * Returns contracts with upcoming IPC/rent anniversary dates (next 12 months).
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

    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const contracts = await prisma.contract.findMany({
      where: {
        estado: 'activo',
        fechaFin: { gt: today },
        fechaInicio: { lte: oneYearAgo },
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
      orderBy: { fechaInicio: 'asc' },
    });

    const ipcPct = 2.4;
    const data = contracts.map((c) => {
      const fechaInicio = new Date(c.fechaInicio);
      const monthsSinceStart = Math.floor(
        (today.getTime() - fechaInicio.getTime()) / (30.44 * 24 * 60 * 60 * 1000)
      );
      const nextAnniversary = addMonths(monthsSinceStart > 0 ? startOfMonth(fechaInicio) : fechaInicio, 12);
      const incrementoPct =
        c.incrementoType === 'ipc'
          ? ipcPct
          : c.incrementoType === 'porcentaje' && c.incrementoValor
            ? c.incrementoValor
            : c.incrementoType === 'fijo' && c.incrementoValor
              ? (c.incrementoValor / Number(c.rentaMensual)) * 100
              : ipcPct;
      const newRent =
        Math.round(
          Number(c.rentaMensual) * (1 + incrementoPct / 100) * 100
        ) / 100;

      return {
        id: c.id,
        buildingName: c.unit?.building?.nombre || 'Sin edificio',
        unitNumber: c.unit?.numero || '-',
        tenantName: c.tenant?.nombreCompleto || 'Sin inquilino',
        currentRent: Number(c.rentaMensual || 0),
        newRent,
        incrementoPct,
        incrementoType: c.incrementoType,
        anniversaryDate: nextAnniversary.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error: any) {
    logger.error('[Rent Updates API]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error obteniendo actualizaciones' }, { status: 500 });
  }
}
