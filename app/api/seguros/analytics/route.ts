import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const periodSchema = z.enum(['month', 'quarter', 'year', 'all']);

const MONTH_LABELS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const;

type Period = z.infer<typeof periodSchema>;

interface ClaimsByMonthItem {
  month: string;
  count: number;
  amount: number;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error desconocido';
}

function getPeriodStart(period: Period, now: Date): Date | null {
  switch (period) {
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'quarter': {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      return new Date(now.getFullYear(), quarterStartMonth, 1);
    }
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
    case 'all':
      return null;
    default:
      return null;
  }
}

function buildMonthSeries(now: Date): ClaimsByMonthItem[] {
  const series: ClaimsByMonthItem[] = [];
  for (let i = 11; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    series.push({
      month: MONTH_LABELS[date.getMonth()],
      count: 0,
      amount: 0,
    });
  }
  return series;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsedPeriod = periodSchema.safeParse(searchParams.get('period') ?? 'year');
    if (!parsedPeriod.success) {
      return NextResponse.json(
        { error: 'Periodo inválido', details: parsedPeriod.error.errors },
        { status: 400 }
      );
    }

    const period = parsedPeriod.data;
    const now = new Date();
    const startDate = getPeriodStart(period, now);

    const prisma = getPrismaClient();
    const claims = await prisma.insuranceClaim.findMany({
      where: {
        insurance: { companyId: session.user.companyId },
        ...(startDate
          ? {
              fechaSiniestro: {
                gte: startDate,
                lte: now,
              },
            }
          : {}),
      },
      select: {
        fechaSiniestro: true,
        montoReclamado: true,
        montoAprobado: true,
        estado: true,
      },
    });

    const totalClaimsAmount = claims.reduce((sum, claim) => {
      const amount = claim.montoAprobado ?? claim.montoReclamado ?? 0;
      return sum + amount;
    }, 0);

    const totalClaimsCount = claims.length;
    const pendingClaims = claims.filter((claim) =>
      ['abierto', 'en_proceso'].includes(claim.estado)
    ).length;

    const monthSeries = buildMonthSeries(now);
    const monthIndexMap = new Map<string, number>();
    monthSeries.forEach((item, index) => {
      monthIndexMap.set(item.month, index);
    });

    claims.forEach((claim) => {
      const claimDate = claim.fechaSiniestro;
      const monthLabel = MONTH_LABELS[claimDate.getMonth()];
      const index = monthIndexMap.get(monthLabel);
      if (index === undefined) {
        return;
      }
      const amount = claim.montoAprobado ?? claim.montoReclamado ?? 0;
      monthSeries[index].count += 1;
      monthSeries[index].amount += amount;
    });

    const insuranceWhere: {
      companyId: string;
      fechaInicio?: { lte: Date };
      fechaVencimiento?: { gte: Date };
    } = { companyId: session.user.companyId };

    if (startDate) {
      insuranceWhere.fechaInicio = { lte: now };
      insuranceWhere.fechaVencimiento = { gte: startDate };
    }

    const insurances = await prisma.insurance.findMany({
      where: insuranceWhere,
      select: {
        primaAnual: true,
        primaMensual: true,
      },
    });

    const totalPremium = insurances.reduce((sum, insurance) => {
      const annual =
        insurance.primaAnual ??
        (insurance.primaMensual ? insurance.primaMensual * 12 : null) ??
        0;
      return sum + annual;
    }, 0);

    const lossRatio = totalPremium > 0
      ? Math.round((totalClaimsAmount / totalPremium) * 1000) / 10
      : 0;

    return NextResponse.json({
      success: true,
      period,
      totalClaimsAmount,
      totalClaimsCount,
      pendingClaims,
      lossRatio,
      claimsByMonth: monthSeries,
    });
  } catch (error: unknown) {
    logger.error('[API Seguros Analytics] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener analítica de seguros', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
