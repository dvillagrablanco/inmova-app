import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LEVEL_THRESHOLDS = [
  { name: 'BRONZE', clients: 10 },
  { name: 'SILVER', clients: 25 },
  { name: 'GOLD', clients: 50 },
  { name: 'PLATINUM', clients: 100 },
] as const;

function getPartnerLevel(clientCount: number): string {
  if (clientCount >= 100) return 'PLATINUM';
  if (clientCount >= 50) return 'GOLD';
  if (clientCount >= 25) return 'SILVER';
  if (clientCount >= 10) return 'BRONZE';
  return 'BRONZE';
}

function getNextLevelClients(clientCount: number): number {
  const next = LEVEL_THRESHOLDS.find((level) => clientCount < level.clients);
  return next ? next.clients - clientCount : 0;
}

function formatPeriod(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error desconocido';
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener partner
    const partner = await prisma.partner.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        comisionPorcentaje: true,
        slug: true,
      },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Partner no encontrado' }, { status: 404 });
    }

    // Verificar que sea el partner correcto (o admin)
    const isAdmin = session.user.role === 'super_admin' || session.user.role === 'administrador';
    if (!isAdmin && session.user.email !== partner.email) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const [activeClients, totalReferrals] = await prisma.$transaction([
      prisma.partnerClient.count({
        where: { partnerId: partner.id, estado: 'activo' },
      }),
      prisma.partnerInvitation.count({
        where: { partnerId: partner.id },
      }),
    ]);

    const now = new Date();
    const currentPeriod = formatPeriod(now);
    const previousPeriod = formatPeriod(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    const [currentPeriodSum, previousPeriodSum, totalEarnedSum, pendingSum] =
      await prisma.$transaction([
        prisma.commission.aggregate({
          where: {
            partnerId: partner.id,
            periodo: currentPeriod,
            estado: { in: ['PENDING', 'APPROVED', 'PAID'] },
          },
          _sum: { montoComision: true },
        }),
        prisma.commission.aggregate({
          where: {
            partnerId: partner.id,
            periodo: previousPeriod,
            estado: { in: ['PENDING', 'APPROVED', 'PAID'] },
          },
          _sum: { montoComision: true },
        }),
        prisma.commission.aggregate({
          where: {
            partnerId: partner.id,
            estado: 'PAID',
          },
          _sum: { montoComision: true },
        }),
        prisma.commission.aggregate({
          where: {
            partnerId: partner.id,
            estado: { in: ['PENDING', 'APPROVED'] },
          },
          _sum: { montoComision: true },
        }),
      ]);

    const monthlyRevenue = currentPeriodSum._sum.montoComision ?? 0;
    const previousRevenue = previousPeriodSum._sum.montoComision ?? 0;
    const totalEarned = totalEarnedSum._sum.montoComision ?? 0;
    const pendingPayment = pendingSum._sum.montoComision ?? 0;

    const conversionRate = totalReferrals > 0 ? (activeClients / totalReferrals) * 100 : 0;
    const monthlyGrowth =
      previousRevenue > 0 ? ((monthlyRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const level = getPartnerLevel(activeClients);
    const nextLevelClients = getNextLevelClients(activeClients);
    const referralCode = partner.slug ?? partner.id;
    const referralLink = `https://inmovaapp.com/partners/register?ref=${encodeURIComponent(referralCode)}`;

    return NextResponse.json({
      success: true,
      data: {
        level,
        activeClients,
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        totalEarned: Math.round(totalEarned * 100) / 100,
        pendingPayment: Math.round(pendingPayment * 100) / 100,
        conversionRate: Math.round(conversionRate * 10) / 10,
        referralLink,
        nextLevelClients,
        monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
        commissionRate: partner.comisionPorcentaje,
      },
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    logger.error('[Partner Stats Error]:', error);
    return NextResponse.json({ error: 'Error obteniendo estadísticas', details: message }, { status: 500 });
  }
}
