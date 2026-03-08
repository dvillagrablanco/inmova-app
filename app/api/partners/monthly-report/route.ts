import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/partners/monthly-report?partnerId=xxx&month=2026-03
 * Generates monthly performance report for a partner
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');
    const month = searchParams.get('month') || new Date().toISOString().substring(0, 7);

    if (!partnerId) return NextResponse.json({ error: 'partnerId required' }, { status: 400 });

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { id: true, nombre: true, comisionPorcentaje: true, createdAt: true },
    });
    if (!partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 });

    const monthStart = new Date(`${month}-01`);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    // Referrals this month
    const referralsThisMonth = await prisma.lead.count({
      where: { sourceDetail: partnerId, source: 'partner_referral', createdAt: { gte: monthStart, lt: monthEnd } },
    });

    // Total referrals all time
    const referralsTotal = await prisma.lead.count({
      where: { sourceDetail: partnerId, source: 'partner_referral' },
    });

    // Conversions this month
    const conversionsThisMonth = await prisma.lead.count({
      where: { sourceDetail: partnerId, source: 'partner_referral', estado: { in: ['convertido', 'cliente'] }, updatedAt: { gte: monthStart, lt: monthEnd } },
    });

    // Commissions this month
    const commissionsMonth = await prisma.commission.aggregate({
      where: { partnerId, periodo: month },
      _sum: { montoComision: true },
      _count: true,
    });

    // Commissions all time
    const commissionsTotal = await prisma.commission.aggregate({
      where: { partnerId },
      _sum: { montoComision: true },
    });

    // Pending commissions
    const commissionsPending = await prisma.commission.aggregate({
      where: { partnerId, estado: 'pendiente' },
      _sum: { montoComision: true },
    });

    // Certification
    const clientesConvertidos = await prisma.lead.count({
      where: { sourceDetail: partnerId, source: 'partner_referral', estado: { in: ['convertido', 'cliente'] } },
    });
    let tier = 'silver';
    if (clientesConvertidos >= 50) tier = 'platinum';
    else if (clientesConvertidos >= 10) tier = 'gold';

    const report = {
      partner: partner.nombre,
      periodo: month,
      generatedAt: new Date().toISOString(),
      certification: tier,
      metricas: {
        referidosDelMes: referralsThisMonth,
        referidosTotal: referralsTotal,
        conversionesDelMes: conversionsThisMonth,
        tasaConversion: referralsTotal > 0 ? Math.round(clientesConvertidos / referralsTotal * 100) : 0,
      },
      comisiones: {
        delMes: Math.round((commissionsMonth._sum.montoComision || 0) * 100) / 100,
        pagosDelMes: commissionsMonth._count,
        acumuladoTotal: Math.round((commissionsTotal._sum.montoComision || 0) * 100) / 100,
        pendientePago: Math.round((commissionsPending._sum.montoComision || 0) * 100) / 100,
        porcentajeActual: partner.comisionPorcentaje,
      },
      ranking: {
        posicion: 1, // TODO: calculate actual ranking
        totalPartners: await prisma.partner.count({ where: { activo: true } }),
      },
    };

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    logger.error('[Partner Monthly Report]:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
