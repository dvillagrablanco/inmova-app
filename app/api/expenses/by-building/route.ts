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
 * GET /api/expenses/by-building
 * Gastos agrupados por edificio con margen (ingresos - gastos).
 * Responde: ¿cuánto cuesta mantener Piamonte? ¿Y Espronceda?
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

    const companyId = scope.activeCompanyId;

    // Edificios con IBI
    const buildings = await prisma.building.findMany({
      where: { companyId, isDemo: false },
      select: {
        id: true,
        nombre: true,
        direccion: true,
        ibiAnual: true,
        gastosComunidad: true,
        units: {
          select: {
            id: true,
            estado: true,
            rentaMensual: true,
            gastosComunidad: true,
            ibiAnual: true,
          },
        },
      },
    });

    // Gastos por edificio
    const expenses = await prisma.expense.findMany({
      where: {
        OR: [
          { building: { companyId } },
          { unit: { building: { companyId } } },
        ],
        isDemo: false,
      },
      select: {
        buildingId: true,
        unitId: true,
        monto: true,
        categoria: true,
        unit: { select: { buildingId: true } },
      },
    });

    // Agrupar gastos por buildingId
    const gastosPorEdificio: Record<string, { total: number; porCategoria: Record<string, number> }> = {};
    for (const exp of expenses) {
      const bid = exp.buildingId || exp.unit?.buildingId;
      if (!bid) continue;
      if (!gastosPorEdificio[bid]) {
        gastosPorEdificio[bid] = { total: 0, porCategoria: {} };
      }
      gastosPorEdificio[bid].total += exp.monto;
      const cat = exp.categoria || 'otros';
      gastosPorEdificio[bid].porCategoria[cat] = (gastosPorEdificio[bid].porCategoria[cat] || 0) + exp.monto;
    }

    const resultado = buildings.map((b) => {
      const ingresosUnidades = b.units
        .filter((u: any) => u.estado === 'ocupada')
        .reduce((s: number, u: any) => s + (u.rentaMensual || 0), 0);
      const ingresosMensuales = ingresosUnidades;
      const ingresosAnuales = ingresosMensuales * 12;

      const ibiTotal = b.ibiAnual || b.units.reduce((s: number, u: any) => s + (u.ibiAnual || 0), 0);
      const comunidadMensual = b.gastosComunidad || b.units.reduce((s: number, u: any) => s + (u.gastosComunidad || 0), 0);
      const comunidadAnual = comunidadMensual * 12;

      const gastosRegistrados = gastosPorEdificio[b.id]?.total || 0;
      const gastosAnuales = ibiTotal + comunidadAnual + gastosRegistrados;

      const margenAnual = ingresosAnuales - gastosAnuales;
      const margenPct = ingresosAnuales > 0 ? (margenAnual / ingresosAnuales) * 100 : 0;

      return {
        edificioId: b.id,
        edificio: b.nombre,
        direccion: b.direccion,
        totalUnidades: b.units.length,
        ocupadas: b.units.filter((u: any) => u.estado === 'ocupada').length,
        ingresos: {
          mensual: Math.round(ingresosMensuales * 100) / 100,
          anual: Math.round(ingresosAnuales * 100) / 100,
        },
        gastos: {
          ibiAnual: ibiTotal,
          comunidadAnual,
          otrosGastos: gastosRegistrados,
          totalAnual: Math.round(gastosAnuales * 100) / 100,
          porCategoria: gastosPorEdificio[b.id]?.porCategoria || {},
        },
        margen: {
          anual: Math.round(margenAnual * 100) / 100,
          porcentaje: Math.round(margenPct * 10) / 10,
        },
      };
    });

    resultado.sort((a, b) => b.margen.anual - a.margen.anual);

    const totalIngresos = resultado.reduce((s, r) => s + r.ingresos.anual, 0);
    const totalGastos = resultado.reduce((s, r) => s + r.gastos.totalAnual, 0);

    return NextResponse.json({
      success: true,
      resumen: {
        totalEdificios: resultado.length,
        ingresosAnuales: totalIngresos,
        gastosAnuales: totalGastos,
        margenAnual: totalIngresos - totalGastos,
        margenPct: totalIngresos > 0 ? Math.round(((totalIngresos - totalGastos) / totalIngresos) * 1000) / 10 : 0,
      },
      edificios: resultado,
    });
  } catch (error: any) {
    logger.error('[Expenses by Building]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error calculando costes por edificio' }, { status: 500 });
  }
}
