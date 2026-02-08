import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { addDays, startOfMonth, endOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const now = new Date();
    const startMonth = startOfMonth(now);
    const endMonth = endOfMonth(now);

    // Obtener estadísticas de espacios comerciales
    const [
      totalEspacios,
      espaciosOcupados,
      espaciosPorTipo,
      contratosActivos,
      contratosPorVencer,
      visitasProgramadas,
      pagosDelMes,
      pagosPendientes,
    ] = await Promise.all([
      // Total de espacios
      prisma.commercialSpace.count({
        where: { companyId },
      }),

      // Espacios ocupados (con contrato activo)
      prisma.commercialSpace.count({
        where: {
          companyId,
          estado: 'ocupada',
        },
      }),

      // Espacios por tipo
      prisma.commercialSpace.groupBy({
        by: ['tipo'],
        where: { companyId },
        _count: { id: true },
      }),

      // Contratos activos
      prisma.commercialLease.findMany({
        where: {
          space: { companyId },
          estado: 'activo',
        },
        include: {
          space: {
            select: { nombre: true, tipo: true },
          },
          tenant: {
            select: { nombreCompleto: true },
          },
        },
      }),

      // Contratos por vencer en los próximos 90 días
      prisma.commercialLease.findMany({
        where: {
          space: { companyId },
          estado: 'activo',
          fechaFin: {
            gte: now,
            lte: addDays(now, 90),
          },
        },
        include: {
          space: {
            select: { nombre: true },
          },
          tenant: {
            select: { nombreCompleto: true },
          },
        },
        orderBy: { fechaFin: 'asc' },
        take: 10,
      }),

      // Visitas programadas
      prisma.commercialVisit.count({
        where: {
          space: { companyId },
          fecha: { gte: now },
          estado: 'programada',
        },
      }),

      // Pagos del mes actual
      prisma.commercialPayment.aggregate({
        where: {
          lease: { space: { companyId } },
          estado: 'pagado',
          fechaPago: {
            gte: startMonth,
            lte: endMonth,
          },
        },
        _sum: { monto: true },
      }),

      // Pagos pendientes
      prisma.commercialPayment.aggregate({
        where: {
          lease: { space: { companyId } },
          estado: 'pendiente',
        },
        _sum: { monto: true },
      }),
    ]);

    // Calcular estadísticas
    const espaciosDisponibles = totalEspacios - espaciosOcupados;
    const tasaOcupacion = totalEspacios > 0 ? (espaciosOcupados / totalEspacios) * 100 : 0;
    const ingresosRecurrentes = pagosDelMes._sum.monto || 0;
    const ingresosPendientes = pagosPendientes._sum.monto || 0;

    // Mapear tipos de espacios
    const spaceTypes = espaciosPorTipo.map((grupo) => {
      const ocupados = contratosActivos.filter(
        (c: any) => c.space?.tipo === grupo.tipo
      ).length;

      return {
        id: grupo.tipo.toLowerCase(),
        name: getSpaceTypeName(grupo.tipo),
        count: grupo._count.id,
        occupied: ocupados,
      };
    });

    // Actividad reciente (últimos contratos y pagos)
    const ultimosContratos = await prisma.commercialLease.findMany({
      where: {
        space: { companyId },
      },
      include: {
        space: { select: { nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const recentActivity = ultimosContratos.map((c) => ({
      id: c.id,
      type: 'contrato',
      text: `${c.estado === 'activo' ? 'Contrato activo' : 'Contrato'} - ${c.space?.nombre}`,
      date: c.createdAt.toISOString(),
      status: c.estado === 'activo' ? 'success' : 'info',
    }));

    // Próximos vencimientos
    const upcomingExpirations = contratosPorVencer.map((c: any) => ({
      id: c.id,
      space: c.space?.nombre || 'Espacio',
      tenant: c.tenant?.nombreCompleto || 'Inquilino',
      date: c.fechaFin.toISOString().split('T')[0],
      daysLeft: Math.ceil((c.fechaFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }));

    return NextResponse.json({
      stats: {
        totalEspacios,
        espaciosOcupados,
        espaciosDisponibles,
        tasaOcupacion: Math.round(tasaOcupacion * 10) / 10,
        ingresosRecurrentes,
        ingresosPendientes,
        contratosPorVencer: contratosPorVencer.length,
        visitasProgramadas,
      },
      spaceTypes,
      recentActivity,
      upcomingExpirations,
    });
  } catch (error) {
    logger.error('Error fetching comercial dashboard:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del dashboard' },
      { status: 500 }
    );
  }
}

function getSpaceTypeName(tipo: string): string {
  const names: Record<string, string> = {
    OFICINA: 'Oficinas',
    LOCAL: 'Locales',
    NAVE: 'Naves Industriales',
    COWORKING: 'Coworking',
    ALMACEN: 'Almacenes',
    TERRAZA: 'Terrazas',
    PARKING: 'Parking',
  };
  return names[tipo] || tipo;
}
