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
 * GET /api/ai/rent-optimization
 * Analiza rentas actuales vs media del edificio y del tipo de unidad.
 * Detecta unidades infravaloradas con potencial de incremento.
 * Genera recomendaciones por edificio.
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

    // Obtener todas las unidades ocupadas con contrato activo
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
        building: { select: { id: true, nombre: true } },
        contracts: {
          where: { estado: 'activo' },
          select: {
            fechaInicio: true,
            tenant: { select: { nombreCompleto: true } },
          },
          take: 1,
        },
      },
    });

    // Calcular medias por tipo de unidad y por edificio
    const byType: Record<string, number[]> = {};
    const byBuilding: Record<string, number[]> = {};
    const byBuildingAndType: Record<string, number[]> = {};

    for (const u of units) {
      const tipo = u.tipo || 'otro';
      const edificio = u.building?.nombre || 'Sin edificio';
      const key = `${edificio}|${tipo}`;
      const sqm = u.superficieUtil || u.superficie || 1;
      const eurPerSqm = u.rentaMensual / sqm;

      if (!byType[tipo]) byType[tipo] = [];
      byType[tipo].push(eurPerSqm);

      if (!byBuilding[edificio]) byBuilding[edificio] = [];
      byBuilding[edificio].push(eurPerSqm);

      if (!byBuildingAndType[key]) byBuildingAndType[key] = [];
      byBuildingAndType[key].push(eurPerSqm);
    }

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

    // Generar recomendaciones por unidad
    const recommendations = units.map((u) => {
      const tipo = u.tipo || 'otro';
      const edificio = u.building?.nombre || 'Sin edificio';
      const key = `${edificio}|${tipo}`;
      const sqm = u.superficieUtil || u.superficie || 1;
      const eurPerSqm = u.rentaMensual / sqm;

      const mediaTipo = avg(byType[tipo] || []);
      const mediaEdificio = avg(byBuilding[edificio] || []);
      const mediaEdificioTipo = avg(byBuildingAndType[key] || []);

      // Referencia principal: media del mismo tipo en el mismo edificio
      const referencia = mediaEdificioTipo || mediaEdificio || mediaTipo;
      const diferenciaVsRef = eurPerSqm - referencia;
      const pctDiferencia = referencia > 0 ? (diferenciaVsRef / referencia) * 100 : 0;

      const rentaOptima = Math.round(referencia * sqm * 100) / 100;
      const potencialIncremento = Math.max(0, rentaOptima - u.rentaMensual);

      const contract = u.contracts?.[0];
      const antiguedad = contract?.fechaInicio
        ? Math.round((Date.now() - new Date(contract.fechaInicio).getTime()) / (1000 * 60 * 60 * 24 * 365) * 10) / 10
        : null;

      let recomendacion = '';
      if (pctDiferencia < -15) {
        recomendacion = `Infravalorada un ${Math.abs(Math.round(pctDiferencia))}%. Incrementar a ${rentaOptima}€/mes en próxima renovación.`;
      } else if (pctDiferencia < -5) {
        recomendacion = `Ligeramente por debajo de mercado. Considerar incremento IPC+ en renovación.`;
      } else if (pctDiferencia > 15) {
        recomendacion = `Por encima de mercado. Riesgo de no renovación. Mantener precio actual.`;
      } else {
        recomendacion = 'Renta alineada con mercado. Aplicar IPC estándar.';
      }

      return {
        unitId: u.id,
        numero: u.numero,
        tipo,
        edificio,
        inquilino: contract?.tenant?.nombreCompleto || null,
        superficie: sqm,
        rentaActual: u.rentaMensual,
        eurPerSqmActual: Math.round(eurPerSqm * 100) / 100,
        eurPerSqmReferencia: Math.round(referencia * 100) / 100,
        rentaOptima,
        potencialIncremento: Math.round(potencialIncremento * 100) / 100,
        pctDiferencia: Math.round(pctDiferencia * 10) / 10,
        antiguedadAnos: antiguedad,
        recomendacion,
        prioridad: pctDiferencia < -15 ? 'alta' : pctDiferencia < -5 ? 'media' : 'baja',
      };
    });

    // Ordenar por potencial de incremento (mayor primero)
    recommendations.sort((a, b) => b.potencialIncremento - a.potencialIncremento);

    const infravaloradas = recommendations.filter((r) => r.prioridad === 'alta');
    const potencialTotal = infravaloradas.reduce((s, r) => s + r.potencialIncremento, 0);

    return NextResponse.json({
      success: true,
      resumen: {
        totalUnidades: recommendations.length,
        infravaloradas: infravaloradas.length,
        potencialMensual: Math.round(potencialTotal * 100) / 100,
        potencialAnual: Math.round(potencialTotal * 12 * 100) / 100,
        mediasPorTipo: Object.fromEntries(
          Object.entries(byType).map(([tipo, vals]) => [tipo, Math.round(avg(vals) * 100) / 100])
        ),
      },
      recomendaciones: recommendations,
    });
  } catch (error: any) {
    logger.error('[Rent Optimization]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error en optimización de rentas' }, { status: 500 });
  }
}
