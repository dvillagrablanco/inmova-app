import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

// GET - Dashboard de comunidades
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');
    const comunidadId = searchParams.get('comunidadId');

    const companyId = (session.user as any).companyId;

    // Obtener buildingId si se proporciona comunidadId
    let targetBuildingId = buildingId;
    let comunidad = null;

    if (comunidadId) {
      comunidad = await prisma.communityManagement.findFirst({
        where: { id: comunidadId, companyId },
        include: {
          building: {
            include: {
              units: { select: { id: true, unitNumber: true, type: true, status: true } },
            },
          },
        },
      });
      targetBuildingId = comunidad?.buildingId || null;
    }

    const buildingWhere = targetBuildingId ? { buildingId: targetBuildingId } : {};
    const baseWhere = { companyId, ...buildingWhere };

    // Obtener todas las estadísticas en paralelo
    const [
      // Comunidades
      comunidadesStats,
      // Cuotas
      cuotasPendientes,
      cuotasCobradas,
      totalRecaudado,
      // Incidencias
      incidenciasAbiertas,
      incidenciasUrgentes,
      // Votaciones
      votacionesActivas,
      // Reuniones
      reunionesProximas,
      // Fondos
      fondosActivos,
      // Actas
      actasPendientes,
    ] = await Promise.all([
      // Comunidades totales
      prisma.communityManagement.aggregate({
        where: { companyId },
        _count: { id: true },
      }),
      // Cuotas pendientes
      prisma.communityFee.aggregate({
        where: { ...baseWhere, estado: 'pendiente' },
        _sum: { importeTotal: true },
        _count: { id: true },
      }),
      // Cuotas cobradas (últimos 30 días)
      prisma.communityFee.aggregate({
        where: {
          ...baseWhere,
          estado: 'pagado',
          fechaPago: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _sum: { importeTotal: true },
        _count: { id: true },
      }),
      // Total recaudado año actual
      prisma.communityFee.aggregate({
        where: {
          ...baseWhere,
          estado: 'pagado',
          fechaPago: { gte: new Date(new Date().getFullYear(), 0, 1) },
        },
        _sum: { importeTotal: true },
      }),
      // Incidencias abiertas
      prisma.communityIncident.count({
        where: { ...baseWhere, estado: 'abierta' },
      }),
      // Incidencias urgentes
      prisma.communityIncident.count({
        where: { ...baseWhere, prioridad: 'urgente', estado: { notIn: ['resuelta', 'cerrada'] } },
      }),
      // Votaciones activas
      prisma.communityVote.count({
        where: { ...baseWhere, estado: 'activa', fechaCierre: { gt: new Date() } },
      }),
      // Reuniones próximas (30 días)
      prisma.communityMeeting.findMany({
        where: {
          ...baseWhere,
          estado: 'programada',
          fechaReunion: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { fechaReunion: 'asc' },
        take: 5,
        include: {
          building: { select: { id: true, name: true } },
        },
      }),
      // Fondos activos
      prisma.communityFund.aggregate({
        where: { ...baseWhere, activo: true },
        _sum: { saldoActual: true },
        _count: { id: true },
      }),
      // Actas en borrador
      prisma.communityMinute.count({
        where: { ...baseWhere, estado: 'borrador' },
      }),
    ]);

    // Morosos (unidades con cuotas pendientes)
    const morosos = await prisma.communityFee.groupBy({
      by: ['unitId'],
      where: { ...baseWhere, estado: 'pendiente' },
      _sum: { importeTotal: true },
      _count: { id: true },
    });

    // Evolución mensual de recaudación (últimos 6 meses)
    const mesesAtras = 6;
    const evolucionRecaudacion = [];
    for (let i = mesesAtras - 1; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
      const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

      const recaudado = await prisma.communityFee.aggregate({
        where: {
          ...baseWhere,
          estado: 'pagado',
          fechaPago: { gte: inicioMes, lte: finMes },
        },
        _sum: { importeTotal: true },
      });

      evolucionRecaudacion.push({
        mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
        recaudado: recaudado._sum.importeTotal || 0,
      });
    }

    // Distribución de incidencias por tipo
    const incidenciasPorTipo = await prisma.communityIncident.groupBy({
      by: ['tipo'],
      where: baseWhere,
      _count: { id: true },
    });

    return NextResponse.json({
      resumen: {
        comunidadesGestionadas: comunidadesStats._count.id,
        totalUnidades: comunidad?.building?.units?.length || 0,
      },
      finanzas: {
        cuotasPendientes: cuotasPendientes._count.id,
        importePendiente: cuotasPendientes._sum.importeTotal || 0,
        cuotasCobradas30d: cuotasCobradas._count.id,
        importeCobrado30d: cuotasCobradas._sum.importeTotal || 0,
        totalRecaudadoAnual: totalRecaudado._sum.importeTotal || 0,
        unidadesMorosas: morosos.length,
        fondosDisponibles: fondosActivos._sum.saldoActual || 0,
        totalFondos: fondosActivos._count.id,
      },
      operativo: {
        incidenciasAbiertas,
        incidenciasUrgentes,
        votacionesActivas,
        actasPendientes,
      },
      calendario: {
        reunionesProximas: reunionesProximas.map(r => ({
          id: r.id,
          titulo: r.titulo,
          tipo: r.tipo,
          fecha: r.fechaReunion,
          ubicacion: r.ubicacion,
          edificio: r.building?.name,
        })),
      },
      graficos: {
        evolucionRecaudacion,
        incidenciasPorTipo: incidenciasPorTipo.map(i => ({
          tipo: i.tipo,
          cantidad: i._count.id,
        })),
      },
      comunidad: comunidad ? {
        id: comunidad.id,
        nombre: comunidad.nombreComunidad,
        edificio: comunidad.building?.name,
        direccion: comunidad.direccion,
      } : null,
    });
  } catch (error: any) {
    logger.error('[Dashboard Comunidades Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo dashboard', details: error.message },
      { status: 500 }
    );
  }
}
