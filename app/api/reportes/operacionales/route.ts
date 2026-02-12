import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveAccountingScope } from '@/lib/accounting-scope';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const scope = await resolveAccountingScope(request, session.user as any);
    if (!scope) {
      return NextResponse.json({ error: 'Sin empresa asociada' }, { status: 403 });
    }

    const companyIds = scope.companyIds;
    const now = new Date();
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    // Queries paralelas
    const [
      buildingCount,
      unitCount,
      occupiedUnits,
      tenantCount,
      activeContracts,
      expiringContracts,
      maintenancePending,
      maintenanceInProgress,
      maintenanceResolved,
    ] = await Promise.all([
      prisma.building.count({
        where: { companyId: { in: companyIds } },
      }),
      prisma.unit.count({
        where: { building: { companyId: { in: companyIds } } },
      }),
      prisma.unit.count({
        where: { building: { companyId: { in: companyIds } }, estado: 'ocupada' },
      }),
      prisma.tenant.count({
        where: { companyId: { in: companyIds }, activo: true },
      }),
      prisma.contract.count({
        where: {
          unit: { building: { companyId: { in: companyIds } } },
          estado: 'activo',
        },
      }),
      prisma.contract.findMany({
        where: {
          unit: { building: { companyId: { in: companyIds } } },
          estado: 'activo',
          fechaFin: { gte: now, lte: in90Days },
        },
        include: {
          tenant: { select: { nombreCompleto: true } },
          unit: { select: { numero: true, building: { select: { nombre: true } } } },
        },
        orderBy: { fechaFin: 'asc' },
        take: 20,
      }),
      prisma.maintenanceRequest.count({
        where: {
          unit: { building: { companyId: { in: companyIds } } },
          estado: 'pendiente',
        },
      }),
      prisma.maintenanceRequest.count({
        where: {
          unit: { building: { companyId: { in: companyIds } } },
          estado: 'en_progreso',
        },
      }),
      prisma.maintenanceRequest.count({
        where: {
          unit: { building: { companyId: { in: companyIds } } },
          estado: { in: ['completada', 'cerrada'] },
        },
      }),
    ]);

    // Tiempo medio de resolucion
    let tiempoMedio = '-';
    try {
      const resolved = await prisma.maintenanceRequest.findMany({
        where: {
          unit: { building: { companyId: { in: companyIds } } },
          estado: { in: ['completada', 'cerrada'] },
          fechaResolucion: { not: null },
        },
        select: { fechaSolicitud: true, fechaResolucion: true },
        take: 100,
        orderBy: { fechaResolucion: 'desc' },
      });
      if (resolved.length > 0) {
        const totalDias = resolved.reduce((sum, r) => {
          if (r.fechaResolucion) {
            return sum + (r.fechaResolucion.getTime() - r.fechaSolicitud.getTime()) / (1000 * 60 * 60 * 24);
          }
          return sum;
        }, 0);
        const avg = totalDias / resolved.length;
        tiempoMedio = avg < 1 ? `${Math.round(avg * 24)}h` : `${avg.toFixed(1)} dias`;
      }
    } catch {
      // maintenanceRequest might not have fechaResolucion
    }

    const ocupacion = unitCount > 0 ? (occupiedUnits / unitCount) * 100 : 0;

    const stats = {
      propiedades: buildingCount,
      unidades: unitCount,
      unidadesOcupadas: occupiedUnits,
      inquilinosActivos: tenantCount,
      contratosActivos: activeContracts,
      contratosPorVencer: expiringContracts.length,
      incidenciasAbiertas: maintenancePending,
      incidenciasEnProgreso: maintenanceInProgress,
      incidenciasResueltas: maintenanceResolved,
      tiempoMedioResolucion: tiempoMedio,
      ocupacionMedia: Math.round(ocupacion * 10) / 10,
    };

    const contratosPorVencer = expiringContracts.map(c => ({
      id: c.id,
      inquilino: c.tenant?.nombreCompleto || 'Sin inquilino',
      propiedad: c.unit?.building?.nombre || '-',
      unidad: c.unit?.numero || '-',
      vence: c.fechaFin.toISOString(),
      diasRestantes: Math.ceil((c.fechaFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }));

    return NextResponse.json({ stats, contratosPorVencer });
  } catch (error: any) {
    console.error('[Reportes Operacionales Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo datos operacionales', details: error.message },
      { status: 500 }
    );
  }
}
