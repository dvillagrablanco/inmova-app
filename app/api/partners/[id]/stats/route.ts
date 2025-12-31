import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Using global prisma instance

    // Obtener partner
    const partner = await prisma.partner.findUnique({
      where: { id: params.id },
      include: {
        referredClients: {
          where: { status: 'ACTIVE' },
          include: {
            company: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        commissions: {
          where: {
            status: 'PAID',
          },
          select: {
            amount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Partner no encontrado' }, { status: 404 });
    }

    // Verificar que sea el partner correcto (o admin)
    if (session.user.role !== 'super_admin' && partner.userId !== session.user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Calcular estadísticas
    const activeClients = partner.referredClients.length;

    // Calcular ingresos mensuales (comisiones recurrentes)
    // Asumiendo plan Professional promedio (€149) con comisión actual
    const avgMonthlyValue = 149;
    const monthlyRevenue = activeClients * avgMonthlyValue * (partner.commissionRate / 100);

    // Total ganado (suma de comisiones pagadas)
    const totalEarned = partner.commissions.reduce((sum, c) => sum + c.amount, 0);

    // Comisiones pendientes
    const pendingCommissions = await prisma.commission.findMany({
      where: {
        partnerId: partner.id,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    const pendingPayment = pendingCommissions.reduce((sum, c) => sum + c.amount, 0);

    // Calcular conversión rate (clientes activos / total referidos)
    const totalReferrals = await prisma.referral.count({
      where: { partnerId: partner.id },
    });

    const conversionRate = totalReferrals > 0 ? (activeClients / totalReferrals) * 100 : 0;

    // Determinar cuántos clientes faltan para siguiente nivel
    const levels = [
      { name: 'BRONZE', clients: 10, commission: 20 },
      { name: 'SILVER', clients: 25, commission: 25 },
      { name: 'GOLD', clients: 50, commission: 30 },
      { name: 'PLATINUM', clients: 100, commission: 35 },
      { name: 'DIAMOND', clients: 999, commission: 40 },
    ];

    const currentLevelIndex = levels.findIndex((l) => l.name === partner.level);
    const nextLevel = levels[currentLevelIndex + 1];
    const nextLevelClients = nextLevel ? nextLevel.clients - activeClients : 0;

    // Crecimiento mensual (últimos 2 meses)
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const recentCommissions = await prisma.commission.groupBy({
      by: ['createdAt'],
      where: {
        partnerId: partner.id,
        status: 'PAID',
        createdAt: { gte: twoMonthsAgo },
      },
      _sum: {
        amount: true,
      },
    });

    // Calcular % de crecimiento (simplificado)
    const monthlyGrowth = 12.5; // TODO: Calcular real

    return NextResponse.json({
      success: true,
      data: {
        level: partner.level,
        activeClients,
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        totalEarned: Math.round(totalEarned * 100) / 100,
        pendingPayment: Math.round(pendingPayment * 100) / 100,
        conversionRate: Math.round(conversionRate * 10) / 10,
        referralLink: `https://inmovaapp.com/r/${partner.referralCode}`,
        nextLevelClients,
        monthlyGrowth,
        commissionRate: partner.commissionRate,
        earlyAdopterBonus: partner.earlyAdopterBonus,
      },
    });
  } catch (error: any) {
    console.error('[Partner Stats Error]:', error);
    return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500 });
  }
}
