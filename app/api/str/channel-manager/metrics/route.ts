export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// GET - Obtener métricas de canales
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const user = await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');
    const canal = searchParams.get('canal');
    const period = parseInt(searchParams.get('period') || '30'); // días
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    
    const where: any = {
      listing: { companyId: user.companyId },
      periodo: { gte: startDate },
    };
    
    if (listingId) where.listingId = listingId;
    if (canal) where.canal = canal;
    
    // Métricas diarias
    const dailyMetrics = await prisma.sTRChannelMetrics.findMany({
      where,
      orderBy: { periodo: 'asc' },
    });
    
    // Agregados por canal
    const channelSummary = await prisma.sTRChannelMetrics.groupBy({
      by: ['canal'],
      where,
      _sum: {
        reservasRecibidas: true,
        reservasCanceladas: true,
        nochesReservadas: true,
        ingresosBrutos: true,
        comisionesCanal: true,
        ingresosNetos: true,
        reviewsRecibidas: true,
      },
      _avg: {
        adr: true,
        tasaOcupacion: true,
        ratingPromedio: true,
        conversionRate: true,
      },
    });
    
    // Totales generales
    const totals = await prisma.sTRChannelMetrics.aggregate({
      where,
      _sum: {
        reservasRecibidas: true,
        nochesReservadas: true,
        ingresosBrutos: true,
        comisionesCanal: true,
        ingresosNetos: true,
      },
      _avg: {
        adr: true,
        tasaOcupacion: true,
      },
    });
    
    // Comparativa con periodo anterior
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - period);
    
    const previousTotals = await prisma.sTRChannelMetrics.aggregate({
      where: {
        ...where,
        periodo: {
          gte: previousStartDate,
          lt: startDate,
        },
      },
      _sum: {
        reservasRecibidas: true,
        ingresosBrutos: true,
      },
    });
    
    // Calcular tendencias
    const trends = {
      reservas: previousTotals._sum?.reservasRecibidas && totals._sum?.reservasRecibidas
        ? (((totals._sum.reservasRecibidas - previousTotals._sum.reservasRecibidas) / previousTotals._sum.reservasRecibidas) * 100).toFixed(1)
        : 0,
      ingresos: previousTotals._sum?.ingresosBrutos && totals._sum?.ingresosBrutos
        ? (((totals._sum.ingresosBrutos - previousTotals._sum.ingresosBrutos) / previousTotals._sum.ingresosBrutos) * 100).toFixed(1)
        : 0,
    };
    
    return NextResponse.json({
      dailyMetrics,
      channelSummary,
      totals: {
        ...totals,
        trends,
      },
      period: `${period} días`,
    });
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
