export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    // Calcular fechas basadas en el período
    const now = new Date();
    let startDate: Date;
    let endDate: Date = endOfMonth(now);

    switch (period) {
      case 'year':
        startDate = startOfMonth(subMonths(now, 12));
        break;
      case 'quarter':
        startDate = startOfMonth(subMonths(now, 3));
        break;
      case 'month':
      default:
        startDate = startOfMonth(now);
        break;
    }

    // Obtener huella de carbono
    const carbonFootprints = await prisma.carbonFootprint.findMany({
      where: {
        companyId,
        fechaInicio: { gte: startDate },
        fechaFin: { lte: endDate },
      },
      orderBy: { fechaInicio: 'desc' },
      take: 1,
    });

    // Obtener lecturas de energía
    const energyReadings = await prisma.energyReading.findMany({
      where: {
        companyId,
        fechaLectura: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Obtener certificaciones ESG
    const certifications = await prisma.eSGCertification.findMany({
      where: {
        companyId,
        estado: 'vigente',
      },
      select: {
        nombre: true,
        tipo: true,
      },
    });

    // Obtener métricas de reciclaje
    const recyclingMetrics = await prisma.recyclingMetric.findMany({
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calcular métricas agregadas
    const totalEnergy = energyReadings
      .filter(r => r.tipo !== 'agua')
      .reduce((sum, r) => sum + (r.consumo || 0), 0);
    const waterConsumption = energyReadings
      .filter(r => r.tipo === 'agua')
      .reduce((sum, r) => sum + (r.consumo || 0), 0);
    const totalRenewable = 0;
    
    const renewableRate = totalEnergy > 0 ? (totalRenewable / totalEnergy) * 100 : 0;

    const totalWaste = recyclingMetrics.reduce((sum, r) => sum + (r.residuosGenerados || 0), 0);
    const totalRecycled = recyclingMetrics.reduce((sum, r) => sum + (r.residuosReciclados || 0), 0);
    const recyclingRate = totalWaste > 0 ? (totalRecycled / totalWaste) * 100 : 0;

    const latestCarbon = carbonFootprints[0];
    const carbonFootprint = latestCarbon?.total || 0;

    // Calcular ESG Score basado en métricas disponibles
    let esgScore = 50; // Base
    if (renewableRate > 30) esgScore += 10;
    if (renewableRate > 50) esgScore += 10;
    if (recyclingRate > 50) esgScore += 10;
    if (recyclingRate > 70) esgScore += 10;
    if (certifications.length > 0) esgScore += 5 * Math.min(certifications.length, 4);

    const metrics = {
      carbonFootprint,
      energyConsumption: totalEnergy,
      waterConsumption,
      wasteGenerated: totalWaste,
      recyclingRate: Math.round(recyclingRate * 10) / 10,
      renewableEnergyRate: Math.round(renewableRate * 10) / 10,
      esgScore: Math.min(esgScore, 100),
      certifications: certifications.map(c => c.nombre),
      breakdown: latestCarbon?.desglose || null,
      scope1: latestCarbon?.scope1 || 0,
      scope2: latestCarbon?.scope2 || 0,
      scope3: latestCarbon?.scope3 || 0,
    };

    return NextResponse.json(metrics);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('Error fetching ESG metrics:', error);
    return NextResponse.json(
      { error: 'Error al obtener métricas ESG', details: message },
      { status: 500 }
    );
  }
}
