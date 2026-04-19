/**
 * POST /api/accounting/refresh-from-source
 *
 * Sincroniza contabilidad desde Zucchetti SQL Server (fuente de verdad).
 * Lee apuntes operativos (grupos 6+7) y los importa como AccountingTransaction.
 * También regenera CashFlowStatement.
 *
 * Fuentes:
 *   RSQ (Rovida) → CONT_RSQ en server.avannubo.com:33680
 *   VID (Vidaro) → CONT_VID
 *   VIR (Viroda) → DAT_VIR
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveAccountingScope } from '@/lib/accounting-scope';
import {
  isZucchettiSqlConfigured,
  mapInmovaIdToCompanyKey,
  getZucchettiDatabase,
  getZucchettiPool,
  closeAllPools,
  type ZucchettiCompanyKey,
} from '@/lib/zucchetti-sqlserver';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// Clasificador PGC mejorado
function classifySubcuenta(sub: string, titulo: string): { tipo: 'ingreso' | 'gasto'; categoria: string } | null {
  const s = (sub || '').trim();
  const t = (titulo || '').toLowerCase();

  if (s.startsWith('7')) {
    if (s.startsWith('752')) {
      if (t.includes('garaje') || t.includes('plaza')) return { tipo: 'ingreso', categoria: 'ingreso_renta_garaje' };
      if (t.includes('local')) return { tipo: 'ingreso', categoria: 'ingreso_renta_local' };
      if (t.includes('nave')) return { tipo: 'ingreso', categoria: 'ingreso_renta_nave' };
      if (t.includes('oficina')) return { tipo: 'ingreso', categoria: 'ingreso_renta_oficina' };
      if (t.includes('piamonte') || t.includes('edif')) return { tipo: 'ingreso', categoria: 'ingreso_renta_edificio' };
      if (t.includes('silvela')) return { tipo: 'ingreso', categoria: 'ingreso_renta_silvela' };
      if (t.includes('reina')) return { tipo: 'ingreso', categoria: 'ingreso_renta_reina' };
      if (t.includes('pelayo')) return { tipo: 'ingreso', categoria: 'ingreso_renta_pelayo' };
      if (t.includes('tejada')) return { tipo: 'ingreso', categoria: 'ingreso_renta_tejada' };
      if (t.includes('candelaria')) return { tipo: 'ingreso', categoria: 'ingreso_renta_candelaria' };
      if (t.includes('viviend') || t.includes('apto') || t.includes('gemelos')) return { tipo: 'ingreso', categoria: 'ingreso_renta_vivienda' };
      if (t.includes('terreno') || t.includes('finca')) return { tipo: 'ingreso', categoria: 'ingreso_renta_terreno' };
      return { tipo: 'ingreso', categoria: 'ingreso_renta' };
    }
    if (s.startsWith('761')) return { tipo: 'ingreso', categoria: 'ingreso_intereses' };
    if (s.startsWith('766')) return { tipo: 'ingreso', categoria: 'ingreso_beneficio_inversiones' };
    if (s.startsWith('760')) return { tipo: 'ingreso', categoria: 'ingreso_dividendos' };
    if (s.startsWith('771') || s.startsWith('772')) return { tipo: 'ingreso', categoria: 'ingreso_enajenacion_participaciones' };
    if (s.startsWith('768')) return { tipo: 'ingreso', categoria: 'ingreso_diferencias_cambio' };
    if (s.startsWith('740') || s.startsWith('705')) return { tipo: 'ingreso', categoria: 'ingreso_servicios_intragrupo' };
    return { tipo: 'ingreso', categoria: 'ingreso_otro' };
  }

  if (s.startsWith('6')) {
    if (s.startsWith('622')) return { tipo: 'gasto', categoria: 'gasto_reparacion' };
    if (s.startsWith('625')) return { tipo: 'gasto', categoria: 'gasto_seguro' };
    if (s.startsWith('628')) return { tipo: 'gasto', categoria: 'gasto_suministros' };
    if (s.startsWith('631')) return { tipo: 'gasto', categoria: 'gasto_impuesto' };
    if (s.startsWith('630')) return { tipo: 'gasto', categoria: 'gasto_impuesto_sociedades' };
    if (s.startsWith('627')) return { tipo: 'gasto', categoria: 'gasto_comunidad' };
    if (s.startsWith('621')) return { tipo: 'gasto', categoria: 'gasto_arrendamiento' };
    if (s.startsWith('623')) return { tipo: 'gasto', categoria: 'gasto_profesionales' };
    if (s.startsWith('640') || s.startsWith('641')) return { tipo: 'gasto', categoria: 'gasto_personal' };
    if (s.startsWith('662') || s.startsWith('663') || s.startsWith('669') || s.startsWith('626')) return { tipo: 'gasto', categoria: 'gasto_bancario' };
    if (s.startsWith('681') || s.startsWith('682')) return { tipo: 'gasto', categoria: 'gasto_amortizacion' };
    if (s.startsWith('666')) return { tipo: 'gasto', categoria: 'gasto_perdida_inversiones' };
    if (s.startsWith('624')) return { tipo: 'gasto', categoria: 'gasto_vehiculos' };
    // By title
    if (t.includes('consejero') || t.includes('consejera')) return { tipo: 'gasto', categoria: 'gasto_consejeros' };
    if (t.includes('intragrupo') || t.includes('arc')) return { tipo: 'gasto', categoria: 'gasto_intragrupo' };
    if (t.includes('pérdida') && t.includes('partic')) return { tipo: 'gasto', categoria: 'gasto_perdida_inversiones' };
    if (t.includes('comisi') && t.includes('banc')) return { tipo: 'gasto', categoria: 'gasto_bancario' };
    if (t.includes('iva no deducible') || t.includes('prorrata')) return { tipo: 'gasto', categoria: 'gasto_impuesto' };
    if (t.includes('asesor') || t.includes('profes') || t.includes('gestor')) return { tipo: 'gasto', categoria: 'gasto_profesionales' };
    return { tipo: 'gasto', categoria: 'gasto_otro' };
  }

  return null;
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== 'administrador' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 });
    }

    if (!isZucchettiSqlConfigured()) {
      return NextResponse.json({
        error: 'Zucchetti SQL Server no configurado',
        hint: 'Configura ZUCCHETTI_SERVER, ZUCCHETTI_*_USER y ZUCCHETTI_*_PASS',
      }, { status: 503 });
    }

    const scope = await resolveAccountingScope(request, session.user as any);
    if (!scope) {
      return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });
    }

    const companyId = scope.activeCompanyId;
    const companyKey = mapInmovaIdToCompanyKey(companyId);

    if (!companyKey) {
      return NextResponse.json({
        error: 'Esta empresa no tiene conexión Zucchetti configurada',
      }, { status: 404 });
    }

    const database = getZucchettiDatabase(companyKey);
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { nombre: true, zucchettiLastSync: true },
    });

    logger.info(`[Refresh Accounting] ${companyKey} (${company?.nombre}) desde Zucchetti SQL...`);

    // Connect to Zucchetti SQL Server
    const sql = await import('mssql');
    const pool = await getZucchettiPool(companyKey, database);

    // Read accounting entries (groups 6+7) since last sync or 2025-01-01
    const fromDate = company?.zucchettiLastSync
      ? company.zucchettiLastSync.toISOString().split('T')[0]
      : '2025-01-01';

    const result = await pool.request()
      .input('fromDate', sql.default.Date, fromDate)
      .query(`
        SELECT a.Codigo, a.Fecha, a.CodEjercicio, a.Asiento, a.Apunte,
               a.Subcuenta, a.ConceptoTexto, a.Debe, a.Haber,
               a.Factura, a.Documento,
               s.Titulo AS NombreSubcuenta
        FROM Apuntes a
        LEFT JOIN Subcuentas s ON a.Subcuenta = s.Codigo
        WHERE a.Fecha >= @fromDate
          AND (a.Subcuenta LIKE '6%' OR a.Subcuenta LIKE '7%')
        ORDER BY a.Fecha, a.Asiento, a.Apunte
      `);

    let created = 0;
    let skipped = 0;
    let errors = 0;
    let enriched = 0;

    // Pre-cargar buildings del scope completo del grupo para enriquecer
    // las transacciones contables con un buildingId cuando el título de la
    // subcuenta apunta a un edificio físico identificable. Esto es CLAVE
    // para que el módulo de finanzas pueda imputar correctamente a la
    // sociedad propietaria de las units cuando se hagan cruces.
    const allGroupBuildings = await prisma.building.findMany({
      where: {
        OR: [
          { companyId },
          { units: { some: { ownerCompanyId: companyId } } },
        ],
      },
      select: { id: true, nombre: true, direccion: true, companyId: true },
    });
    const normalize = (s: string) =>
      (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const buildingMatchers = allGroupBuildings.map((b) => ({
      id: b.id,
      keys: [b.nombre, b.direccion].filter(Boolean).map(normalize),
    }));
    function findBuildingByTitle(title: string): string | null {
      const norm = normalize(title);
      if (!norm) return null;
      for (const m of buildingMatchers) {
        for (const key of m.keys) {
          // tokens significativos del nombre del edificio
          const tokens = key
            .split(/[\s,.\-]+/)
            .filter((t) => t.length >= 4 && !['calle', 'avda', 'plaza'].includes(t));
          if (tokens.some((tok) => norm.includes(tok))) {
            return m.id;
          }
        }
      }
      return null;
    }

    for (const row of result.recordset) {
      const sub = (row.Subcuenta || '').trim();
      const titulo = (row.NombreSubcuenta || '').trim();
      const classification = classifySubcuenta(sub, titulo);
      if (!classification) { skipped++; continue; }

      const debe = parseFloat(row.Debe || 0) / 100;
      const haber = parseFloat(row.Haber || 0) / 100;
      const monto = Math.abs(debe - haber);
      if (monto < 0.01) { skipped++; continue; }

      const referencia = `ZUC-${companyKey}-${row.CodEjercicio}-${row.Asiento}-${row.Apunte}`;

      try {
        const existing = await prisma.accountingTransaction.findFirst({
          where: { companyId, referencia },
          select: { id: true },
        });
        if (existing) { skipped++; continue; }

        // Intentar enriquecer con buildingId basado en concepto + título
        const conceptoFull = `${row.ConceptoTexto || ''} ${titulo}`.trim();
        const matchedBuildingId = findBuildingByTitle(conceptoFull);
        if (matchedBuildingId) enriched++;

        await prisma.accountingTransaction.create({
          data: {
            companyId,
            tipo: classification.tipo as any,
            categoria: classification.categoria as any,
            concepto: `${row.ConceptoTexto || ''} (${sub} ${titulo})`.substring(0, 500),
            monto,
            fecha: new Date(row.Fecha),
            referencia,
            notas: `Zucchetti ${companyKey}. Ej:${row.CodEjercicio} As:${row.Asiento}/${row.Apunte}`,
            ...(matchedBuildingId && { buildingId: matchedBuildingId }),
          },
        });
        created++;
      } catch (err: any) {
        if (err.code === 'P2002') skipped++;
        else errors++;
      }
    }

    // Update last sync
    await prisma.company.update({
      where: { id: companyId },
      data: { zucchettiLastSync: new Date(), zucchettiSyncErrors: errors },
    });

    // Regenerate CashFlowStatement
    const txns = await prisma.accountingTransaction.findMany({
      where: { companyId, referencia: { startsWith: 'ZUC-' } },
      select: { fecha: true, tipo: true, monto: true, categoria: true },
    });

    const monthlyMap = new Map<string, { ingresos: number; gastos: number; ingRenta: number }>();
    for (const t of txns) {
      const p = t.fecha.toISOString().substring(0, 7);
      if (!monthlyMap.has(p)) monthlyMap.set(p, { ingresos: 0, gastos: 0, ingRenta: 0 });
      const m = monthlyMap.get(p)!;
      if (t.tipo === 'ingreso') { m.ingresos += t.monto; if (t.categoria?.startsWith('ingreso_renta')) m.ingRenta += t.monto; }
      else m.gastos += t.monto;
    }

    for (const [periodo, data] of monthlyMap.entries()) {
      const [year, month] = periodo.split('-').map(Number);
      const existing = await prisma.cashFlowStatement.findFirst({ where: { companyId, periodo } });
      const cfData = {
        ingresosTotales: data.ingresos,
        gastosTotales: data.gastos,
        flujoNeto: data.ingresos - data.gastos,
        ingresosRenta: data.ingRenta,
        saldoInicial: 0,
        saldoFinal: data.ingresos - data.gastos,
      };
      if (existing) {
        await prisma.cashFlowStatement.update({ where: { id: existing.id }, data: cfData });
      } else {
        await prisma.cashFlowStatement.create({
          data: { companyId, periodo, fechaInicio: new Date(year, month - 1, 1), fechaFin: new Date(year, month, 0), ...cfData },
        });
      }
    }

    await closeAllPools();

    const fechas = result.recordset.map((r: any) => new Date(r.Fecha));
    const minFecha = fechas.length > 0 ? new Date(Math.min(...fechas.map((f: Date) => f.getTime()))) : null;
    const maxFecha = fechas.length > 0 ? new Date(Math.max(...fechas.map((f: Date) => f.getTime()))) : null;

    return NextResponse.json({
      success: true,
      company: company?.nombre,
      source: `Zucchetti SQL Server (${companyKey} → ${database})`,
      summary: {
        asientosLeidos: result.recordset.length,
        transaccionesCreadas: created,
        transaccionesEnriquecidasConBuilding: enriched,
        duplicadosSaltados: skipped,
        errores: errors,
        periodoDesde: minFecha?.toISOString().split('T')[0],
        periodoHasta: maxFecha?.toISOString().split('T')[0],
      },
    });
  } catch (error: any) {
    logger.error('[Refresh Accounting] Error:', error);
    await closeAllPools();
    return NextResponse.json({ error: error.message || 'Error refrescando contabilidad' }, { status: 500 });
  }
}
