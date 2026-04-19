/**
 * GET /api/buildings/[id]/rentability?year=2026
 *
 * Devuelve la rentabilidad contable REAL del edificio basada en
 * AccountingTransaction (Zucchetti) ya sincronizadas.
 *
 * Calcula:
 *  - Ingresos: SUM(monto) de tipo='ingreso' del año, vinculados al edificio
 *    (por buildingId directo, o por units.ownerCompanyId × subcuenta de
 *    arrendamiento que mencione el edificio)
 *  - Gastos: SUM(monto) de tipo='gasto', vinculados al edificio
 *  - Desglose por categoría
 *  - NOI = ingresos - gastos
 *  - Margen NOI %
 *  - Renta contractual mensual y vacancia
 *  - Yield bruto y neto sobre valor de inversión
 *  - Comparación vs año anterior
 */
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);
    const prevStart = new Date(year - 1, 0, 1);
    const prevEnd = new Date(year, 0, 1);

    const prisma = await getPrisma();

    // Cargar building + units + datos físicos
    const building = await prisma.building.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        nombre: true,
        direccion: true,
        companyId: true,
        ibiAnual: true,
        gastosComunidad: true,
        units: {
          select: {
            id: true,
            tipo: true,
            superficie: true,
            estado: true,
            rentaMensual: true,
            valorMercado: true,
            precioCompra: true,
            ownerCompanyId: true,
            contracts: {
              where: { estado: 'activo' },
              select: { rentaMensual: true, fechaInicio: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!building) {
      return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
    }

    const unitIds = building.units.map((u) => u.id);

    // Filtro: AT cuyo buildingId es este Y/O cuyo unitId pertenece a units del building
    const atFilter = {
      OR: [
        { buildingId: building.id },
        ...(unitIds.length > 0 ? [{ unitId: { in: unitIds } }] : []),
      ],
    };

    const [
      atCurrentYear,
      atPrevYear,
      paymentsCurrentYear,
      expensesCurrentYear,
    ] = await Promise.all([
      prisma.accountingTransaction.findMany({
        where: { ...atFilter, fecha: { gte: yearStart, lt: yearEnd } },
        select: {
          id: true,
          tipo: true,
          categoria: true,
          monto: true,
          fecha: true,
          subcuenta: true,
          concepto: true,
        },
      }),
      prisma.accountingTransaction.findMany({
        where: { ...atFilter, fecha: { gte: prevStart, lt: prevEnd } },
        select: { tipo: true, monto: true },
      }),
      // Pagos cobrados del año (de inquilinos directos en Inmova)
      unitIds.length > 0
        ? prisma.payment.findMany({
            where: {
              estado: 'pagado',
              fechaPago: { gte: yearStart, lt: yearEnd },
              contract: { unitId: { in: unitIds } },
            },
            select: { monto: true },
          })
        : [],
      // Expenses del año
      prisma.expense.findMany({
        where: {
          fecha: { gte: yearStart, lt: yearEnd },
          OR: [
            { buildingId: building.id },
            ...(unitIds.length > 0 ? [{ unitId: { in: unitIds } }] : []),
          ],
        },
        select: { monto: true, categoria: true },
      }),
    ]);

    // ============ INGRESOS Y GASTOS DEL AÑO (Zucchetti) ============
    let ingresos = 0;
    let gastos = 0;
    const ingresosPorCategoria: Record<string, number> = {};
    const gastosPorCategoria: Record<string, number> = {};

    for (const tx of atCurrentYear) {
      if (tx.tipo === 'ingreso') {
        ingresos += tx.monto;
        const cat = tx.categoria || 'otros';
        ingresosPorCategoria[cat] = (ingresosPorCategoria[cat] || 0) + tx.monto;
      } else if (tx.tipo === 'gasto') {
        gastos += tx.monto;
        const cat = tx.categoria || 'otros';
        gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + tx.monto;
      }
    }

    // Año anterior (comparación)
    let ingresosPrev = 0;
    let gastosPrev = 0;
    for (const tx of atPrevYear) {
      if (tx.tipo === 'ingreso') ingresosPrev += tx.monto;
      else if (tx.tipo === 'gasto') gastosPrev += tx.monto;
    }

    // ============ INGRESOS REALES POR PAGOS DIRECTOS (Inmova) ============
    const ingresosPagosDirectos = paymentsCurrentYear.reduce(
      (s, p) => s + Number(p.monto || 0),
      0
    );

    // ============ GASTOS DIRECTOS (Inmova expenses) ============
    const gastosExpensesDirectos = expensesCurrentYear.reduce(
      (s, e) => s + Number(e.monto || 0),
      0
    );

    // ============ KPIs OPERATIVOS ============
    const totalUnits = building.units.length;
    const occupiedUnits = building.units.filter((u) =>
      ['ocupada', 'uso_empresa'].includes(u.estado)
    ).length;
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    const rentaContractualMensual = building.units.reduce((s, u) => {
      const c = u.contracts?.[0];
      return s + (c ? Number(c.rentaMensual || 0) : Number(u.rentaMensual || 0));
    }, 0);
    const rentaContractualAnual = rentaContractualMensual * 12;

    const valorInversion = building.units.reduce((s, u) => s + Number(u.precioCompra || 0), 0);
    const valorMercado = building.units.reduce(
      (s, u) => s + Number(u.valorMercado || u.precioCompra || 0),
      0
    );
    const superficieTotal = building.units.reduce((s, u) => s + Number(u.superficie || 0), 0);

    // ============ NOI Y RATIOS ============
    const noi = ingresos - gastos;
    const margenNoi = ingresos > 0 ? (noi / ingresos) * 100 : 0;

    const yieldBruto = valorInversion > 0 ? (rentaContractualAnual / valorInversion) * 100 : 0;
    const yieldNeto = valorInversion > 0 ? (noi / valorInversion) * 100 : 0;

    const ingresosVarPct =
      ingresosPrev > 0 ? ((ingresos - ingresosPrev) / ingresosPrev) * 100 : 0;
    const gastosVarPct = gastosPrev > 0 ? ((gastos - gastosPrev) / gastosPrev) * 100 : 0;

    // ============ FUENTES DE DATOS ============
    const fuentes: Record<string, any> = {
      zucchetti: {
        apuntes: atCurrentYear.length,
        ingresos: Math.round(ingresos * 100) / 100,
        gastos: Math.round(gastos * 100) / 100,
      },
      pagos_directos: {
        count: paymentsCurrentYear.length,
        total: Math.round(ingresosPagosDirectos * 100) / 100,
      },
      expenses_directos: {
        count: expensesCurrentYear.length,
        total: Math.round(gastosExpensesDirectos * 100) / 100,
      },
    };

    return NextResponse.json({
      success: true,
      year,
      building: {
        id: building.id,
        nombre: building.nombre,
        direccion: building.direccion,
        valorInversion: Math.round(valorInversion * 100) / 100,
        valorMercado: Math.round(valorMercado * 100) / 100,
        superficieTotal,
      },
      ocupacion: {
        totalUnits,
        occupiedUnits,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
      },
      rentaContractual: {
        mensual: Math.round(rentaContractualMensual * 100) / 100,
        anual: Math.round(rentaContractualAnual * 100) / 100,
      },
      ingresos: {
        total: Math.round(ingresos * 100) / 100,
        prev: Math.round(ingresosPrev * 100) / 100,
        variacionPct: Math.round(ingresosVarPct * 10) / 10,
        porCategoria: Object.entries(ingresosPorCategoria)
          .map(([k, v]) => ({ categoria: k, importe: Math.round(v * 100) / 100 }))
          .sort((a, b) => b.importe - a.importe),
      },
      gastos: {
        total: Math.round(gastos * 100) / 100,
        prev: Math.round(gastosPrev * 100) / 100,
        variacionPct: Math.round(gastosVarPct * 10) / 10,
        porCategoria: Object.entries(gastosPorCategoria)
          .map(([k, v]) => ({ categoria: k, importe: Math.round(v * 100) / 100 }))
          .sort((a, b) => b.importe - a.importe),
      },
      rentabilidad: {
        noi: Math.round(noi * 100) / 100,
        margenNoiPct: Math.round(margenNoi * 10) / 10,
        yieldBrutoPct: Math.round(yieldBruto * 100) / 100,
        yieldNetoPct: Math.round(yieldNeto * 100) / 100,
      },
      fuentes,
    });
  } catch (error: any) {
    logger.error('[Building rentability] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error' },
      { status: 500 }
    );
  }
}
