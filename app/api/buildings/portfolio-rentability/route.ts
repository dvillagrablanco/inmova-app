/**
 * GET /api/buildings/portfolio-rentability?year=2026
 *
 * Devuelve la rentabilidad consolidada de TODO el portfolio del grupo
 * (scope del usuario actual). Para cada edificio:
 *  - Apuntes contables del año
 *  - Ingresos totales y por categoría
 *  - Gastos totales y por categoría
 *  - NOI (Net Operating Income) y margen NOI %
 *  - Renta contractual mensual
 *  - Ocupación
 *  - Variación vs año anterior
 *  - Yield bruto y neto
 *
 * Y agregados del grupo:
 *  - Top edificios por NOI absoluto
 *  - Bottom edificios (pérdidas)
 *  - Total grupo
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as any).role,
      primaryCompanyId: session.user.companyId,
      request,
    });

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);
    const prevStart = new Date(year - 1, 0, 1);
    const prevEnd = new Date(year, 0, 1);

    const prisma = await getPrisma();
    const scopeIds = scope.scopeCompanyIds;

    // Buildings del scope (incluye ajenos con units propias)
    const buildings = await prisma.building.findMany({
      where: {
        OR: [
          { companyId: { in: scopeIds } },
          { units: { some: { ownerCompanyId: { in: scopeIds } } } },
        ],
      },
      select: {
        id: true,
        nombre: true,
        direccion: true,
        companyId: true,
        company: { select: { nombre: true } },
        units: {
          select: {
            id: true,
            estado: true,
            superficie: true,
            rentaMensual: true,
            precioCompra: true,
            valorMercado: true,
            ownerCompanyId: true,
            contracts: {
              where: { estado: 'activo' },
              select: { rentaMensual: true },
              take: 1,
            },
          },
        },
      },
    });

    // Para evitar N+1, agregamos en bulk para todos los buildings + units del scope
    const allUnitIds = buildings.flatMap((b) => b.units.map((u) => u.id));

    // Apuntes año actual: agrupados por building y categoría
    const [atCurrent, atPrev] = await Promise.all([
      prisma.accountingTransaction.groupBy({
        by: ['buildingId', 'tipo'],
        where: {
          companyId: { in: scopeIds },
          fecha: { gte: yearStart, lt: yearEnd },
        },
        _sum: { monto: true },
        _count: true,
      }),
      prisma.accountingTransaction.groupBy({
        by: ['buildingId', 'tipo'],
        where: {
          companyId: { in: scopeIds },
          fecha: { gte: prevStart, lt: prevEnd },
        },
        _sum: { monto: true },
      }),
    ]);

    // Construir mapa por building
    const byBuilding: Record<string, any> = {};
    for (const a of atCurrent) {
      if (!a.buildingId) continue;
      byBuilding[a.buildingId] ??= {
        ingresosCurrent: 0, gastosCurrent: 0,
        ingresosPrev: 0, gastosPrev: 0,
        apuntes: 0,
      };
      const r = byBuilding[a.buildingId];
      if (a.tipo === 'ingreso') r.ingresosCurrent += a._sum.monto || 0;
      else if (a.tipo === 'gasto') r.gastosCurrent += a._sum.monto || 0;
      r.apuntes += a._count;
    }
    for (const a of atPrev) {
      if (!a.buildingId) continue;
      byBuilding[a.buildingId] ??= {
        ingresosCurrent: 0, gastosCurrent: 0,
        ingresosPrev: 0, gastosPrev: 0, apuntes: 0,
      };
      const r = byBuilding[a.buildingId];
      if (a.tipo === 'ingreso') r.ingresosPrev += a._sum.monto || 0;
      else if (a.tipo === 'gasto') r.gastosPrev += a._sum.monto || 0;
    }

    // Construir resultado por edificio
    const items = buildings.map((b) => {
      const stats = byBuilding[b.id] || {
        ingresosCurrent: 0, gastosCurrent: 0,
        ingresosPrev: 0, gastosPrev: 0, apuntes: 0,
      };
      const noi = stats.ingresosCurrent - stats.gastosCurrent;
      const noiPrev = stats.ingresosPrev - stats.gastosPrev;
      const totalUnits = b.units.length;
      const occupied = b.units.filter((u) =>
        ['ocupada', 'uso_empresa'].includes(u.estado)
      ).length;
      const ocupacionPct = totalUnits > 0 ? (occupied / totalUnits) * 100 : 0;

      const rentaContractualMensual = b.units.reduce((s, u) => {
        const c = u.contracts?.[0];
        return s + (c ? Number(c.rentaMensual || 0) : Number(u.rentaMensual || 0));
      }, 0);
      const rentaContractualAnual = rentaContractualMensual * 12;

      const valorInversion = b.units.reduce((s, u) => s + Number(u.precioCompra || 0), 0);
      const valorMercado = b.units.reduce(
        (s, u) => s + Number(u.valorMercado || u.precioCompra || 0),
        0
      );

      const yieldBruto =
        valorInversion > 0 ? (rentaContractualAnual / valorInversion) * 100 : 0;
      const yieldNeto = valorInversion > 0 ? (noi / valorInversion) * 100 : 0;
      const margenNoi =
        stats.ingresosCurrent > 0 ? (noi / stats.ingresosCurrent) * 100 : 0;

      const variacionNoi =
        Math.abs(noiPrev) > 0.01 ? ((noi - noiPrev) / Math.abs(noiPrev)) * 100 : 0;

      return {
        id: b.id,
        nombre: b.nombre,
        direccion: b.direccion,
        gestorCompanyId: b.companyId,
        gestorNombre: b.company?.nombre,
        ocupacion: { totalUnits, occupied, pct: Math.round(ocupacionPct * 10) / 10 },
        rentaContractual: {
          mensual: Math.round(rentaContractualMensual * 100) / 100,
          anual: Math.round(rentaContractualAnual * 100) / 100,
        },
        valorInversion: Math.round(valorInversion * 100) / 100,
        valorMercado: Math.round(valorMercado * 100) / 100,
        contabilidad: {
          apuntes: stats.apuntes,
          ingresos: Math.round(stats.ingresosCurrent * 100) / 100,
          gastos: Math.round(stats.gastosCurrent * 100) / 100,
          noi: Math.round(noi * 100) / 100,
          margenNoiPct: Math.round(margenNoi * 10) / 10,
          ingresosPrev: Math.round(stats.ingresosPrev * 100) / 100,
          gastosPrev: Math.round(stats.gastosPrev * 100) / 100,
          noiPrev: Math.round(noiPrev * 100) / 100,
          variacionNoiPct: Math.round(variacionNoi * 10) / 10,
        },
        rentabilidad: {
          yieldBrutoPct: Math.round(yieldBruto * 100) / 100,
          yieldNetoPct: Math.round(yieldNeto * 100) / 100,
        },
      };
    });

    // Ordenar por NOI descendente
    items.sort((a, b) => b.contabilidad.noi - a.contabilidad.noi);

    // Totales del portfolio
    const totales = items.reduce(
      (acc, i) => {
        acc.ingresos += i.contabilidad.ingresos;
        acc.gastos += i.contabilidad.gastos;
        acc.noi += i.contabilidad.noi;
        acc.rentaAnual += i.rentaContractual.anual;
        acc.valorInversion += i.valorInversion;
        acc.totalUnits += i.ocupacion.totalUnits;
        acc.occupied += i.ocupacion.occupied;
        acc.apuntes += i.contabilidad.apuntes;
        return acc;
      },
      {
        ingresos: 0, gastos: 0, noi: 0, rentaAnual: 0,
        valorInversion: 0, totalUnits: 0, occupied: 0, apuntes: 0,
      }
    );

    const top5 = [...items]
      .filter((i) => i.contabilidad.noi > 0)
      .slice(0, 5);
    const bottom5 = [...items]
      .filter((i) => i.contabilidad.noi < 0)
      .slice(-5)
      .reverse();

    return NextResponse.json({
      success: true,
      year,
      buildingsCount: items.length,
      totales: {
        ingresos: Math.round(totales.ingresos * 100) / 100,
        gastos: Math.round(totales.gastos * 100) / 100,
        noi: Math.round(totales.noi * 100) / 100,
        margenNoiPct:
          totales.ingresos > 0 ? Math.round((totales.noi / totales.ingresos) * 1000) / 10 : 0,
        rentaContractualAnual: Math.round(totales.rentaAnual * 100) / 100,
        valorInversion: Math.round(totales.valorInversion * 100) / 100,
        ocupacionPct:
          totales.totalUnits > 0
            ? Math.round((totales.occupied / totales.totalUnits) * 1000) / 10
            : 0,
        totalUnits: totales.totalUnits,
        occupiedUnits: totales.occupied,
        apuntes: totales.apuntes,
      },
      buildings: items,
      top5,
      bottom5,
    });
  } catch (error: any) {
    logger.error('[Portfolio rentability] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error' },
      { status: 500 }
    );
  }
}
