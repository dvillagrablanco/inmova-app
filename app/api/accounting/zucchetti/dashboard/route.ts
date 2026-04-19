/**
 * GET /api/accounting/zucchetti/dashboard
 *
 * Devuelve el estado consolidado de los datos Zucchetti para el grupo del
 * usuario:
 *  - Snapshots de última sincronización por sociedad
 *  - Conteo de transacciones por sociedad
 *  - IVA del año en curso (modelo 303 acumulado por trimestre)
 *  - Top morosos / proveedores
 *  - Sumas y saldos resumidos
 *  - Tesorería (saldo cuenta 57x)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveAccountingScope } from '@/lib/accounting-scope';
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
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const scope = await resolveAccountingScope(request, session.user as any);
    if (!scope) {
      return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });
    }

    const prisma = await getPrisma();
    const companyIds = scope.companyIds;
    const currentYear = new Date().getFullYear();

    const [
      companies,
      snapshots,
      txCountBySociety,
      ivaCurrentYear,
      tercerosCounts,
      treasuryBalance,
      topProveedores,
    ] = await Promise.all([
      prisma.company.findMany({
        where: { id: { in: companyIds } },
        select: { id: true, nombre: true, zucchettiEnabled: true, zucchettiLastSync: true },
      }),
      prisma.zucchettiSyncSnapshot.findMany({
        where: { companyId: { in: companyIds } },
      }),
      prisma.accountingTransaction.groupBy({
        by: ['companyId', 'tipo'],
        where: { companyId: { in: companyIds }, referencia: { startsWith: 'ZUC-' } },
        _sum: { monto: true },
        _count: true,
      }),
      prisma.zucchettiIvaRecord.findMany({
        where: {
          companyId: { in: companyIds },
          facturaFecha: { gte: new Date(currentYear, 0, 1), lt: new Date(currentYear + 1, 0, 1) },
        },
        select: {
          companyId: true,
          comprasVentas: true,
          facturaFecha: true,
          base: true,
          cuota: true,
        },
      }),
      prisma.zucchettiTercero.groupBy({
        by: ['companyId', 'tipo'],
        where: { companyId: { in: companyIds } },
        _count: true,
      }),
      prisma.zucchettiTreasuryEntry.groupBy({
        by: ['companyId', 'subcuenta'],
        where: { companyId: { in: companyIds } },
        _sum: { importe: true },
        _count: true,
      }),
      prisma.zucchettiIvaRecord.groupBy({
        by: ['companyId', 'terceroNombre', 'terceroNif'],
        where: {
          companyId: { in: companyIds },
          comprasVentas: 'C',
          facturaFecha: { gte: new Date(currentYear, 0, 1) },
        },
        _sum: { total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 10,
      }),
    ]);

    // IVA por trimestre y empresa
    const ivaPorTrimestre: Record<string, Record<string, { ivaRepercutido: number; ivaSoportado: number; baseV: number; baseC: number }>> = {};
    for (const r of ivaCurrentYear) {
      const trimestre = `T${Math.floor(r.facturaFecha.getMonth() / 3) + 1}`;
      ivaPorTrimestre[r.companyId] ??= {};
      ivaPorTrimestre[r.companyId][trimestre] ??= { ivaRepercutido: 0, ivaSoportado: 0, baseV: 0, baseC: 0 };
      const bucket = ivaPorTrimestre[r.companyId][trimestre];
      if (r.comprasVentas === 'V') {
        bucket.ivaRepercutido += r.cuota;
        bucket.baseV += r.base;
      } else {
        bucket.ivaSoportado += r.cuota;
        bucket.baseC += r.base;
      }
    }

    // Mapear companies enriched
    const companyMap = Object.fromEntries(companies.map((c) => [c.id, c]));

    return NextResponse.json({
      success: true,
      currentYear,
      companies: companies.map((c) => {
        const snapshot = snapshots.find((s) => s.companyId === c.id);
        const ivaTrimestres = ivaPorTrimestre[c.id] || {};
        const ingresos = txCountBySociety
          .filter((t: any) => t.companyId === c.id && t.tipo === 'ingreso')
          .reduce((s: number, t: any) => s + (t._sum.monto || 0), 0);
        const gastos = txCountBySociety
          .filter((t: any) => t.companyId === c.id && t.tipo === 'gasto')
          .reduce((s: number, t: any) => s + (t._sum.monto || 0), 0);
        const ingresosCount = txCountBySociety
          .filter((t: any) => t.companyId === c.id && t.tipo === 'ingreso')
          .reduce((s: number, t: any) => s + (t._count || 0), 0);
        const gastosCount = txCountBySociety
          .filter((t: any) => t.companyId === c.id && t.tipo === 'gasto')
          .reduce((s: number, t: any) => s + (t._count || 0), 0);
        const treasury = treasuryBalance
          .filter((t: any) => t.companyId === c.id)
          .map((t: any) => ({
            subcuenta: t.subcuenta,
            saldo: Math.round((t._sum.importe || 0) * 100) / 100,
            movimientos: t._count,
          }));
        const tercerosByTipo = tercerosCounts
          .filter((t: any) => t.companyId === c.id)
          .reduce((acc: any, t: any) => {
            acc[t.tipo || 'otro'] = t._count;
            return acc;
          }, {});

        return {
          id: c.id,
          nombre: c.nombre,
          zucchettiEnabled: c.zucchettiEnabled,
          zucchettiLastSync: c.zucchettiLastSync,
          snapshot: snapshot
            ? {
                ultimaSync: snapshot.ultimaSync,
                duracionMs: snapshot.durationMs,
                apuntes: snapshot.apuntesUltimoCount,
                iva: snapshot.ivaUltimoCount,
                terceros: snapshot.tercerosCount,
                balances: snapshot.balancesCount,
                treasury: snapshot.treasuryCount,
                errores: snapshot.errores,
                ultimoError: snapshot.ultimoError,
              }
            : null,
          contabilidad: {
            ingresosAnual: Math.round(ingresos * 100) / 100,
            gastosAnual: Math.round(gastos * 100) / 100,
            beneficio: Math.round((ingresos - gastos) * 100) / 100,
            transaccionesIngreso: ingresosCount,
            transaccionesGasto: gastosCount,
          },
          iva: {
            trimestres: ivaTrimestres,
            anualRepercutido: Object.values(ivaTrimestres).reduce(
              (s, t: any) => s + t.ivaRepercutido,
              0
            ),
            anualSoportado: Object.values(ivaTrimestres).reduce(
              (s, t: any) => s + t.ivaSoportado,
              0
            ),
            modelo303Total: Object.values(ivaTrimestres).reduce(
              (s, t: any) => s + (t.ivaRepercutido - t.ivaSoportado),
              0
            ),
          },
          tesoreria: treasury,
          terceros: tercerosByTipo,
        };
      }),
      topProveedores: topProveedores.map((p: any) => ({
        empresa: companyMap[p.companyId]?.nombre,
        nombre: p.terceroNombre,
        nif: p.terceroNif,
        totalFacturado: Math.round((p._sum.total || 0) * 100) / 100,
      })),
    });
  } catch (error: any) {
    logger.error('[Zucchetti dashboard] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error' },
      { status: 500 }
    );
  }
}
