/**
 * GET /api/accounting/iva
 *
 * Datos del Registro de IVA desde Zucchetti SQL Server.
 * Alimenta la sección fiscal: modelo 303, 347, retenciones.
 *
 * Params:
 *   companyId: string (opcional)
 *   year: number (default: año actual)
 *   quarter: 1|2|3|4 (opcional, default: todos)
 *   type: 'emitidas' | 'recibidas' | 'all' (default: all)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  isZucchettiSqlConfigured,
  mapInmovaIdToCompanyKey,
  getZucchettiDatabase,
  getZucchettiPool,
} from '@/lib/zucchetti-sqlserver';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryCompanyId = searchParams.get('companyId');
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const companyId = queryCompanyId || cookieCompanyId || (session.user as any).companyId;
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);
    const quarter = searchParams.get('quarter') ? parseInt(searchParams.get('quarter')!, 10) : null;
    const type = searchParams.get('type') || 'all';

    const companyKey = mapInmovaIdToCompanyKey(companyId);
    if (!companyKey || !isZucchettiSqlConfigured(companyKey)) {
      return NextResponse.json({ error: 'Zucchetti no configurado para esta empresa' }, { status: 503 });
    }

    const database = getZucchettiDatabase(companyKey);
    const sql = await import('mssql');
    const pool = await getZucchettiPool(companyKey, database);

    // Get ejercicio code for this year
    const ejResult = await pool.request()
      .input('year', sql.default.Int, year)
      .query("SELECT Codigo FROM Ejercicios WHERE YEAR(FechaInicial) = @year");
    
    const ejercicio = ejResult.recordset[0]?.Codigo;
    if (!ejercicio) {
      return NextResponse.json({ 
        success: true, data: [], 
        message: `No hay ejercicio para el año ${year}` 
      });
    }

    // Build date filter for quarter
    let dateFilter = '';
    if (quarter) {
      const startMonth = (quarter - 1) * 3 + 1;
      const endMonth = quarter * 3;
      dateFilter = ` AND MONTH(factura_fecha) >= ${startMonth} AND MONTH(factura_fecha) <= ${endMonth}`;
    }

    // Type filter
    let typeFilter = '';
    if (type === 'emitidas') typeFilter = " AND compras_ventas = 'V'";
    else if (type === 'recibidas') typeFilter = " AND compras_ventas = 'C'";

    // Get IVA records
    const ivaResult = await pool.request().query(`
      SELECT 
        compras_ventas,
        factura_numero,
        factura_fecha,
        tercero_nif,
        tercero_nombre,
        factura_base / 100.0 as base,
        factura_cuota / 100.0 as cuota,
        factura_total / 100.0 as total,
        impuesto_porcentaje,
        retencion_porcentaje,
        retencion_importe / 100.0 as retencion,
        tipo_operacion,
        criterio_de_caja
      FROM Registro_IVA_IGIC
      WHERE codigo_ejercicio = ${ejercicio}
        ${dateFilter}
        ${typeFilter}
      ORDER BY factura_fecha DESC
    `);

    // Aggregate summary
    const summary = {
      year,
      quarter,
      ejercicio,
      totalFacturas: ivaResult.recordset.length,
      emitidas: { count: 0, base: 0, cuota: 0, total: 0 },
      recibidas: { count: 0, base: 0, cuota: 0, total: 0, retencion: 0 },
    };

    for (const r of ivaResult.recordset) {
      if (r.compras_ventas === 'V') {
        summary.emitidas.count++;
        summary.emitidas.base += r.base || 0;
        summary.emitidas.cuota += r.cuota || 0;
        summary.emitidas.total += r.total || 0;
      } else {
        summary.recibidas.count++;
        summary.recibidas.base += r.base || 0;
        summary.recibidas.cuota += r.cuota || 0;
        summary.recibidas.total += r.total || 0;
        summary.recibidas.retencion += r.retencion || 0;
      }
    }

    // Modelo 303 approximation
    const modelo303 = {
      ivaRepercutido: summary.emitidas.cuota,
      ivaSoportado: summary.recibidas.cuota,
      resultado: summary.emitidas.cuota - summary.recibidas.cuota,
      aIngresar: Math.max(0, summary.emitidas.cuota - summary.recibidas.cuota),
      aCompensar: Math.max(0, summary.recibidas.cuota - summary.emitidas.cuota),
    };

    return NextResponse.json({
      success: true,
      companyKey,
      summary,
      modelo303,
      facturas: ivaResult.recordset.map((r: any) => ({
        tipo: r.compras_ventas === 'V' ? 'emitida' : 'recibida',
        numero: (r.factura_numero || '').trim(),
        fecha: r.factura_fecha,
        terceroNif: (r.tercero_nif || '').trim(),
        terceroNombre: (r.tercero_nombre || '').trim(),
        base: r.base,
        cuota: r.cuota,
        total: r.total,
        tipoIva: r.impuesto_porcentaje,
        retencion: r.retencion,
        retencionPct: r.retencion_porcentaje,
        tipoOperacion: r.tipo_operacion,
        criterioCaja: r.criterio_de_caja,
      })),
    });
  } catch (error: any) {
    logger.error('[Accounting IVA]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
