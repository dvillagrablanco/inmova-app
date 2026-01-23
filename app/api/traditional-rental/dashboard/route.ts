import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    // Consultas paralelas para mejor rendimiento
    const [
      totalBuildings,
      totalUnits,
      unitsByStatus,
      totalTenants,
      activeContracts,
      unitsByType,
      occupiedByType,
      buildingsWithMetrics,
      contractsExpiring,
    ] = await Promise.all([
      // Total de edificios
      prisma.building.count({ where: { companyId } }),
      
      // Total de unidades
      prisma.unit.count({ where: { building: { companyId } } }),
      
      // Unidades por estado
      prisma.unit.groupBy({
        by: ['estado'],
        where: { building: { companyId } },
        _count: true,
      }),
      
      // Total de inquilinos
      prisma.tenant.count({ where: { companyId } }),
      
      // Contratos activos
      prisma.contract.count({
        where: {
          unit: { building: { companyId } },
          estado: 'activo',
        },
      }),
      
      // Unidades por tipo
      prisma.unit.groupBy({
        by: ['tipo'],
        where: { building: { companyId } },
        _count: true,
      }),
      
      // Unidades ocupadas por tipo
      prisma.unit.groupBy({
        by: ['tipo'],
        where: { 
          building: { companyId },
          estado: 'ocupada',
        },
        _count: true,
      }),
      
      // Edificios con métricas
      prisma.building.findMany({
        where: { companyId },
        select: {
          id: true,
          nombre: true,
          units: {
            select: {
              id: true,
              estado: true,
              rentaMensual: true,
            },
          },
        },
        take: 10,
      }),
      
      // Contratos próximos a vencer (30 días)
      prisma.contract.findMany({
        where: {
          unit: { building: { companyId } },
          estado: 'activo',
          fechaFin: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          tenant: { select: { nombreCompleto: true } },
          unit: { 
            select: { 
              numero: true,
              building: { select: { nombre: true } },
            },
          },
        },
        orderBy: { fechaFin: 'asc' },
        take: 10,
      }),
    ]);

    // Calcular unidades por estado
    const unidadesOcupadas = unitsByStatus.find(s => s.estado === 'ocupada')?._count || 0;
    const unidadesDisponibles = unitsByStatus.find(s => s.estado === 'disponible')?._count || 0;
    const unidadesMantenimiento = unitsByStatus.find(s => s.estado === 'en_mantenimiento')?._count || 0;

    // Tasa de ocupación
    const tasaOcupacion = totalUnits > 0 ? (unidadesOcupadas / totalUnits) * 100 : 0;

    // Ocupación por tipo
    const ocupacionPorTipo = unitsByType.map(type => {
      const occupied = occupiedByType.find(o => o.tipo === type.tipo)?._count || 0;
      return {
        tipo: type.tipo || 'Sin tipo',
        ocupadas: occupied,
        disponibles: type._count - occupied,
        total: type._count,
      };
    });

    // Resumen por edificio
    const edificiosResumen = buildingsWithMetrics.map(building => {
      const unidadesEdificio = building.units.length;
      const ocupadasEdificio = building.units.filter(u => u.estado === 'ocupada').length;
      const ingresosEdificio = building.units
        .filter(u => u.estado === 'ocupada')
        .reduce((sum, u) => sum + (Number(u.rentaMensual) || 0), 0);
      
      return {
        id: building.id,
        nombre: building.nombre,
        unidades: unidadesEdificio,
        ocupadas: ocupadasEdificio,
        ingresos: ingresosEdificio,
      };
    });

    // Calcular ingresos mensuales totales
    const ingresosMensuales = edificiosResumen.reduce((sum, e) => sum + e.ingresos, 0);

    // Formatear contratos próximos a vencer
    const contratosProximosVencer = contractsExpiring.map(c => ({
      id: c.id,
      inquilino: c.tenant?.nombreCompleto || 'Sin asignar',
      unidad: `${c.unit?.building?.nombre || ''} - ${c.unit?.numero || ''}`,
      fechaFin: c.fechaFin.toISOString(),
    }));

    return NextResponse.json({
      edificios: totalBuildings,
      unidades: totalUnits,
      unidadesOcupadas,
      unidadesDisponibles,
      unidadesMantenimiento,
      inquilinos: totalTenants,
      contratosActivos: activeContracts,
      tasaOcupacion,
      ingresosMensuales,
      ocupacionPorTipo,
      edificiosResumen,
      contratosProximosVencer,
    });
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    logger.error('Error fetching traditional rental dashboard:', error);
    return NextResponse.json({ error: 'Error al obtener datos del dashboard' }, { status: 500 });
  }
}
