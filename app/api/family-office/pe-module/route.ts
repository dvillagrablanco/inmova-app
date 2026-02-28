import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/family-office/pe-module
 * Módulo Private Equity completo:
 * - Participaciones con capital calls y distribuciones
 * - J-curve tracking
 * - DPI, TVPI, IRR metrics
 * - Vintage year analysis
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const participations = await prisma.participation.findMany({
      where: { companyId: session.user.companyId },
      orderBy: { fechaAdquisicion: 'desc' },
    });

    // Métricas PE por participación
    const peMetrics = participations.map((p) => {
      const capitalLlamado = p.capitalLlamado || p.costeAdquisicion;
      const capitalDistribuido = p.capitalDistribuido || 0;
      const valorActual = p.valorEstimado || p.valorContable;
      const compromisoTotal = p.compromisoTotal || p.costeAdquisicion;

      // DPI: Distributed to Paid-In
      const dpi = capitalLlamado > 0 ? capitalDistribuido / capitalLlamado : 0;
      // TVPI: Total Value to Paid-In (valor actual + distribuciones) / capital llamado
      const tvpi = capitalLlamado > 0 ? (valorActual + capitalDistribuido) / capitalLlamado : 0;
      // MOIC: Multiple on Invested Capital
      const moic = p.costeAdquisicion > 0 ? valorActual / p.costeAdquisicion : 0;

      // J-curve: años desde inversión
      const anosInversion = (Date.now() - new Date(p.fechaAdquisicion).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      // IRR simplificado
      const irr = anosInversion > 0 ? (Math.pow(tvpi, 1 / anosInversion) - 1) * 100 : 0;

      // Capital pendiente de llamar
      const capitalPendiente = compromisoTotal - capitalLlamado;

      return {
        id: p.id,
        sociedad: p.targetCompanyName,
        cif: p.targetCompanyCIF,
        tipo: p.tipo,
        porcentaje: p.porcentaje,
        fechaAdquisicion: p.fechaAdquisicion,
        anosInversion: Math.round(anosInversion * 10) / 10,
        capital: {
          compromiso: compromisoTotal,
          llamado: capitalLlamado,
          pendiente: capitalPendiente,
          distribuido: capitalDistribuido,
        },
        valoracion: {
          coste: p.costeAdquisicion,
          contable: p.valorContable,
          estimado: valorActual,
          plusvalia: valorActual - p.costeAdquisicion,
        },
        metricas: {
          dpi: Math.round(dpi * 100) / 100,
          tvpi: Math.round(tvpi * 100) / 100,
          moic: Math.round(moic * 100) / 100,
          irr: Math.round(irr * 10) / 10,
        },
        activa: p.activa,
      };
    });

    // Resumen consolidado PE
    const activas = peMetrics.filter((p) => p.activa);
    const totalComprometido = activas.reduce((s, p) => s + p.capital.compromiso, 0);
    const totalLlamado = activas.reduce((s, p) => s + p.capital.llamado, 0);
    const totalDistribuido = activas.reduce((s, p) => s + p.capital.distribuido, 0);
    const totalValor = activas.reduce((s, p) => s + p.valoracion.estimado, 0);
    const totalCoste = activas.reduce((s, p) => s + p.valoracion.coste, 0);

    return NextResponse.json({
      success: true,
      resumen: {
        participaciones: activas.length,
        totalComprometido: Math.round(totalComprometido),
        totalLlamado: Math.round(totalLlamado),
        capitalPendiente: Math.round(totalComprometido - totalLlamado),
        totalDistribuido: Math.round(totalDistribuido),
        valorActual: Math.round(totalValor),
        costeTotal: Math.round(totalCoste),
        plusvaliaTotal: Math.round(totalValor - totalCoste),
        dpiGlobal: totalLlamado > 0 ? Math.round((totalDistribuido / totalLlamado) * 100) / 100 : 0,
        tvpiGlobal: totalLlamado > 0 ? Math.round(((totalValor + totalDistribuido) / totalLlamado) * 100) / 100 : 0,
      },
      participaciones: peMetrics,
    });
  } catch (error: any) {
    logger.error('[PE Module]:', error);
    return NextResponse.json({ error: 'Error en módulo PE' }, { status: 500 });
  }
}
