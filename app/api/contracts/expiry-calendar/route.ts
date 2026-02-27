import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { addMonths, startOfMonth, endOfMonth, format } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/contracts/expiry-calendar
 * Contratos agrupados por mes de vencimiento (próximos 12 meses).
 * Incluye desglose por edificio para planificar renovaciones.
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
    const months: Array<{
      mes: string;
      label: string;
      total: number;
      rentaAfectada: number;
      porEdificio: Record<string, number>;
    }> = [];

    for (let i = 0; i < 12; i++) {
      const monthStart = startOfMonth(addMonths(today, i));
      const monthEnd = endOfMonth(addMonths(today, i));

      const contracts = await prisma.contract.findMany({
        where: {
          estado: 'activo',
          fechaFin: { gte: monthStart, lte: monthEnd },
          unit: { building: { companyId: companyFilter } },
        },
        select: {
          id: true,
          rentaMensual: true,
          unit: {
            select: { building: { select: { nombre: true } } },
          },
        },
      });

      const porEdificio: Record<string, number> = {};
      let rentaAfectada = 0;

      for (const c of contracts) {
        const edificio = c.unit?.building?.nombre || 'Sin edificio';
        porEdificio[edificio] = (porEdificio[edificio] || 0) + 1;
        rentaAfectada += c.rentaMensual;
      }

      months.push({
        mes: format(monthStart, 'yyyy-MM'),
        label: format(monthStart, 'MMM yyyy'),
        total: contracts.length,
        rentaAfectada,
        porEdificio,
      });
    }

    const totalVencen = months.reduce((s, m) => s + m.total, 0);
    const rentaTotalAfectada = months.reduce((s, m) => s + m.rentaAfectada, 0);
    const mesPico = months.reduce((max, m) => (m.total > max.total ? m : max), months[0]);

    return NextResponse.json({
      success: true,
      resumen: {
        totalVencen12Meses: totalVencen,
        rentaTotalAfectada,
        mesPico: { mes: mesPico.label, contratos: mesPico.total },
      },
      meses: months,
    });
  } catch (error: any) {
    logger.error('[Expiry Calendar]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error generando calendario' }, { status: 500 });
  }
}
