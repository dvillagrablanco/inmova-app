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
 * Mapeo de companyKey de Zucchetti a companyId de INMOVA.
 * Se actualizará tras el discovery cuando sepamos qué es RSQ.
 */
export function mapCompanyKeyToInmovaId(companyKey: ZucchettiCompanyKey): string | null {
  const mapping: Record<ZucchettiCompanyKey, string | null> = {
    VID: 'vidaro-inversiones',
    VIR: 'viroda-inversiones',
    RSQ: 'rovida-sl', // Pendiente confirmar
  };
  return mapping[companyKey] ?? null;
}

/**
 * Mapeo inverso: companyId INMOVA → companyKey Zucchetti.
 */
export function mapInmovaIdToCompanyKey(companyId: string): ZucchettiCompanyKey | null {
  const mapping: Record<string, ZucchettiCompanyKey> = {
    'vidaro-inversiones': 'VID',
    'viroda-inversiones': 'VIR',
    'rovida-sl': 'RSQ', // Pendiente confirmar
  };
  return mapping[companyId] ?? null;
}
