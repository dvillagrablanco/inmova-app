import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import { normalizeInvestmentVehicleName, resolveFamilyOfficeScope } from '@/lib/family-office-scope';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/family-office/pe-module
 * 
 * Módulo Private Equity estilo MdF Family Partners:
 * - Tabla "Activos en Crecimiento" con capital management completo
 * - Rentabilidad mensual por fondo
 * - Métricas PE: DPI, TVPI, MOIC, IRR
 * - Agrupación por vehículo inversor (VIBLA SCR vs directo)
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const scope = await resolveFamilyOfficeScope(request, {
      id: session.user.id,
      role: session.user.role,
      companyId: session.user.companyId,
    });
    const allCompanyIds = scope.groupCompanyIds;

    const participations = await prisma.participation.findMany({
      where: { companyId: { in: allCompanyIds }, activa: true },
      orderBy: [{ anoCompromiso: 'asc' }, { targetCompanyName: 'asc' }],
    });

    const r = (n: number) => Math.round(n * 100) / 100;

    // Build fund data for each participation
    const fondos = participations.map((p) => {
      const capitalLlamado = p.capitalLlamado ?? p.costeAdquisicion;
      const capitalDistribuido = p.capitalDistribuido ?? 0;
      const valorActual = p.valoracionActual ?? p.valorEstimado ?? p.valorContable;
      const compromisoTotal = p.compromisoTotal ?? p.costeAdquisicion;
      const capitalPendiente = p.capitalPendiente ?? (compromisoTotal - capitalLlamado);

      // Métricas
      const tvpi = p.tvpi ?? (capitalLlamado > 0 ? (valorActual + capitalDistribuido) / capitalLlamado : 0);
      const dpi = p.dpi ?? (capitalLlamado > 0 ? capitalDistribuido / capitalLlamado : 0);
      const anosInversion = (Date.now() - new Date(p.fechaAdquisicion).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      const irr = p.irr ?? (anosInversion > 0 ? (Math.pow(Math.max(tvpi, 0.01), 1 / anosInversion) - 1) * 100 : 0);

      return {
        id: p.id,
        nombre: p.targetCompanyName,
        anoCompromiso: p.anoCompromiso ?? new Date(p.fechaAdquisicion).getFullYear(),
        vehiculoInversor: normalizeInvestmentVehicleName(p.vehiculoInversor),
        gestora: p.gestora,

        // Capital Management (tabla "Activos en Crecimiento")
        compromisoTotal: r(compromisoTotal),
        valoracionActual: r(valorActual),
        capitalPendiente: r(capitalPendiente),
        distribucionesAcumuladas: r(capitalDistribuido),
        capitalLlamado: r(capitalLlamado),
        // (Val + Dist) / Desemb = TVPI display
        valorMasDistribuciones: r(valorActual + capitalDistribuido),

        // Métricas
        tvpi: r(tvpi),
        dpi: r(dpi),
        moic: p.moic ?? r(p.costeAdquisicion > 0 ? valorActual / p.costeAdquisicion : 0),
        irr: r(irr),

        // Rentabilidad periodo (mensual)
        rentabilidad: {
          patrimonioInicio: r(p.patrimonioInicioPeriodo ?? 0),
          patrimonioFin: r(valorActual),
          desembolsos: r(p.desembolsosPeriodo ?? 0),
          reembolsos: r(p.reembolsosPeriodo ?? 0),
          rentabilidadEur: r(p.rentabilidadPeriodoEur ?? 0),
          rentabilidadPct: r(p.rentabilidadPeriodoPct ?? 0),
        },

        fechaUltimaValoracion: p.fechaUltimaValoracion ?? p.fechaValoracion,
      };
    });

    // Resumen consolidado
    const totalComprometido = fondos.reduce((s, f) => s + f.compromisoTotal, 0);
    const totalLlamado = fondos.reduce((s, f) => s + f.capitalLlamado, 0);
    const totalPendiente = fondos.reduce((s, f) => s + f.capitalPendiente, 0);
    const totalDistribuido = fondos.reduce((s, f) => s + f.distribucionesAcumuladas, 0);
    const totalValoracion = fondos.reduce((s, f) => s + f.valoracionActual, 0);
    const totalRentEur = fondos.reduce((s, f) => s + f.rentabilidad.rentabilidadEur, 0);
    const totalPatrIni = fondos.reduce((s, f) => s + f.rentabilidad.patrimonioInicio, 0);

    // Agrupación por vehículo
    const vehiculos: Record<string, typeof fondos> = {};
    for (const f of fondos) {
      const v = f.vehiculoInversor;
      if (!vehiculos[v]) vehiculos[v] = [];
      vehiculos[v].push(f);
    }

    // Vintage year summary
    const vintages: Record<number, { count: number; comprometido: number; valoracion: number; tvpiAvg: number }> = {};
    for (const f of fondos) {
      const y = f.anoCompromiso;
      if (!vintages[y]) vintages[y] = { count: 0, comprometido: 0, valoracion: 0, tvpiAvg: 0 };
      vintages[y].count++;
      vintages[y].comprometido += f.compromisoTotal;
      vintages[y].valoracion += f.valoracionActual;
    }
    for (const v of Object.values(vintages)) {
      v.tvpiAvg = v.count > 0 ? r(v.valoracion / v.comprometido) : 0;
    }

    return NextResponse.json({
      success: true,
      resumen: {
        fondos: fondos.length,
        totalComprometido: r(totalComprometido),
        totalLlamado: r(totalLlamado),
        capitalPendiente: r(totalPendiente),
        totalDistribuido: r(totalDistribuido),
        valorActual: r(totalValoracion),
        tvpiGlobal: totalLlamado > 0 ? r((totalValoracion + totalDistribuido) / totalLlamado) : 0,
        dpiGlobal: totalLlamado > 0 ? r(totalDistribuido / totalLlamado) : 0,
        rentabilidadPeriodoEur: r(totalRentEur),
        rentabilidadPeriodoPct: totalPatrIni > 0 ? r((totalRentEur / totalPatrIni) * 100) : 0,
      },
      fondos,
      vehiculos: Object.entries(vehiculos).map(([nombre, funds]) => ({
        nombre,
        fondos: funds.length,
        totalComprometido: r(funds.reduce((s, f) => s + f.compromisoTotal, 0)),
        totalValoracion: r(funds.reduce((s, f) => s + f.valoracionActual, 0)),
      })),
      vintages: Object.entries(vintages)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([year, data]) => ({ year: Number(year), ...data })),
    });
  } catch (error: unknown) {
    logger.error('[PE Module]:', error);
    return NextResponse.json({ error: 'Error en módulo PE' }, { status: 500 });
  }
}
