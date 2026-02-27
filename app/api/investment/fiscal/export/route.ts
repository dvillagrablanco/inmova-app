import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/investment/fiscal/export?year=2025&type=303|347&quarter=1
 *
 * Genera datos para modelos fiscales:
 * - Modelo 303: IVA trimestral (bases imponibles, cuotas IVA)
 * - Modelo 347: Operaciones con terceros > 3.005,06€ anuales
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const type = searchParams.get('type') || '303';
    const quarter = parseInt(searchParams.get('quarter') || '0');

    if (type === '303') {
      return await generateModelo303(prisma, companyId, year, quarter);
    } else if (type === '347') {
      return await generateModelo347(prisma, companyId, year);
    }

    return NextResponse.json({ error: 'Tipo no soportado (303 o 347)' }, { status: 400 });
  } catch (error: any) {
    logger.error('[Fiscal Export]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error generando export fiscal' }, { status: 500 });
  }
}

/**
 * Modelo 303 - IVA Trimestral
 * Desglose de facturas emitidas (alquileres con IVA) y recibidas (gastos)
 */
async function generateModelo303(prisma: any, companyId: string, year: number, quarter: number) {
  const quarters = quarter > 0 ? [quarter] : [1, 2, 3, 4];
  const results = [];

  for (const q of quarters) {
    const startMonth = (q - 1) * 3;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 3, 0, 23, 59, 59);

    // Facturas emitidas: pagos cobrados en el trimestre (alquileres con IVA)
    const payments = await prisma.payment.findMany({
      where: {
        contract: { unit: { building: { companyId } } },
        estado: 'pagado',
        fechaPago: { gte: startDate, lte: endDate },
      },
      include: {
        contract: {
          include: {
            tenant: { select: { nombreCompleto: true, dni: true } },
            unit: { select: { tipo: true, building: { select: { nombre: true } } } },
          },
        },
      },
    });

    // Solo locales comerciales llevan IVA (21%)
    const facturasEmitidas = payments.map((p: any) => {
      const isComercial = ['local_comercial', 'oficina', 'nave_industrial'].includes(
        p.contract?.unit?.tipo || ''
      );
      const baseImponible = p.monto;
      const tipoIVA = isComercial ? 21 : 0; // Viviendas exentas de IVA
      const cuotaIVA = isComercial ? Math.round(baseImponible * 0.21 * 100) / 100 : 0;

      return {
        fecha: p.fechaPago,
        concepto: `Alquiler ${p.periodo || ''}`,
        inquilino: p.contract?.tenant?.nombreCompleto || '',
        nifInquilino: p.contract?.tenant?.dni || '',
        edificio: p.contract?.unit?.building?.nombre || '',
        tipoUnidad: p.contract?.unit?.tipo || '',
        baseImponible,
        tipoIVA,
        cuotaIVA,
        total: baseImponible + cuotaIVA,
      };
    });

    // Gastos deducibles del trimestre
    const expenses = await prisma.expense.findMany({
      where: {
        companyId,
        fecha: { gte: startDate, lte: endDate },
      },
      include: {
        building: { select: { nombre: true } },
      },
    });

    const facturasRecibidas = expenses.map((e: any) => ({
      fecha: e.fecha,
      concepto: e.concepto || e.categoria,
      proveedor: e.proveedor || 'Sin proveedor',
      nifProveedor: e.nifProveedor || '',
      edificio: e.building?.nombre || '',
      baseImponible: e.importe,
      tipoIVA: e.tipoIva || 21,
      cuotaIVA: e.importeIva || Math.round(e.importe * 0.21 * 100) / 100,
      total: e.importe + (e.importeIva || Math.round(e.importe * 0.21 * 100) / 100),
    }));

    const totalBaseEmitidas = facturasEmitidas.reduce(
      (s: number, f: any) => s + f.baseImponible,
      0
    );
    const totalIVARepercutido = facturasEmitidas.reduce(
      (s: number, f: any) => s + f.cuotaIVA,
      0
    );
    const totalBaseRecibidas = facturasRecibidas.reduce(
      (s: number, f: any) => s + f.baseImponible,
      0
    );
    const totalIVASoportado = facturasRecibidas.reduce(
      (s: number, f: any) => s + f.cuotaIVA,
      0
    );
    const resultadoIVA = totalIVARepercutido - totalIVASoportado;

    results.push({
      trimestre: q,
      periodo: `${q}T ${year}`,
      facturasEmitidas: {
        count: facturasEmitidas.length,
        baseImponible: totalBaseEmitidas,
        ivaRepercutido: totalIVARepercutido,
        detalle: facturasEmitidas,
      },
      facturasRecibidas: {
        count: facturasRecibidas.length,
        baseImponible: totalBaseRecibidas,
        ivaSoportado: totalIVASoportado,
        detalle: facturasRecibidas,
      },
      resultadoIVA,
      aIngresar: resultadoIVA > 0 ? resultadoIVA : 0,
      aCompensar: resultadoIVA < 0 ? Math.abs(resultadoIVA) : 0,
    });
  }

  return NextResponse.json({
    success: true,
    type: 'modelo_303',
    year,
    companyId,
    trimestres: results,
  });
}

/**
 * Modelo 347 - Operaciones con terceros > 3.005,06€
 * Agrupa operaciones anuales por NIF de tercero
 */
async function generateModelo347(prisma: any, companyId: string, year: number) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  // Cobros agrupados por inquilino
  const payments = await prisma.payment.findMany({
    where: {
      contract: { unit: { building: { companyId } } },
      estado: 'pagado',
      fechaPago: { gte: startDate, lte: endDate },
    },
    include: {
      contract: {
        include: {
          tenant: { select: { nombreCompleto: true, dni: true } },
        },
      },
    },
  });

  // Agrupar por NIF/DNI de inquilino
  const byTenant: Record<
    string,
    { nombre: string; nif: string; totalAnual: number; operaciones: number }
  > = {};

  for (const p of payments) {
    const nif = p.contract?.tenant?.dni || 'SIN_NIF';
    const nombre = p.contract?.tenant?.nombreCompleto || 'Sin nombre';
    if (!byTenant[nif]) {
      byTenant[nif] = { nombre, nif, totalAnual: 0, operaciones: 0 };
    }
    byTenant[nif].totalAnual += p.monto;
    byTenant[nif].operaciones++;
  }

  // Gastos agrupados por proveedor
  const expenses = await prisma.expense.findMany({
    where: {
      companyId,
      fecha: { gte: startDate, lte: endDate },
    },
  });

  const byProvider: Record<
    string,
    { nombre: string; nif: string; totalAnual: number; operaciones: number }
  > = {};

  for (const e of expenses) {
    const nif = e.nifProveedor || 'SIN_NIF';
    const nombre = e.proveedor || 'Sin proveedor';
    if (!byProvider[nif]) {
      byProvider[nif] = { nombre, nif, totalAnual: 0, operaciones: 0 };
    }
    byProvider[nif].totalAnual += e.importe;
    byProvider[nif].operaciones++;
  }

  // Filtrar > 3.005,06€
  const UMBRAL_347 = 3005.06;

  const clientesDeclarables = Object.values(byTenant)
    .filter((t) => t.totalAnual > UMBRAL_347)
    .sort((a, b) => b.totalAnual - a.totalAnual);

  const proveedoresDeclarables = Object.values(byProvider)
    .filter((p) => p.totalAnual > UMBRAL_347)
    .sort((a, b) => b.totalAnual - a.totalAnual);

  return NextResponse.json({
    success: true,
    type: 'modelo_347',
    year,
    companyId,
    umbral: UMBRAL_347,
    clientes: {
      total: clientesDeclarables.length,
      importeTotal: clientesDeclarables.reduce((s, c) => s + c.totalAnual, 0),
      detalle: clientesDeclarables,
    },
    proveedores: {
      total: proveedoresDeclarables.length,
      importeTotal: proveedoresDeclarables.reduce((s, p) => s + p.totalAnual, 0),
      detalle: proveedoresDeclarables,
    },
  });
}
