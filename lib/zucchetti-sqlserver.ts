/**
 * Zucchetti SQL Server - Conexión directa a contabilidad
 *
 * Conecta al SQL Server de Zucchetti (server.avannubo.com:33680)
 * para leer datos contables de las sociedades del Grupo Vidaro.
 *
 * Sociedades configuradas:
 *   - RSQ: usuario CONT_RSQ_RO
 *   - VID: usuario CONT_VID_RO (Vidaro Inversiones)
 *   - VIR: usuario CONT_VIR_RO (Viroda Inversiones)
 *
 * Todas las conexiones usan connection pooling para eficiencia.
 */

import sql from 'mssql';
import logger from '@/lib/logger';

// ============================================================================
// TIPOS
// ============================================================================

export type ZucchettiCompanyKey = 'RSQ' | 'VID' | 'VIR';

export interface ZucchettiSqlConfig {
  server: string;
  port: number;
  user: string;
  password: string;
  database?: string;
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
    requestTimeout: number;
    connectionTimeout: number;
  };
}

export interface ZucchettiTableInfo {
  TABLE_CATALOG: string;
  TABLE_SCHEMA: string;
  TABLE_NAME: string;
  TABLE_TYPE: string;
}

export interface ZucchettiColumnInfo {
  TABLE_NAME: string;
  COLUMN_NAME: string;
  DATA_TYPE: string;
  IS_NULLABLE: string;
  CHARACTER_MAXIMUM_LENGTH: number | null;
  ORDINAL_POSITION: number;
}

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const DEFAULT_TIMEOUT = 15000;

function getCompanyConfig(companyKey: ZucchettiCompanyKey): ZucchettiSqlConfig {
  const server = process.env.ZUCCHETTI_SERVER;
  const port = parseInt(process.env.ZUCCHETTI_PORT || '33680', 10);

  if (!server) {
    throw new Error('ZUCCHETTI_SERVER no configurado');
  }

  const credMap: Record<ZucchettiCompanyKey, { userEnv: string; passEnv: string }> = {
    RSQ: { userEnv: 'ZUCCHETTI_RSQ_USER', passEnv: 'ZUCCHETTI_RSQ_PASS' },
    VID: { userEnv: 'ZUCCHETTI_VID_USER', passEnv: 'ZUCCHETTI_VID_PASS' },
    VIR: { userEnv: 'ZUCCHETTI_VIR_USER', passEnv: 'ZUCCHETTI_VIR_PASS' },
  };

  const cred = credMap[companyKey];
  const user = process.env[cred.userEnv];
  const password = process.env[cred.passEnv];

  if (!user || !password) {
    throw new Error(
      `Credenciales Zucchetti SQL no configuradas para ${companyKey} (${cred.userEnv})`
    );
  }

  return {
    server,
    port,
    user,
    password,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      requestTimeout: DEFAULT_TIMEOUT,
      connectionTimeout: DEFAULT_TIMEOUT,
    },
  };
}

// ============================================================================
// CONNECTION POOL MANAGEMENT
// ============================================================================

const pools = new Map<string, sql.ConnectionPool>();

/**
 * Obtiene un ConnectionPool para una sociedad. Reutiliza si ya existe.
 * Si se pasa database, conecta a esa BD específica.
 */
export async function getZucchettiPool(
  companyKey: ZucchettiCompanyKey,
  database?: string
): Promise<sql.ConnectionPool> {
  const poolKey = `${companyKey}:${database || 'default'}`;

  const existing = pools.get(poolKey);
  if (existing?.connected) {
    return existing;
  }

  // Limpiar pool desconectado si existe
  if (existing) {
    try { await existing.close(); } catch { /* ignore */ }
    pools.delete(poolKey);
  }

  const config = getCompanyConfig(companyKey);
  const poolConfig: sql.config = {
    server: config.server,
    port: config.port,
    user: config.user,
    password: config.password,
    database: database || undefined,
    options: config.options,
    pool: {
      max: 5,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };

  logger.info(`[Zucchetti SQL] Conectando pool ${companyKey}${database ? ` → ${database}` : ''}...`);

  const pool = new sql.ConnectionPool(poolConfig);

  pool.on('error', (err) => {
    logger.error(`[Zucchetti SQL] Pool error (${poolKey}):`, err);
  });

  await pool.connect();
  pools.set(poolKey, pool);

  logger.info(`[Zucchetti SQL] Pool ${poolKey} conectado`);
  return pool;
}

/**
 * Cierra todos los pools abiertos. Usar en cleanup/shutdown.
 */
export async function closeAllPools(): Promise<void> {
  for (const [key, pool] of Array.from(pools.entries())) {
    try {
      await pool.close();
      logger.info(`[Zucchetti SQL] Pool ${key} cerrado`);
    } catch (err) {
      logger.error(`[Zucchetti SQL] Error cerrando pool ${key}:`, err);
    }
  }
  pools.clear();
}

// ============================================================================
// QUERIES DE DISCOVERY
// ============================================================================

/**
 * Lista las bases de datos accesibles para una sociedad.
 */
export async function listDatabases(companyKey: ZucchettiCompanyKey): Promise<string[]> {
  const pool = await getZucchettiPool(companyKey);
  const result = await pool.request().query('SELECT name FROM sys.databases ORDER BY name');
  return result.recordset.map((r: { name: string }) => r.name);
}

/**
 * Lista tablas de una base de datos.
 */
export async function listTables(
  companyKey: ZucchettiCompanyKey,
  database: string
): Promise<ZucchettiTableInfo[]> {
  const pool = await getZucchettiPool(companyKey, database);
  const result = await pool.request().query(`
    SELECT TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE
    FROM INFORMATION_SCHEMA.TABLES
    ORDER BY TABLE_SCHEMA, TABLE_NAME
  `);
  return result.recordset;
}

/**
 * Lista columnas de una tabla.
 */
export async function listColumns(
  companyKey: ZucchettiCompanyKey,
  database: string,
  tableName: string,
  schema: string = 'dbo'
): Promise<ZucchettiColumnInfo[]> {
  const pool = await getZucchettiPool(companyKey, database);
  const result = await pool
    .request()
    .input('tableName', sql.NVarChar, tableName)
    .input('schema', sql.NVarChar, schema)
    .query(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE,
             CHARACTER_MAXIMUM_LENGTH, ORDINAL_POSITION
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = @tableName AND TABLE_SCHEMA = @schema
      ORDER BY ORDINAL_POSITION
    `);
  return result.recordset;
}

/**
 * Cuenta registros de una tabla.
 */
export async function countRows(
  companyKey: ZucchettiCompanyKey,
  database: string,
  tableName: string,
  schema: string = 'dbo'
): Promise<number> {
  const pool = await getZucchettiPool(companyKey, database);
  const fullName = `[${schema}].[${tableName}]`;
  const result = await pool.request().query(`SELECT COUNT(*) AS cnt FROM ${fullName}`);
  return result.recordset[0]?.cnt ?? 0;
}

/**
 * Obtiene N filas de muestra de una tabla.
 */
export async function sampleRows(
  companyKey: ZucchettiCompanyKey,
  database: string,
  tableName: string,
  schema: string = 'dbo',
  limit: number = 5
): Promise<Record<string, unknown>[]> {
  const pool = await getZucchettiPool(companyKey, database);
  const fullName = `[${schema}].[${tableName}]`;
  const result = await pool.request().query(`SELECT TOP ${limit} * FROM ${fullName}`);
  return result.recordset;
}

// ============================================================================
// QUERY GENÉRICA
// ============================================================================

/**
 * Ejecuta una query SQL arbitraria (solo SELECT, para seguridad).
 */
export async function executeQuery(
  companyKey: ZucchettiCompanyKey,
  database: string,
  queryText: string
): Promise<sql.IResult<Record<string, unknown>>> {
  // Seguridad: solo permitir SELECT
  const normalized = queryText.trim().toUpperCase();
  if (!normalized.startsWith('SELECT')) {
    throw new Error('Solo se permiten consultas SELECT');
  }

  const pool = await getZucchettiPool(companyKey, database);
  return pool.request().query(queryText);
}

// ============================================================================
// LECTURA CONTABLE
// ============================================================================
// NOTA: Las queries de esta sección usan nombres de tabla genéricos de Zucchetti.
// Tras ejecutar el discovery (scripts/discover-zucchetti-schema.ts) se ajustarán
// los nombres reales de tablas y columnas.
//
// Nombres típicos en Zucchetti SQL Server:
//   Asientos / Apuntes → cabecera + líneas de asientos contables
//   Subcuentas / PlanCuentas → plan de cuentas
//   Diario → libro diario
//   Ejercicio → ejercicios contables
//   Terceros → clientes/proveedores

/**
 * Configuración de nombres de tablas por base de datos.
 * Se poblará tras el discovery. Mientras, usa valores por defecto.
 */
export interface ZucchettiTableNames {
  /** Tabla de asientos contables (cabecera) */
  asientos: string;
  /** Tabla de líneas/apuntes de asientos */
  apuntes: string;
  /** Tabla de plan de cuentas / subcuentas */
  subcuentas: string;
  /** Tabla de ejercicios contables */
  ejercicios: string;
  /** Tabla de terceros (clientes/proveedores) */
  terceros: string;
  /** Tabla de diario */
  diario: string;
}

/**
 * Nombres reales de tablas — confirmados vía discovery 18 Mar 2026.
 * SQL Server 2019, server.avannubo.com:33680
 *
 * BDs: CONT_RSQ (Rovida), CONT_VID (Vidaro), DAT_VIR (Viroda)
 * Schema: cont_vid / cont_rsq / dat_vir (coincide con nombre BD en minúsculas)
 */
const DEFAULT_TABLE_NAMES: ZucchettiTableNames = {
  asientos: 'Apuntes',       // Columnas: Codigo, Fecha, CodEjercicio, Asiento, Apunte, Subcuenta, Debe, Haber, ConceptoTexto, Factura, Documento...
  apuntes: 'Apuntes',        // Misma tabla (en Zucchetti, asientos y apuntes son lo mismo)
  subcuentas: 'Subcuentas',  // Columnas: Codigo, Titulo, SaldoHabitual, CodigoTercero...
  ejercicios: 'Ejercicios',  // Columnas: CodigoEjercicio, FechaInicio, FechaFin...
  terceros: 'Terceros',      // Columnas: Codigo, Nombre, NIF, Direccion...
  diario: 'Apuntes',         // Zucchetti no tiene tabla Diario separada, usa Apuntes
};

/**
 * Obtiene los nombres de tablas configurados.
 * En el futuro se leerán de una config o BD; por ahora usa defaults.
 */
export function getTableNames(): ZucchettiTableNames {
  return { ...DEFAULT_TABLE_NAMES };
}

/** Resultado de un asiento contable leído del SQL Server */
export interface ZucchettiAsiento {
  /** Número de asiento */
  numero: number | string;
  /** Fecha del asiento */
  fecha: Date | string;
  /** Descripción / concepto */
  descripcion: string;
  /** Referencia / documento */
  referencia?: string;
  /** Líneas del asiento */
  lineas: ZucchettiApunte[];
  /** Datos raw del SQL Server */
  raw?: Record<string, unknown>;
}

/** Línea/apunte de un asiento */
export interface ZucchettiApunte {
  /** Código de subcuenta */
  subcuenta: string;
  /** Nombre de la subcuenta */
  nombreSubcuenta?: string;
  /** Importe en el debe */
  debe: number;
  /** Importe en el haber */
  haber: number;
  /** Concepto de la línea */
  concepto?: string;
  /** Datos raw */
  raw?: Record<string, unknown>;
}

/** Subcuenta del plan de cuentas */
export interface ZucchettiSubcuenta {
  /** Código de la subcuenta (ej: 6220000) */
  codigo: string;
  /** Nombre/título */
  nombre: string;
  /** Saldo debe acumulado */
  saldoDebe?: number;
  /** Saldo haber acumulado */
  saldoHaber?: number;
  /** Datos raw */
  raw?: Record<string, unknown>;
}

/**
 * Lee asientos contables de un período.
 *
 * @param companyKey Sociedad (RSQ/VID/VIR)
 * @param database Nombre de la BD en SQL Server
 * @param fromDate Fecha inicio (YYYY-MM-DD)
 * @param toDate Fecha fin (YYYY-MM-DD)
 * @param limit Máximo de asientos (default 1000)
 *
 * NOTA: La query exacta depende del esquema descubierto.
 * Esta implementación intenta queries genéricas y fallback.
 */
export async function getAccountingEntries(
  companyKey: ZucchettiCompanyKey,
  database: string,
  fromDate: string,
  toDate: string,
  limit: number = 1000
): Promise<ZucchettiAsiento[]> {
  const pool = await getZucchettiPool(companyKey, database);
  const tables = getTableNames();

  try {
    const result = await pool
      .request()
      .input('fromDate', sql.Date, fromDate)
      .input('toDate', sql.Date, toDate)
      .query(`
        SELECT TOP ${limit}
          a.Codigo, a.Fecha, a.CodEjercicio, a.Asiento, a.Apunte,
          a.Subcuenta, a.Contrapartida, a.ConceptoTexto,
          a.Debe, a.Haber, a.Documento, a.Factura, a.Referencia,
          a.CentroDeCoste, a.FechaValor, a.Vencimiento,
          s.Titulo AS NombreSubcuenta
        FROM [${tables.apuntes}] a
        LEFT JOIN [Subcuentas] s ON a.Subcuenta = s.Codigo
        WHERE a.Fecha >= @fromDate AND a.Fecha <= @toDate
        ORDER BY a.Fecha, a.Asiento, a.Apunte
      `);

    // Agrupar por número de asiento
    const grouped = new Map<string, ZucchettiAsiento>();
    for (const row of result.recordset) {
      const key = `${row.CodEjercicio}-${row.Asiento}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          numero: row.Asiento,
          fecha: row.Fecha,
          descripcion: row.ConceptoTexto || '',
          referencia: row.Factura || row.Documento || undefined,
          lineas: [],
          raw: row,
        });
      }
      const asiento = grouped.get(key)!;
      asiento.lineas.push({
        subcuenta: String(row.Subcuenta || '').trim(),
        nombreSubcuenta: row.NombreSubcuenta || undefined,
        debe: parseFloat(row.Debe || 0),
        haber: parseFloat(row.Haber || 0),
        concepto: row.ConceptoTexto || undefined,
        raw: row,
      });
    }

    return Array.from(grouped.values());
  } catch (err: any) {
    logger.warn(`[Zucchetti SQL] Query asientos falló en ${database}: ${err.message}`);
    return [];
  }
}

/**
 * Lee el plan de cuentas / subcuentas.
 */
export async function getChartOfAccounts(
  companyKey: ZucchettiCompanyKey,
  database: string
): Promise<ZucchettiSubcuenta[]> {
  const pool = await getZucchettiPool(companyKey, database);
  const tables = getTableNames();

  try {
    const result = await pool.request().query(`
      SELECT Codigo, Titulo, SaldoHabitual, CodigoTercero, Grupo, Bloqueada
      FROM [Subcuentas]
      ORDER BY Codigo
    `);

    return result.recordset.map((row: any) => ({
      codigo: String(row.Codigo || '').trim(),
      nombre: (row.Titulo || '').trim(),
      saldoDebe: 0,
      saldoHaber: 0,
      raw: row,
    }));
  } catch (err: any) {
    logger.warn(`[Zucchetti SQL] Query subcuentas falló en ${database}: ${err.message}`);
    return [];
  }
}

/**
 * Obtiene saldos de cuentas a una fecha dada.
 */
export async function getAccountBalances(
  companyKey: ZucchettiCompanyKey,
  database: string,
  asOfDate: string
): Promise<Array<{ subcuenta: string; nombre: string; debe: number; haber: number; saldo: number }>> {
  const pool = await getZucchettiPool(companyKey, database);
  const tables = getTableNames();

  try {
    const result = await pool
      .request()
      .input('asOfDate', sql.Date, asOfDate)
      .query(`
        SELECT
          a.Subcuenta,
          s.Titulo AS Nombre,
          SUM(ISNULL(a.Debe, 0)) AS TotalDebe,
          SUM(ISNULL(a.Haber, 0)) AS TotalHaber,
          SUM(ISNULL(a.Debe, 0)) - SUM(ISNULL(a.Haber, 0)) AS Saldo
        FROM [Apuntes] a
        LEFT JOIN [Subcuentas] s ON a.Subcuenta = s.Codigo
        WHERE a.Fecha <= @asOfDate
        GROUP BY a.Subcuenta, s.Titulo
        ORDER BY a.Subcuenta
      `);

    return result.recordset.map((row: any) => ({
      subcuenta: String(row.Subcuenta || '').trim(),
      nombre: (row.Nombre || '').trim(),
      debe: parseFloat(row.TotalDebe || 0),
      haber: parseFloat(row.TotalHaber || 0),
      saldo: parseFloat(row.Saldo || 0),
    }));
  } catch (err: any) {
    logger.warn(`[Zucchetti SQL] Query balances falló en ${database}: ${err.message}`);
    return [];
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Verifica si la conexión SQL Server está configurada para una sociedad.
 */
export function isZucchettiSqlConfigured(companyKey?: ZucchettiCompanyKey): boolean {
  const server = process.env.ZUCCHETTI_SERVER;
  if (!server) return false;

  if (!companyKey) {
    // Verificar si al menos una sociedad está configurada
    return ['RSQ', 'VID', 'VIR'].some((key) => {
      const userEnv = `ZUCCHETTI_${key}_USER`;
      const passEnv = `ZUCCHETTI_${key}_PASS`;
      return !!process.env[userEnv] && !!process.env[passEnv];
    });
  }

  const userEnv = `ZUCCHETTI_${companyKey}_USER`;
  const passEnv = `ZUCCHETTI_${companyKey}_PASS`;
  return !!process.env[userEnv] && !!process.env[passEnv];
}

/**
 * Devuelve las claves de sociedad configuradas.
 */
export function getConfiguredCompanyKeys(): ZucchettiCompanyKey[] {
  return (['RSQ', 'VID', 'VIR'] as ZucchettiCompanyKey[]).filter((key) =>
    isZucchettiSqlConfigured(key)
  );
}

/**
 * Mapeo de companyKey a nombre de base de datos en SQL Server.
 * Confirmado vía discovery 18 Mar 2026.
 */
export function getZucchettiDatabase(companyKey: ZucchettiCompanyKey): string {
  const mapping: Record<ZucchettiCompanyKey, string> = {
    RSQ: 'CONT_RSQ',
    VID: 'CONT_VID',
    VIR: 'DAT_VIR',
  };
  return mapping[companyKey];
}

/**
 * Mapeo de companyKey de Zucchetti a companyId de INMOVA.
 *
 * RSQ = Rovida S.L. (confirmado)
 * VID = Vidaro Inversiones S.L.
 * VIR = Viroda Inversiones S.L.U.
 */
export function mapCompanyKeyToInmovaId(companyKey: ZucchettiCompanyKey): string | null {
  const mapping: Record<ZucchettiCompanyKey, string | null> = {
    RSQ: 'rovida-sl',
    VID: 'vidaro-inversiones',
    VIR: 'viroda-inversiones',
  };
  return mapping[companyKey] ?? null;
}

/**
 * Mapeo inverso: companyId INMOVA → companyKey Zucchetti.
 */
export function mapInmovaIdToCompanyKey(companyId: string): ZucchettiCompanyKey | null {
  const mapping: Record<string, ZucchettiCompanyKey> = {
    'rovida-sl': 'RSQ',
    'vidaro-inversiones': 'VID',
    'viroda-inversiones': 'VIR',
  };
  return mapping[companyId] ?? null;
}
