import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import { addDays, startOfMonth, endOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Resolve company scope (include subsidiaries)
    const { resolveCompanyScope } = await import('@/lib/company-scope');
    const scope = await resolveCompanyScope({
      userId: (session.user as any).id as string,
      role: ((session.user as any).role || 'admin') as any,
      primaryCompanyId: session.user.companyId,
      request,
    });

    const companyFilter = { in: scope.scopeCompanyIds };
    const now = new Date();
    const startMonth = startOfMonth(now);
    const endMonth = endOfMonth(now);

    // ── Check CommercialSpace model first ──
    const commercialSpaceCount = await prisma.commercialSpace.count({
      where: { companyId: companyFilter },
    });

    // ── If no CommercialSpace records, use Unit model (tertiary units) as fallback ──
    if (commercialSpaceCount === 0) {
      const tertiaryTypes = ['local', 'oficina', 'nave_industrial', 'coworking_space', 'terreno'];

      const tertiaryUnits = await prisma.unit.findMany({
        where: {
          building: { companyId: companyFilter, isDemo: false },
          tipo: { in: tertiaryTypes as any },
        },
        include: {
          building: {
            select: { nombre: true, direccion: true, company: { select: { nombre: true } } },
          },
          contracts: {
            where: { estado: 'activo' },
            select: {
              id: true,
              tenant: { select: { nombreCompleto: true } },
              fechaFin: true,
              rentaMensual: true,
            },
            take: 1,
          },
        },
      });

      const totalEspacios = tertiaryUnits.length;
      const espaciosOcupados = tertiaryUnits.filter(
        (u) => u.estado === 'ocupada' || u.contracts.length > 0
      ).length;
      const espaciosDisponibles = totalEspacios - espaciosOcupados;
      const tasaOcupacion = totalEspacios > 0 ? (espaciosOcupados / totalEspacios) * 100 : 0;
      const ingresosRecurrentes = tertiaryUnits.reduce(
        (s, u) => s + (u.contracts[0]?.rentaMensual || u.rentaMensual || 0),
        0
      );

      // Group by unit type
      const byType: Record<string, { count: number; occupied: number }> = {};
      tertiaryUnits.forEach((u) => {
        const t = u.tipo;
        if (!byType[t]) byType[t] = { count: 0, occupied: 0 };
        byType[t].count++;
        if (u.estado === 'ocupada' || u.contracts.length > 0) byType[t].occupied++;
      });

      const typeNames: Record<string, string> = {
        local: 'Locales Comerciales',
        oficina: 'Oficinas',
        nave_industrial: 'Naves Industriales',
        coworking_space: 'Coworking',
        terreno: 'Terrenos / Solares',
      };

      const spaceTypes = Object.entries(byType).map(([tipo, data]) => ({
        id: tipo,
        name: typeNames[tipo] || tipo,
        count: data.count,
        occupied: data.occupied,
      }));

      // Contracts expiring in 90 days
      const upcomingExpirations = tertiaryUnits
        .filter(
          (u) =>
            u.contracts[0]?.fechaFin &&
            u.contracts[0].fechaFin > now &&
            u.contracts[0].fechaFin < addDays(now, 90)
        )
        .map((u) => ({
          id: u.contracts[0].id,
          space: `${u.building?.nombre} ${u.numero}`,
          tenant: u.contracts[0].tenant?.nombreCompleto || 'Inquilino',
          date: u.contracts[0].fechaFin.toISOString().split('T')[0],
          daysLeft: Math.ceil(
            (u.contracts[0].fechaFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          ),
        }));

      // Recent activity — last created tertiary contracts
      const recentContracts = tertiaryUnits
        .filter((u) => u.contracts.length > 0)
        .sort((a, b) => (b.contracts[0]?.id || '').localeCompare(a.contracts[0]?.id || ''))
        .slice(0, 5);

      const recentActivity = recentContracts.map((u) => ({
        id: u.contracts[0].id,
        type: 'contrato',
        text: `Contrato activo - ${u.building?.nombre} ${u.numero} (${u.tipo})`,
        date: new Date().toISOString(),
        status: 'success',
      }));

      return NextResponse.json({
        stats: {
          totalEspacios,
          espaciosOcupados,
          espaciosDisponibles,
          tasaOcupacion: Math.round(tasaOcupacion * 10) / 10,
          ingresosRecurrentes,
          ingresosPendientes: 0,
          contratosPorVencer: upcomingExpirations.length,
          visitasProgramadas: 0,
        },
        spaceTypes,
        recentActivity,
        upcomingExpirations,
        source: 'unit_model', // indicates data comes from Unit model fallback
      });
    }

    // ── Standard CommercialSpace flow ──
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
      prisma.commercialSpace.count({ where: { companyId: companyFilter } }),
      prisma.commercialSpace.count({ where: { companyId: companyFilter, estado: 'ocupada' } }),
      prisma.commercialSpace.groupBy({
        by: ['tipo'],
        where: { companyId: companyFilter },
        _count: { id: true },
      }),
      prisma.commercialLease.findMany({
        where: { commercialSpace: { companyId: companyFilter }, estado: 'activo' },
        include: { commercialSpace: { select: { nombre: true, tipo: true } } },
      }),
      prisma.commercialLease.findMany({
        where: {
          commercialSpace: { companyId: companyFilter },
          estado: 'activo',
          fechaFin: { gte: now, lte: addDays(now, 90) },
        },
        include: { commercialSpace: { select: { nombre: true } } },
        orderBy: { fechaFin: 'asc' },
        take: 10,
      }),
      prisma.commercialVisit.count({
        where: {
          commercialSpace: { companyId: companyFilter },
          fechaHora: { gte: now },
          estado: 'programada',
        },
      }),
      prisma.commercialPayment.aggregate({
        where: {
          commercialLease: { commercialSpace: { companyId: companyFilter } },
          estado: 'pagado',
          fechaPago: { gte: startMonth, lte: endMonth },
        },
        _sum: { importeTotal: true },
      }),
      prisma.commercialPayment.aggregate({
        where: {
          commercialLease: { commercialSpace: { companyId: companyFilter } },
          estado: 'pendiente',
        },
        _sum: { importeTotal: true },
      }),
    ]);

    const espaciosDisponibles = totalEspacios - espaciosOcupados;
    const tasaOcupacion = totalEspacios > 0 ? (espaciosOcupados / totalEspacios) * 100 : 0;
    const ingresosRecurrentes = pagosDelMes._sum.importeTotal || 0;
    const ingresosPendientes = pagosPendientes._sum.importeTotal || 0;

    const spaceTypes = espaciosPorTipo.map((grupo) => {
      const ocupados = contratosActivos.filter(
        (c: any) => c.commercialSpace?.tipo === grupo.tipo
      ).length;
      return {
        id: grupo.tipo.toLowerCase(),
        name: getSpaceTypeName(grupo.tipo),
        count: grupo._count.id,
        occupied: ocupados,
      };
    });

    const ultimosContratos = await prisma.commercialLease.findMany({
      where: { commercialSpace: { companyId: companyFilter } },
      include: { commercialSpace: { select: { nombre: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const recentActivity = ultimosContratos.map((c) => ({
      id: c.id,
      type: 'contrato',
      text: `${c.estado === 'activo' ? 'Contrato activo' : 'Contrato'} - ${c.commercialSpace?.nombre}`,
      date: c.createdAt.toISOString(),
      status: c.estado === 'activo' ? 'success' : 'info',
    }));

    const upcomingExpirations = contratosPorVencer.map((c: any) => ({
      id: c.id,
      space: c.commercialSpace?.nombre || 'Espacio',
      tenant: c.arrendatarioNombre || 'Inquilino',
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
    return NextResponse.json({ error: 'Error al obtener datos del dashboard' }, { status: 500 });
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
