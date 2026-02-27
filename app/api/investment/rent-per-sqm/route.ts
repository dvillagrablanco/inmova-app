import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/investment/rent-per-sqm
 * Rentabilidad por m² de cada unidad.
 * Detecta unidades infravaloradas vs media del edificio.
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

    // rentaMensual > 0 excluye unidades de uso propio de socios (renta=0)
    const units = await prisma.unit.findMany({
      where: {
        building: { companyId: scope.activeCompanyId, isDemo: false },
        estado: 'ocupada',
        rentaMensual: { gt: 0 },
      },
      select: {
        id: true,
        numero: true,
        tipo: true,
        superficie: true,
        superficieUtil: true,
        rentaMensual: true,
        buildingId: true,
        building: { select: { id: true, nombre: true } },
        tenant: { select: { nombreCompleto: true } },
      },
    });

    // Calcular €/m² por unidad
    const unitData = units
      .filter((u) => (u.superficieUtil || u.superficie) > 0)
      .map((u) => {
        const superficie = u.superficieUtil || u.superficie;
        const euroPorM2 = u.rentaMensual / superficie;
        return {
          id: u.id,
          numero: u.numero,
          tipo: u.tipo,
          edificio: u.building?.nombre || 'Sin edificio',
          edificioId: u.buildingId,
          inquilino: u.tenant?.nombreCompleto || null,
          superficie,
          rentaMensual: u.rentaMensual,
          euroPorM2: Math.round(euroPorM2 * 100) / 100,
        };
      });

    // Calcular media por edificio
    const byBuilding: Record<string, { units: typeof unitData; totalRent: number; totalSqm: number }> = {};
    for (const u of unitData) {
      if (!byBuilding[u.edificio]) {
        byBuilding[u.edificio] = { units: [], totalRent: 0, totalSqm: 0 };
      }
      byBuilding[u.edificio].units.push(u);
      byBuilding[u.edificio].totalRent += u.rentaMensual;
      byBuilding[u.edificio].totalSqm += u.superficie;
    }

    const edificios = Object.entries(byBuilding).map(([nombre, data]) => {
      const mediaEuroPorM2 = data.totalSqm > 0 ? data.totalRent / data.totalSqm : 0;

      const unidadesConAnalisis = data.units.map((u) => ({
        ...u,
        mediaEdificio: Math.round(mediaEuroPorM2 * 100) / 100,
        diferenciaVsMedia: Math.round((u.euroPorM2 - mediaEuroPorM2) * 100) / 100,
        infravalorada: u.euroPorM2 < mediaEuroPorM2 * 0.85, // >15% por debajo de la media
        potencialIncremento:
          u.euroPorM2 < mediaEuroPorM2
            ? Math.round((mediaEuroPorM2 - u.euroPorM2) * u.superficie * 100) / 100
            : 0,
      }));

      return {
        edificio: nombre,
        totalUnidades: data.units.length,
        mediaEuroPorM2: Math.round(mediaEuroPorM2 * 100) / 100,
        rentaTotal: data.totalRent,
        superficieTotal: data.totalSqm,
        infravaloradas: unidadesConAnalisis.filter((u) => u.infravalorada).length,
        potencialTotal: unidadesConAnalisis.reduce((s, u) => s + u.potencialIncremento, 0),
        unidades: unidadesConAnalisis.sort((a, b) => a.euroPorM2 - b.euroPorM2),
      };
    });

    const totalInfravaloradas = edificios.reduce((s, e) => s + e.infravaloradas, 0);
    const potencialTotal = edificios.reduce((s, e) => s + e.potencialTotal, 0);

    return NextResponse.json({
      success: true,
      resumen: {
        totalUnidades: unitData.length,
        infravaloradas: totalInfravaloradas,
        potencialIncrementoMensual: Math.round(potencialTotal * 100) / 100,
        potencialIncrementoAnual: Math.round(potencialTotal * 12 * 100) / 100,
      },
      edificios,
    });
  } catch (error: any) {
    logger.error('[Rent per sqm]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error calculando rentabilidad por m²' }, { status: 500 });
  }
}
