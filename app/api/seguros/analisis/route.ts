import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const typeLabels: Record<string, string> = {
  incendio: 'Incendio',
  robo: 'Robo',
  responsabilidad_civil: 'Responsabilidad civil',
  vida: 'Vida',
  hogar: 'Hogar',
  comunidad: 'Comunidad',
  impago_alquiler: 'Impago alquiler',
  otro: 'Otros',
};

const getPeriodStart = (period: string | null) => {
  const now = new Date();
  const start = new Date(now);
  if (period === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === 'quarter') {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    start.setMonth(quarterStartMonth, 1);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === 'year') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  return null;
};

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    const format = searchParams.get('format');
    const startDate = getPeriodStart(period);

    const [totalPolicies, activePolicies, insurances] = await Promise.all([
      prisma.insurance.count({ where: { companyId } }),
      prisma.insurance.count({
        where: { companyId, estado: { in: ['activa', 'pendiente_renovacion'] } },
      }),
      prisma.insurance.findMany({
        where: { companyId },
        select: { primaAnual: true, primaMensual: true },
      }),
    ]);

    const claims = await prisma.insuranceClaim.findMany({
      where: {
        insurance: { companyId },
        ...(startDate ? { fechaSiniestro: { gte: startDate } } : {}),
      },
      include: {
        insurance: {
          select: {
            tipo: true,
            building: { select: { direccion: true } },
            unit: {
              select: {
                numero: true,
                building: { select: { direccion: true } },
              },
            },
          },
        },
      },
    });

    const totalClaims = claims.length;
    const pendingClaims = claims.filter((c) => ['abierto', 'en_proceso'].includes(c.estado)).length;
    const totalPaid = claims.reduce((sum, claim) => {
      const approved = claim.montoAprobado ?? claim.montoReclamado ?? 0;
      return sum + approved;
    }, 0);

    const claimsWithAmount = claims.filter(
      (claim) => (claim.montoAprobado ?? claim.montoReclamado ?? 0) > 0
    );
    const avgClaimAmount = claimsWithAmount.length > 0 ? totalPaid / claimsWithAmount.length : 0;

    const totalPremium = insurances.reduce((sum, insurance) => {
      if (insurance.primaAnual) return sum + insurance.primaAnual;
      if (insurance.primaMensual) return sum + insurance.primaMensual * 12;
      return sum;
    }, 0);

    const claimRate = totalPolicies > 0 ? (totalClaims / totalPolicies) * 100 : 0;
    const lossRatio = totalPremium > 0 ? (totalPaid / totalPremium) * 100 : 0;

    const claimsByTypeMap = new Map<string, { count: number; amount: number }>();
    for (const claim of claims) {
      const tipo = claim.insurance.tipo;
      const label = typeLabels[tipo] || 'Otros';
      const current = claimsByTypeMap.get(label) || { count: 0, amount: 0 };
      current.count += 1;
      current.amount += claim.montoAprobado ?? claim.montoReclamado ?? 0;
      claimsByTypeMap.set(label, current);
    }

    const claimsByType = Array.from(claimsByTypeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      amount: data.amount,
      percentage: totalClaims > 0 ? Math.round((data.count / totalClaims) * 100) : 0,
    }));

    const claimsByMonthMap = new Map<string, { count: number; amount: number }>();
    for (const claim of claims) {
      const monthKey = claim.fechaSiniestro.toISOString().slice(0, 7);
      const current = claimsByMonthMap.get(monthKey) || { count: 0, amount: 0 };
      current.count += 1;
      current.amount += claim.montoAprobado ?? claim.montoReclamado ?? 0;
      claimsByMonthMap.set(monthKey, current);
    }

    const claimsByMonth = Array.from(claimsByMonthMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([monthKey, data]) => ({
        month: new Date(`${monthKey}-01`).toLocaleDateString('es-ES', { month: 'short' }),
        count: data.count,
        amount: data.amount,
      }));

    const topPropertyMap = new Map<string, { claims: number; amount: number }>();
    for (const claim of claims) {
      const address =
        claim.insurance.building?.direccion ||
        (claim.insurance.unit?.building?.direccion
          ? `${claim.insurance.unit.building.direccion} ${claim.insurance.unit?.numero || ''}`.trim()
          : 'Sin direccion');
      const current = topPropertyMap.get(address) || { claims: 0, amount: 0 };
      current.claims += 1;
      current.amount += claim.montoAprobado ?? claim.montoReclamado ?? 0;
      topPropertyMap.set(address, current);
    }

    const topClaimProperties = Array.from(topPropertyMap.entries())
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 5)
      .map(([address, data]) => ({
        address,
        claims: data.claims,
        amount: data.amount,
      }));

    const payload = {
      stats: {
        totalPolicies,
        activePolicies,
        totalClaims,
        totalPaid,
        avgClaimAmount,
        claimRate: Number(claimRate.toFixed(1)),
        lossRatio: Number(lossRatio.toFixed(1)),
        pendingClaims,
      },
      claimsByType,
      claimsByMonth,
      topClaimProperties,
    };

    if (format === 'csv') {
      const escapeCsv = (value: string) => {
        const needsQuotes = value.includes(',') || value.includes('"') || value.includes('\n');
        const sanitized = value.replace(/"/g, '""');
        return needsQuotes ? `"${sanitized}"` : sanitized;
      };

      const lines: string[] = [];
      lines.push('seccion,clave,valor');
      Object.entries(payload.stats).forEach(([key, value]) => {
        lines.push(`stats,${escapeCsv(key)},${escapeCsv(String(value))}`);
      });

      lines.push('');
      lines.push('claims_by_type,tipo,cantidad,monto,porcentaje');
      payload.claimsByType.forEach((item) => {
        lines.push(
          `claims_by_type,${escapeCsv(item.type)},${item.count},${item.amount},${item.percentage}`
        );
      });

      lines.push('');
      lines.push('claims_by_month,mes,cantidad,monto');
      payload.claimsByMonth.forEach((item) => {
        lines.push(`claims_by_month,${escapeCsv(item.month)},${item.count},${item.amount}`);
      });

      lines.push('');
      lines.push('top_properties,direccion,siniestros,monto');
      payload.topClaimProperties.forEach((item) => {
        lines.push(`top_properties,${escapeCsv(item.address)},${item.claims},${item.amount}`);
      });

      const csv = lines.join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="seguros_analisis.csv"',
        },
      });
    }

    return NextResponse.json(payload);
  } catch (error) {
    logger.error('[Seguros Analisis] Error al cargar analisis', error);
    return NextResponse.json({ error: 'Error al cargar analisis' }, { status: 500 });
  }
}
