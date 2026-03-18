/**
 * GET /api/accounting/enrichment
 *
 * Proporciona datos de enriquecimiento contable desde Zucchetti para:
 * - NOI por edificio (ingresos - gastos operativos)
 * - Morosidad por inquilino (facturado vs cobrado)
 * - Volúmenes por proveedor
 * - Fianzas contables
 * - Inversiones por fondo (Vidaro)
 *
 * Params:
 *   type: 'noi' | 'morosidad' | 'proveedores' | 'fianzas' | 'inversiones' | 'resumen'
 *   companyId: string (opcional, usa sesión)
 *
 * Requiere sesión autenticada.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  isZucchettiSqlConfigured,
  mapInmovaIdToCompanyKey,
  getZucchettiDatabase,
  getZucchettiPool,
  closeAllPools,
} from '@/lib/zucchetti-sqlserver';
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'resumen';
    const queryCompanyId = searchParams.get('companyId');
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const companyId = queryCompanyId || cookieCompanyId || (session.user as any).companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'No company' }, { status: 400 });
    }

    const companyKey = mapInmovaIdToCompanyKey(companyId);
    if (!companyKey || !isZucchettiSqlConfigured(companyKey)) {
      // Fallback: use local data from AccountingTransaction
      return getFromLocalData(type, companyId);
    }

    const database = getZucchettiDatabase(companyKey);
    const sql = await import('mssql');
    const pool = await getZucchettiPool(companyKey, database);

    let result: any;

    switch (type) {
      case 'noi': {
        // NOI por inmueble: ingresos arrend (752x) - gastos operativos por prop
        const ingresos = await pool.request().query(`
          SELECT a.Subcuenta, s.Titulo,
            SUM(ISNULL(a.Haber,0))/100.0 as ingreso,
            COUNT(DISTINCT MONTH(a.Fecha)) as meses
          FROM Apuntes a LEFT JOIN Subcuentas s ON a.Subcuenta = s.Codigo
          WHERE a.Subcuenta LIKE '752%' AND a.Fecha >= '2025-01-01'
          GROUP BY a.Subcuenta, s.Titulo ORDER BY SUM(ISNULL(a.Haber,0)) DESC
        `);

        const gastos = await pool.request().query(`
          SELECT a.Subcuenta, s.Titulo,
            SUM(ISNULL(a.Debe,0))/100.0 as gasto,
            CASE WHEN a.Subcuenta LIKE '631%' THEN 'IBI'
                 WHEN a.Subcuenta LIKE '625%' THEN 'Seguros'
                 WHEN a.Subcuenta LIKE '628%' THEN 'Suministros'
                 WHEN a.Subcuenta LIKE '622%' THEN 'Reparaciones'
                 WHEN a.Subcuenta LIKE '681%' THEN 'Amortización'
                 ELSE 'Otros' END as tipo
          FROM Apuntes a LEFT JOIN Subcuentas s ON a.Subcuenta = s.Codigo
          WHERE a.Subcuenta LIKE '6%' AND a.Fecha >= '2025-01-01'
            AND (s.Titulo LIKE '%Piamonte%' OR s.Titulo LIKE '%Espronceda%' 
                 OR s.Titulo LIKE '%Barquillo%' OR s.Titulo LIKE '%Reina%'
                 OR s.Titulo LIKE '%Silvela%' OR s.Titulo LIKE '%Europa%'
                 OR s.Titulo LIKE '%Constitución%' OR s.Titulo LIKE '%Cuba%'
                 OR s.Titulo LIKE '%Prado%' OR s.Titulo LIKE '%Gemelos%'
                 OR s.Titulo LIKE '%Tomillar%' OR s.Titulo LIKE '%Candelaria%'
                 OR s.Titulo LIKE '%Tejada%' OR s.Titulo LIKE '%Pelayo%'
                 OR s.Titulo LIKE '%Metal%' OR s.Titulo LIKE '%Grijota%'
                 OR s.Titulo LIKE '%Marbella%' OR s.Titulo LIKE '%Camilo%')
          GROUP BY a.Subcuenta, s.Titulo,
            CASE WHEN a.Subcuenta LIKE '631%' THEN 'IBI'
                 WHEN a.Subcuenta LIKE '625%' THEN 'Seguros'
                 WHEN a.Subcuenta LIKE '628%' THEN 'Suministros'
                 WHEN a.Subcuenta LIKE '622%' THEN 'Reparaciones'
                 WHEN a.Subcuenta LIKE '681%' THEN 'Amortización'
                 ELSE 'Otros' END
          ORDER BY SUM(ISNULL(a.Debe,0)) DESC
        `);

        result = {
          ingresos: ingresos.recordset.map((r: any) => ({
            subcuenta: (r.Subcuenta || '').trim(),
            inmueble: (r.Titulo || '').trim(),
            ingresoAnual: r.ingreso,
            mesesActivos: r.meses,
          })),
          gastos: gastos.recordset.map((r: any) => ({
            subcuenta: (r.Subcuenta || '').trim(),
            inmueble: (r.Titulo || '').trim(),
            gastoAnual: r.gasto,
            tipoGasto: r.tipo,
          })),
        };
        break;
      }

      case 'morosidad': {
        const deuda = await pool.request().query(`
          SELECT a.Subcuenta, s.Titulo, t.Nombre, t.Nif,
            SUM(ISNULL(a.Debe,0))/100.0 as facturado,
            SUM(ISNULL(a.Haber,0))/100.0 as cobrado,
            SUM(ISNULL(a.Debe,0) - ISNULL(a.Haber,0))/100.0 as saldo,
            MAX(a.Fecha) as ultimoMov
          FROM Apuntes a
          LEFT JOIN Subcuentas s ON a.Subcuenta = s.Codigo
          LEFT JOIN Terceros t ON s.CodigoTercero = t.Codigo
          WHERE a.Subcuenta LIKE '43%' AND a.Fecha >= '2024-01-01'
          GROUP BY a.Subcuenta, s.Titulo, t.Nombre, t.Nif
          HAVING ABS(SUM(ISNULL(a.Debe,0) - ISNULL(a.Haber,0))) > 100
          ORDER BY SUM(ISNULL(a.Debe,0) - ISNULL(a.Haber,0)) DESC
        `);

        result = deuda.recordset.map((r: any) => ({
          subcuenta: (r.Subcuenta || '').trim(),
          nombre: (r.Nombre || r.Titulo || '').trim(),
          nif: (r.Nif || '').trim(),
          facturado: r.facturado,
          cobrado: r.cobrado,
          saldo: r.saldo,
          ultimoMovimiento: r.ultimoMov,
        }));
        break;
      }

      case 'proveedores': {
        const prov = await pool.request().query(`
          SELECT a.Subcuenta, s.Titulo, t.Nombre, t.Nif,
            SUM(ISNULL(a.Haber,0))/100.0 as facturado,
            SUM(ISNULL(a.Debe,0))/100.0 as pagado,
            SUM(ISNULL(a.Haber,0) - ISNULL(a.Debe,0))/100.0 as saldoPendiente,
            COUNT(*) as apuntes
          FROM Apuntes a
          LEFT JOIN Subcuentas s ON a.Subcuenta = s.Codigo
          LEFT JOIN Terceros t ON s.CodigoTercero = t.Codigo
          WHERE a.Subcuenta LIKE '41%' AND a.Fecha >= '2025-01-01'
          GROUP BY a.Subcuenta, s.Titulo, t.Nombre, t.Nif
          HAVING SUM(ISNULL(a.Haber,0)) > 0
          ORDER BY SUM(ISNULL(a.Haber,0)) DESC
        `);

        result = prov.recordset.map((r: any) => ({
          subcuenta: (r.Subcuenta || '').trim(),
          nombre: (r.Nombre || r.Titulo || '').trim(),
          nif: (r.Nif || '').trim(),
          facturado: r.facturado,
          pagado: r.pagado,
          saldoPendiente: r.saldoPendiente,
          apuntes: r.apuntes,
        }));
        break;
      }

      case 'fianzas': {
        const fianzas = await pool.request().query(`
          SELECT a.Subcuenta, s.Titulo,
            SUM(ISNULL(a.Debe,0))/100.0 as constituidas,
            SUM(ISNULL(a.Haber,0))/100.0 as devueltas,
            SUM(ISNULL(a.Haber,0) - ISNULL(a.Debe,0))/100.0 as saldoVivo
          FROM Apuntes a LEFT JOIN Subcuentas s ON a.Subcuenta = s.Codigo
          WHERE (a.Subcuenta LIKE '560%' OR s.Titulo LIKE '%fianza%' OR s.Titulo LIKE '%Fianza%')
          GROUP BY a.Subcuenta, s.Titulo
          HAVING ABS(SUM(ISNULL(a.Debe,0) - ISNULL(a.Haber,0))) > 10
          ORDER BY ABS(SUM(ISNULL(a.Haber,0) - ISNULL(a.Debe,0))) DESC
        `);

        result = fianzas.recordset.map((r: any) => ({
          subcuenta: (r.Subcuenta || '').trim(),
          descripcion: (r.Titulo || '').trim(),
          constituidas: r.constituidas,
          devueltas: r.devueltas,
          saldoVivo: r.saldoVivo,
        }));
        break;
      }

      case 'inversiones': {
        const inv = await pool.request().query(`
          SELECT a.Subcuenta, s.Titulo,
            SUM(ISNULL(a.Debe,0))/100.0 as compras,
            SUM(ISNULL(a.Haber,0))/100.0 as ventas,
            COUNT(*) as operaciones
          FROM Apuntes a LEFT JOIN Subcuentas s ON a.Subcuenta = s.Codigo
          WHERE (a.Subcuenta LIKE '25%' OR a.Subcuenta LIKE '54%' OR a.Subcuenta LIKE '766%' OR a.Subcuenta LIKE '666%')
            AND a.Fecha >= '2025-01-01'
          GROUP BY a.Subcuenta, s.Titulo
          HAVING SUM(ISNULL(a.Debe,0)) + SUM(ISNULL(a.Haber,0)) > 0
          ORDER BY SUM(ISNULL(a.Debe,0)) + SUM(ISNULL(a.Haber,0)) DESC
        `);

        result = inv.recordset.map((r: any) => ({
          subcuenta: (r.Subcuenta || '').trim(),
          descripcion: (r.Titulo || '').trim(),
          compras: r.compras,
          ventas: r.ventas,
          operaciones: r.operaciones,
        }));
        break;
      }

      case 'resumen':
      default: {
        // Summary of all enrichment data
        const [morosidadCount, provCount, fianzaCount] = await Promise.all([
          pool.request().query("SELECT COUNT(DISTINCT Subcuenta) as cnt FROM Apuntes WHERE Subcuenta LIKE '43%' AND Fecha >= '2025-01-01'"),
          pool.request().query("SELECT COUNT(DISTINCT Subcuenta) as cnt FROM Apuntes WHERE Subcuenta LIKE '41%' AND Fecha >= '2025-01-01'"),
          pool.request().query("SELECT COUNT(DISTINCT Subcuenta) as cnt FROM Apuntes a INNER JOIN Subcuentas s ON a.Subcuenta = s.Codigo WHERE s.Titulo LIKE '%ianza%'"),
        ]);

        result = {
          company: companyKey,
          database,
          clientes: morosidadCount.recordset[0]?.cnt || 0,
          proveedores: provCount.recordset[0]?.cnt || 0,
          fianzas: fianzaCount.recordset[0]?.cnt || 0,
          tiposDisponibles: ['noi', 'morosidad', 'proveedores', 'fianzas', 'inversiones'],
        };
        break;
      }
    }

    return NextResponse.json({ success: true, type, companyKey, data: result });
  } catch (error: any) {
    logger.error('[Accounting Enrichment]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Fallback when Zucchetti SQL is not available — use local AccountingTransaction data
async function getFromLocalData(type: string, companyId: string) {
  const prisma = await getPrisma();

  switch (type) {
    case 'morosidad': {
      // Get from accounting transactions
      const deudas = await prisma.accountingTransaction.findMany({
        where: { companyId, categoria: { in: ['ingreso_renta', 'ingreso_renta_local', 'ingreso_renta_garaje', 'ingreso_renta_edificio', 'ingreso_renta_vivienda'] as any[] } },
        select: { concepto: true, monto: true, fecha: true },
        orderBy: { monto: 'desc' },
        take: 50,
      });
      return NextResponse.json({ success: true, type, data: deudas, source: 'local' });
    }
    default:
      return NextResponse.json({
        success: true, type, data: null,
        message: 'Zucchetti SQL no disponible para esta empresa. Datos limitados.',
        source: 'local',
      });
  }
}
