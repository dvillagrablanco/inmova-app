/**
 * Servicio unificado de sincronización completa Zucchetti SQL Server → Inmova.
 *
 * Sincroniza en una sola operación:
 *  1. Apuntes 6/7 (ingresos/gastos) → AccountingTransaction (con campos
 *     enriquecidos: subcuenta, contrapartida, centroCoste, fechaValor,
 *     vencimiento, factura, documento, asiento, ejercicio, apunte,
 *     terceroNif, terceroNombre).
 *  2. Tesorería (cuenta 57x) → ZucchettiTreasuryEntry.
 *  3. Registro IVA → ZucchettiIvaRecord.
 *  4. Terceros (clientes/proveedores) → ZucchettiTercero.
 *  5. Sumas y saldos por subcuenta y mes → ZucchettiBalance.
 *  6. Snapshot → ZucchettiSyncSnapshot.
 *
 * Idempotente: usa upsert con clave única por sociedad+ejercicio+asiento+apunte.
 * Escala consistente: TODOS los importes en euros (Debe/Haber / 100).
 * Referencia consistente: ZUC-{key}-{ejercicio}-{asiento}-{apunte}.
 */
import {
  isZucchettiSqlConfigured,
  mapInmovaIdToCompanyKey,
  getZucchettiDatabase,
  getZucchettiPool,
  closeAllPools,
  type ZucchettiCompanyKey,
} from '@/lib/zucchetti-sqlserver';
import logger from '@/lib/logger';

export interface FullSyncOptions {
  companyId: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface FullSyncResult {
  success: boolean;
  companyId: string;
  companyKey: ZucchettiCompanyKey;
  durationMs: number;
  apuntes: { read: number; created: number; updated: number; skipped: number; errors: number };
  treasury: { read: number; created: number; updated: number; errors: number };
  iva: { read: number; created: number; updated: number; errors: number };
  terceros: { read: number; created: number; updated: number; errors: number };
  balances: { computed: number; persisted: number };
  fromDate: string;
  toDate: string;
  error?: string;
}

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// Clasificador PGC (compartido con refresh-from-source)
function classifySubcuenta(
  sub: string,
  titulo: string
): { tipo: 'ingreso' | 'gasto'; categoria: string } | null {
  const s = (sub || '').trim();
  const t = (titulo || '').toLowerCase();

  if (s.startsWith('7')) {
    if (s.startsWith('752')) {
      if (t.includes('garaje') || t.includes('plaza')) return { tipo: 'ingreso', categoria: 'ingreso_renta_garaje' };
      if (t.includes('local')) return { tipo: 'ingreso', categoria: 'ingreso_renta_local' };
      if (t.includes('nave')) return { tipo: 'ingreso', categoria: 'ingreso_renta_nave' };
      if (t.includes('oficina')) return { tipo: 'ingreso', categoria: 'ingreso_renta_oficina' };
      if (t.includes('viviend') || t.includes('apto') || t.includes('gemelos')) return { tipo: 'ingreso', categoria: 'ingreso_renta_vivienda' };
      return { tipo: 'ingreso', categoria: 'ingreso_renta' };
    }
    if (s.startsWith('761')) return { tipo: 'ingreso', categoria: 'ingreso_intereses' };
    if (s.startsWith('766')) return { tipo: 'ingreso', categoria: 'ingreso_beneficio_inversiones' };
    if (s.startsWith('760')) return { tipo: 'ingreso', categoria: 'ingreso_dividendos' };
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
    return { tipo: 'gasto', categoria: 'gasto_otro' };
  }

  return null;
}

// Building matcher para enriquecer con buildingId
function normalizeForMatch(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

interface BuildingMatcher {
  id: string;
  tokens: string[];
}

function buildBuildingMatchers(
  buildings: Array<{ id: string; nombre: string; direccion: string }>
): BuildingMatcher[] {
  return buildings.map((b) => {
    const text = normalizeForMatch(`${b.nombre} ${b.direccion}`);
    const tokens = text
      .split(/[\s,.\-]+/)
      .filter((t) => t.length >= 4 && !['calle', 'avda', 'plaza', 'paseo'].includes(t));
    return { id: b.id, tokens };
  });
}

function findBuildingByText(text: string, matchers: BuildingMatcher[]): string | null {
  const norm = normalizeForMatch(text);
  if (!norm) return null;
  for (const m of matchers) {
    if (m.tokens.some((tok) => norm.includes(tok))) return m.id;
  }
  return null;
}

export async function syncZucchettiFull(options: FullSyncOptions): Promise<FullSyncResult> {
  const startedAt = Date.now();
  const { companyId } = options;

  const result: FullSyncResult = {
    success: false,
    companyId,
    companyKey: 'RSQ',
    durationMs: 0,
    apuntes: { read: 0, created: 0, updated: 0, skipped: 0, errors: 0 },
    treasury: { read: 0, created: 0, updated: 0, errors: 0 },
    iva: { read: 0, created: 0, updated: 0, errors: 0 },
    terceros: { read: 0, created: 0, updated: 0, errors: 0 },
    balances: { computed: 0, persisted: 0 },
    fromDate: '',
    toDate: '',
  };

  if (!isZucchettiSqlConfigured()) {
    result.error = 'Zucchetti SQL Server no configurado';
    return result;
  }

  const companyKey = mapInmovaIdToCompanyKey(companyId);
  if (!companyKey) {
    result.error = `Sociedad ${companyId} sin mapping Zucchetti`;
    return result;
  }
  result.companyKey = companyKey;

  const prisma = await getPrisma();
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { nombre: true, zucchettiLastSync: true },
  });

  // Rango por defecto: desde último sync menos 30 días (overlap), o 2024-01-01
  const toDate = options.toDate || new Date();
  const fromDate =
    options.fromDate ||
    (company?.zucchettiLastSync
      ? new Date(company.zucchettiLastSync.getTime() - 30 * 86400_000)
      : new Date('2024-01-01'));
  result.fromDate = fromDate.toISOString().split('T')[0];
  result.toDate = toDate.toISOString().split('T')[0];

  logger.info(
    `[Zucchetti FullSync] Inicio sociedad=${company?.nombre} key=${companyKey} from=${result.fromDate} to=${result.toDate}`
  );

  const sql = await import('mssql');
  const database = getZucchettiDatabase(companyKey);
  const pool = await getZucchettiPool(companyKey, database);

  // Pre-cargar buildings del scope para enriquecer
  const buildings = await prisma.building.findMany({
    where: {
      OR: [
        { companyId },
        { units: { some: { ownerCompanyId: companyId } } },
      ],
    },
    select: { id: true, nombre: true, direccion: true },
  });
  const matchers = buildBuildingMatchers(buildings.map((b) => ({
    id: b.id,
    nombre: b.nombre || '',
    direccion: b.direccion || '',
  })));

  try {
    // ============ 1. APUNTES (incluye 6/7 + 57 + tercero info) ============
    const apuntesResult = await pool
      .request()
      .input('fromDate', sql.default.Date, result.fromDate)
      .input('toDate', sql.default.Date, result.toDate)
      .query(`
        SELECT a.Codigo, a.Fecha, a.CodEjercicio, a.Asiento, a.Apunte,
               a.Subcuenta, a.Contrapartida, a.ConceptoTexto,
               a.Debe, a.Haber, a.Documento, a.Factura, a.Referencia,
               a.CentroDeCoste, a.FechaValor, a.Vencimiento,
               s.Titulo AS NombreSubcuenta,
               s.CodigoTercero,
               t.Nombre AS NombreTercero, t.Nif AS NifTercero
        FROM Apuntes a
        LEFT JOIN Subcuentas s ON a.Subcuenta = s.Codigo
        LEFT JOIN Terceros t ON s.CodigoTercero = t.Codigo
        WHERE a.Fecha >= @fromDate AND a.Fecha <= @toDate
          AND (a.Subcuenta LIKE '6%' OR a.Subcuenta LIKE '7%' OR a.Subcuenta LIKE '57%')
        ORDER BY a.Fecha, a.Asiento, a.Apunte
      `);
    result.apuntes.read = apuntesResult.recordset.length;

    for (const row of apuntesResult.recordset) {
      const sub = (row.Subcuenta || '').trim();
      const titulo = (row.NombreSubcuenta || '').trim();
      const debe = parseFloat(row.Debe || 0) / 100;
      const haber = parseFloat(row.Haber || 0) / 100;
      const monto = Math.abs(debe - haber);
      if (monto < 0.01) {
        result.apuntes.skipped++;
        continue;
      }

      const referencia = `ZUC-${companyKey}-${row.CodEjercicio}-${row.Asiento}-${row.Apunte}`;
      const conceptoFull = `${row.ConceptoTexto || ''} ${titulo}`.trim();
      const matchedBuildingId = findBuildingByText(conceptoFull, matchers);

      // Bifurcación: cuenta 57 va a tesorería; 6/7 va a AccountingTransaction
      if (sub.startsWith('57')) {
        try {
          await prisma.zucchettiTreasuryEntry.upsert({
            where: {
              companyId_ejercicio_asiento_apunte: {
                companyId,
                ejercicio: parseInt(String(row.CodEjercicio || 0), 10),
                asiento: String(row.Asiento || ''),
                apunte: String(row.Apunte || ''),
              },
            },
            create: {
              companyId,
              subcuenta: sub,
              fecha: new Date(row.Fecha),
              fechaValor: row.FechaValor ? new Date(row.FechaValor) : null,
              concepto: `${row.ConceptoTexto || ''} (${sub} ${titulo})`.substring(0, 500),
              importe: haber - debe, // positivo = ingreso
              contrapartida: row.Contrapartida || null,
              documento: row.Documento || null,
              factura: row.Factura || null,
              asiento: String(row.Asiento || ''),
              ejercicio: parseInt(String(row.CodEjercicio || 0), 10),
              apunte: String(row.Apunte || ''),
            },
            update: {
              subcuenta: sub,
              fecha: new Date(row.Fecha),
              fechaValor: row.FechaValor ? new Date(row.FechaValor) : null,
              concepto: `${row.ConceptoTexto || ''} (${sub} ${titulo})`.substring(0, 500),
              importe: haber - debe,
              contrapartida: row.Contrapartida || null,
              documento: row.Documento || null,
              factura: row.Factura || null,
              ultimaSync: new Date(),
            },
          });
          result.treasury.created++;
        } catch (err: any) {
          result.treasury.errors++;
          logger.warn(`[FullSync] Treasury error: ${err.message}`);
        }
        continue;
      }

      // 6/7: AccountingTransaction
      const classification = classifySubcuenta(sub, titulo);
      if (!classification) {
        result.apuntes.skipped++;
        continue;
      }

      try {
        const existing = await prisma.accountingTransaction.findFirst({
          where: { companyId, referencia },
          select: { id: true },
        });

        const data = {
          companyId,
          tipo: classification.tipo as any,
          categoria: classification.categoria as any,
          concepto: `${row.ConceptoTexto || ''} (${sub} ${titulo})`.substring(0, 500),
          monto,
          fecha: new Date(row.Fecha),
          referencia,
          notas: `Zucchetti ${companyKey}. Ej:${row.CodEjercicio} As:${row.Asiento}/${row.Apunte}`,
          subcuenta: sub,
          contrapartida: row.Contrapartida || null,
          centroCoste: row.CentroDeCoste || null,
          fechaValor: row.FechaValor ? new Date(row.FechaValor) : null,
          vencimiento: row.Vencimiento ? new Date(row.Vencimiento) : null,
          factura: row.Factura || null,
          documento: row.Documento || null,
          asiento: String(row.Asiento || ''),
          ejercicio: parseInt(String(row.CodEjercicio || 0), 10),
          apunte: String(row.Apunte || ''),
          terceroNif: row.NifTercero || null,
          terceroNombre: row.NombreTercero || null,
          ...(matchedBuildingId && { buildingId: matchedBuildingId }),
        };

        if (existing) {
          await prisma.accountingTransaction.update({ where: { id: existing.id }, data });
          result.apuntes.updated++;
        } else {
          await prisma.accountingTransaction.create({ data });
          result.apuntes.created++;
        }
      } catch (err: any) {
        result.apuntes.errors++;
        logger.warn(`[FullSync] Apuntes error: ${err.message}`);
      }
    }

    // ============ 2. TERCEROS ============
    try {
      const tercerosResult = await pool.request().query(`
        SELECT Codigo, Nombre, Nif, Direccion, Telefono, Email
        FROM Terceros
      `);
      result.terceros.read = tercerosResult.recordset.length;

      for (const t of tercerosResult.recordset) {
        const codigo = String(t.Codigo || '').trim();
        if (!codigo) continue;
        // Determinar tipo por subcuenta asociada (heurística por código)
        // Códigos suelen ser 4xxxx (cliente) o 41xxx (proveedor)
        let tipo: 'cliente' | 'proveedor' | 'otro' = 'otro';
        if (codigo.startsWith('43') || codigo.startsWith('44')) tipo = 'cliente';
        else if (codigo.startsWith('41') || codigo.startsWith('40')) tipo = 'proveedor';

        try {
          await prisma.zucchettiTercero.upsert({
            where: { companyId_zucchettiCodigo: { companyId, zucchettiCodigo: codigo } },
            create: {
              companyId,
              zucchettiCodigo: codigo,
              nif: (t.Nif || '').trim() || null,
              nombre: (t.Nombre || '').trim() || `Tercero ${codigo}`,
              tipo,
              direccion: t.Direccion || null,
              telefono: t.Telefono || null,
              email: t.Email || null,
            },
            update: {
              nif: (t.Nif || '').trim() || null,
              nombre: (t.Nombre || '').trim() || `Tercero ${codigo}`,
              tipo,
              direccion: t.Direccion || null,
              telefono: t.Telefono || null,
              email: t.Email || null,
              ultimaSync: new Date(),
            },
          });
          result.terceros.created++;
        } catch (err: any) {
          result.terceros.errors++;
        }
      }
    } catch (err: any) {
      logger.warn(`[FullSync] Terceros query falló: ${err.message}`);
    }

    // ============ 3. REGISTRO IVA ============
    try {
      // Detectar ejercicio del año actual y anterior
      const currentYear = new Date().getFullYear();
      const ejResult = await pool
        .request()
        .input('y1', sql.default.Int, currentYear)
        .input('y0', sql.default.Int, currentYear - 1)
        .query(
          `SELECT Codigo, FechaInicial FROM Ejercicios WHERE YEAR(FechaInicial) IN (@y0, @y1)`
        );

      for (const ej of ejResult.recordset) {
        const ejercicio = ej.Codigo;
        const ivaResult = await pool.request().query(`
          SELECT
            compras_ventas, factura_numero, factura_fecha,
            tercero_nif, tercero_nombre,
            factura_base / 100.0 as base,
            factura_cuota / 100.0 as cuota,
            factura_total / 100.0 as total,
            impuesto_porcentaje, retencion_porcentaje,
            retencion_importe / 100.0 as retencion,
            tipo_operacion, criterio_de_caja
          FROM Registro_IVA_IGIC
          WHERE codigo_ejercicio = ${ejercicio}
        `);
        result.iva.read += ivaResult.recordset.length;

        for (const r of ivaResult.recordset) {
          if (!r.factura_numero || !r.factura_fecha) continue;
          const cv = (r.compras_ventas || '').toString().toUpperCase().substring(0, 1);
          if (!cv) continue;

          try {
            await prisma.zucchettiIvaRecord.upsert({
              where: {
                companyId_zucchettiCodEjercicio_facturaNumero_comprasVentas: {
                  companyId,
                  zucchettiCodEjercicio: parseInt(String(ejercicio), 10),
                  facturaNumero: String(r.factura_numero),
                  comprasVentas: cv,
                },
              },
              create: {
                companyId,
                zucchettiCodEjercicio: parseInt(String(ejercicio), 10),
                comprasVentas: cv,
                facturaNumero: String(r.factura_numero),
                facturaFecha: new Date(r.factura_fecha),
                terceroNif: r.tercero_nif || null,
                terceroNombre: r.tercero_nombre || null,
                base: parseFloat(r.base) || 0,
                cuota: parseFloat(r.cuota) || 0,
                total: parseFloat(r.total) || 0,
                impuestoPorcentaje: r.impuesto_porcentaje ? parseFloat(r.impuesto_porcentaje) : null,
                retencionPorcentaje: r.retencion_porcentaje ? parseFloat(r.retencion_porcentaje) : null,
                retencionImporte: r.retencion ? parseFloat(r.retencion) : null,
                tipoOperacion: r.tipo_operacion || null,
                criterioCaja: !!r.criterio_de_caja,
              },
              update: {
                terceroNif: r.tercero_nif || null,
                terceroNombre: r.tercero_nombre || null,
                base: parseFloat(r.base) || 0,
                cuota: parseFloat(r.cuota) || 0,
                total: parseFloat(r.total) || 0,
                ultimaSync: new Date(),
              },
            });
            result.iva.created++;
          } catch (err: any) {
            result.iva.errors++;
          }
        }
      }
    } catch (err: any) {
      logger.warn(`[FullSync] IVA query falló: ${err.message}`);
    }

    // ============ 4. SUMAS Y SALDOS POR SUBCUENTA Y MES ============
    try {
      const balanceQuery = await pool.request().query(`
        SELECT
          a.Subcuenta,
          a.CodEjercicio,
          MONTH(a.Fecha) AS Mes,
          SUM(a.Debe) / 100.0 AS TotalDebe,
          SUM(a.Haber) / 100.0 AS TotalHaber,
          COUNT(*) AS NumApuntes,
          MAX(s.Titulo) AS Titulo
        FROM Apuntes a
        LEFT JOIN Subcuentas s ON a.Subcuenta = s.Codigo
        WHERE YEAR(a.Fecha) >= ${new Date().getFullYear() - 1}
        GROUP BY a.Subcuenta, a.CodEjercicio, MONTH(a.Fecha)
      `);
      result.balances.computed = balanceQuery.recordset.length;

      for (const b of balanceQuery.recordset) {
        const subcuenta = String(b.Subcuenta || '').trim();
        if (!subcuenta) continue;
        const totalDebe = parseFloat(b.TotalDebe) || 0;
        const totalHaber = parseFloat(b.TotalHaber) || 0;
        try {
          await prisma.zucchettiBalance.upsert({
            where: {
              companyId_subcuenta_ejercicio_mes: {
                companyId,
                subcuenta,
                ejercicio: parseInt(String(b.CodEjercicio), 10),
                mes: parseInt(String(b.Mes), 10),
              },
            },
            create: {
              companyId,
              subcuenta,
              titulo: b.Titulo || null,
              ejercicio: parseInt(String(b.CodEjercicio), 10),
              mes: parseInt(String(b.Mes), 10),
              totalDebe,
              totalHaber,
              saldo: totalDebe - totalHaber,
              numApuntes: parseInt(String(b.NumApuntes), 10),
            },
            update: {
              titulo: b.Titulo || null,
              totalDebe,
              totalHaber,
              saldo: totalDebe - totalHaber,
              numApuntes: parseInt(String(b.NumApuntes), 10),
              ultimaSync: new Date(),
            },
          });
          result.balances.persisted++;
        } catch (err) {
          // skip
        }
      }
    } catch (err: any) {
      logger.warn(`[FullSync] Balances query falló: ${err.message}`);
    }

    // ============ 5. SNAPSHOT + zucchettiLastSync ============
    result.durationMs = Date.now() - startedAt;
    await prisma.zucchettiSyncSnapshot.upsert({
      where: { companyId },
      create: {
        companyId,
        ultimaSync: new Date(),
        apuntesUltimoCount: result.apuntes.created + result.apuntes.updated,
        ivaUltimoCount: result.iva.created,
        tercerosCount: result.terceros.created,
        balancesCount: result.balances.persisted,
        treasuryCount: result.treasury.created,
        fromDate,
        toDate,
        durationMs: result.durationMs,
        errores:
          result.apuntes.errors +
          result.iva.errors +
          result.terceros.errors +
          result.treasury.errors,
      },
      update: {
        ultimaSync: new Date(),
        apuntesUltimoCount: result.apuntes.created + result.apuntes.updated,
        ivaUltimoCount: result.iva.created,
        tercerosCount: result.terceros.created,
        balancesCount: result.balances.persisted,
        treasuryCount: result.treasury.created,
        fromDate,
        toDate,
        durationMs: result.durationMs,
        errores:
          result.apuntes.errors +
          result.iva.errors +
          result.terceros.errors +
          result.treasury.errors,
        ultimoError: null,
      },
    });

    await prisma.company.update({
      where: { id: companyId },
      data: { zucchettiLastSync: new Date(), zucchettiSyncErrors: result.apuntes.errors },
    });

    result.success = true;
    logger.info(
      `[Zucchetti FullSync] OK sociedad=${company?.nombre} apuntes=${result.apuntes.created}+${result.apuntes.updated} treasury=${result.treasury.created} iva=${result.iva.created} terceros=${result.terceros.created} balances=${result.balances.persisted} duración=${result.durationMs}ms`
    );
  } catch (error: any) {
    result.error = error?.message || String(error);
    logger.error('[Zucchetti FullSync] Error:', error);

    // Persistir el error en el snapshot
    try {
      await prisma.zucchettiSyncSnapshot.upsert({
        where: { companyId },
        create: {
          companyId,
          ultimaSync: new Date(),
          fromDate,
          toDate,
          ultimoError: result.error?.substring(0, 1000),
          errores: 1,
        },
        update: {
          ultimaSync: new Date(),
          ultimoError: result.error?.substring(0, 1000),
          errores: { increment: 1 },
        },
      });
    } catch {
      // ignore
    }
  } finally {
    await closeAllPools();
    result.durationMs = Date.now() - startedAt;
  }

  return result;
}

/**
 * Sincroniza TODAS las sociedades del grupo (Rovida, Vidaro, Viroda).
 */
export async function syncZucchettiGroupVidaro(
  fromDate?: Date,
  toDate?: Date
): Promise<FullSyncResult[]> {
  const VIDARO_GROUP_COMPANY_IDS = [
    'cef19f55f7b6ce0637d5ffb53', // Rovida
    'c65159283deeaf6815f8eda95', // Vidaro
    'cmkctneuh0001nokn7nvhuweq', // Viroda
  ];

  const results: FullSyncResult[] = [];
  for (const companyId of VIDARO_GROUP_COMPANY_IDS) {
    const r = await syncZucchettiFull({ companyId, fromDate, toDate });
    results.push(r);
  }
  return results;
}
