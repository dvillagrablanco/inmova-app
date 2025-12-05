import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin-fincas/dashboard
 * Obtiene métricas del dashboard del administrador de fincas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const now = new Date();
    const startOfThisMonth = startOfMonth(now);
    const endOfThisMonth = endOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));
    const endOfLastMonth = endOfMonth(subMonths(now, 1));

    // Comunidades activas
    const totalCommunities = await prisma.communityManagement.count({
      where: {
        companyId,
        activa: true,
      },
    });

    // Facturas pendientes
    const pendingInvoices = await prisma.communityInvoice.count({
      where: {
        companyId,
        estado: { in: ['emitida', 'vencida'] },
      },
    });

    // Ingresos este mes
    const ingresosMes = await prisma.communityInvoice.aggregate({
      where: {
        companyId,
        fechaPago: {
          gte: startOfThisMonth,
          lte: endOfThisMonth,
        },
        estado: 'pagada',
      },
      _sum: {
        totalFactura: true,
      },
    });

    // Ingresos mes anterior
    const ingresosMesAnterior = await prisma.communityInvoice.aggregate({
      where: {
        companyId,
        fechaPago: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
        estado: 'pagada',
      },
      _sum: {
        totalFactura: true,
      },
    });

    // Saldo total de todas las comunidades
    const communities = await prisma.communityManagement.findMany({
      where: {
        companyId,
        activa: true,
      },
      include: {
        movimientosCaja: {
          orderBy: { fecha: 'desc' },
          take: 1,
        },
      },
    });

    const saldoTotal = communities.reduce((sum, community) => {
      const lastEntry = community.movimientosCaja[0];
      return sum + (lastEntry?.saldoActual || 0);
    }, 0);

    // Facturas vencidas
    const vencidas = await prisma.communityInvoice.count({
      where: {
        companyId,
        estado: 'vencida',
      },
    });

    // Informes pendientes (trimestre actual)
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
    const currentYear = now.getFullYear();
    const periodoActual = `${currentYear}-Q${currentQuarter}`;

    const informesPendientes = await prisma.communityReport.count({
      where: {
        companyId,
        periodo: periodoActual,
      },
    });

    const informesGenerados = totalCommunities - informesPendientes;

    return NextResponse.json({
      kpis: {
        totalCommunities,
        pendingInvoices,
        ingresosMes: ingresosMes._sum.totalFactura || 0,
        ingresosMesAnterior: ingresosMesAnterior._sum.totalFactura || 0,
        saldoTotal,
        vencidas,
        informesGenerados,
        totalInformes: totalCommunities,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del dashboard' },
      { status: 500 }
    );
  }
}
