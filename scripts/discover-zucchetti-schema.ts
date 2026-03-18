/**
 * Discovery: Explorar esquema del SQL Server de Zucchetti
 *
 * Conecta a server.avannubo.com:33680 con cada usuario (RSQ, VID, VIR)
 * y descubre:
 *   1. Bases de datos accesibles
 *   2. Tablas de cada BD
 *   3. Columnas de tablas relevantes (contabilidad)
 *   4. Conteos de registros
 *   5. Muestra de 3 filas por tabla clave
 *
 * Output: data/zucchetti-schema-discovery.json
 *
 * Uso: npx tsx scripts/discover-zucchetti-schema.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Cargar .env.local para credenciales
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config(); // fallback .env

import sql from 'mssql';

// ============================================================================
// TIPOS
// ============================================================================

type CompanyKey = 'RSQ' | 'VID' | 'VIR';

interface DiscoveryResult {
  timestamp: string;
  server: string;
  port: number;
  companies: Record<string, CompanyDiscovery>;
}

interface CompanyDiscovery {
  companyKey: string;
  user: string;
  connected: boolean;
  error?: string;
  databases: string[];
  databaseDetails: Record<string, DatabaseDetail>;
}

interface DatabaseDetail {
  name: string;
  tables: TableInfo[];
  tableDetails: Record<string, TableDetail>;
}

interface TableInfo {
  schema: string;
  name: string;
  type: string;
}

interface TableDetail {
  rowCount: number;
  columns: ColumnInfo[];
  sampleRows: Record<string, unknown>[];
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: string;
  maxLength: number | null;
  position: number;
}

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const SERVER = process.env.ZUCCHETTI_SERVER || 'server.avannubo.com';
const PORT = parseInt(process.env.ZUCCHETTI_PORT || '33680', 10);

const COMPANY_CREDS: Record<CompanyKey, { user: string; pass: string }> = {
  RSQ: {
    user: process.env.ZUCCHETTI_RSQ_USER || '',
    pass: process.env.ZUCCHETTI_RSQ_PASS || '',
  },
  VID: {
    user: process.env.ZUCCHETTI_VID_USER || '',
    pass: process.env.ZUCCHETTI_VID_PASS || '',
  },
  VIR: {
    user: process.env.ZUCCHETTI_VIR_USER || '',
    pass: process.env.ZUCCHETTI_VIR_PASS || '',
  },
};

// Tablas que probablemente contengan datos contables en Zucchetti
const ACCOUNTING_TABLE_HINTS = [
  'asiento', 'apunte', 'diario', 'cuenta', 'subcuenta', 'plan', 'balance',
  'mayor', 'libro', 'ejercicio', 'periodo', 'factura', 'iva', 'tercero',
  'proveedor', 'cliente', 'cobro', 'pago', 'banco', 'partida', 'saldo',
  'journal', 'entry', 'account', 'ledger', 'invoice', 'transaction',
  'movimiento', 'linea', 'cabecera', 'empresa', 'sociedad',
];

// ============================================================================
// FUNCIONES
// ============================================================================

async function connectToServer(
  companyKey: CompanyKey
): Promise<sql.ConnectionPool | null> {
  const creds = COMPANY_CREDS[companyKey];
  if (!creds.user || !creds.pass) {
    console.log(`  ⚠️  ${companyKey}: Credenciales no configuradas`);
    return null;
  }

  const config: sql.config = {
    server: SERVER,
    port: PORT,
    user: creds.user,
    password: creds.pass,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      requestTimeout: 30000,
      connectionTimeout: 15000,
    },
  };

  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log(`  ✅ ${companyKey}: Conectado como ${creds.user}`);
    return pool;
  } catch (err: any) {
    console.log(`  ❌ ${companyKey}: Error — ${err.message}`);
    return null;
  }
}

async function getDatabases(pool: sql.ConnectionPool): Promise<string[]> {
  try {
    const result = await pool.request().query('SELECT name FROM sys.databases ORDER BY name');
    return result.recordset.map((r: any) => r.name);
  } catch (err: any) {
    console.log(`    ⚠️  No se pueden listar BDs: ${err.message}`);
    // Intentar método alternativo
    try {
      const result = await pool.request().query('SELECT DB_NAME() AS current_db');
      return [result.recordset[0]?.current_db].filter(Boolean);
    } catch {
      return [];
    }
  }
}

async function getTables(pool: sql.ConnectionPool, database: string): Promise<TableInfo[]> {
  try {
    // Cambiar a la BD
    await pool.request().batch(`USE [${database}]`);

    const result = await pool.request().query(`
      SELECT TABLE_SCHEMA as [schema], TABLE_NAME as name, TABLE_TYPE as type
      FROM INFORMATION_SCHEMA.TABLES
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);
    return result.recordset;
  } catch (err: any) {
    console.log(`    ⚠️  Error listando tablas de ${database}: ${err.message}`);
    return [];
  }
}

async function getColumns(
  pool: sql.ConnectionPool,
  tableName: string,
  schema: string = 'dbo'
): Promise<ColumnInfo[]> {
  try {
    const result = await pool
      .request()
      .input('tbl', sql.NVarChar, tableName)
      .input('sch', sql.NVarChar, schema)
      .query(`
        SELECT COLUMN_NAME as name, DATA_TYPE as type, IS_NULLABLE as nullable,
               CHARACTER_MAXIMUM_LENGTH as maxLength, ORDINAL_POSITION as position
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = @tbl AND TABLE_SCHEMA = @sch
        ORDER BY ORDINAL_POSITION
      `);
    return result.recordset;
  } catch {
    return [];
  }
}

async function getRowCount(
  pool: sql.ConnectionPool,
  tableName: string,
  schema: string = 'dbo'
): Promise<number> {
  try {
    const result = await pool
      .request()
      .query(`SELECT COUNT(*) AS cnt FROM [${schema}].[${tableName}]`);
    return result.recordset[0]?.cnt ?? 0;
  } catch {
    return -1;
  }
}

async function getSampleRows(
  pool: sql.ConnectionPool,
  tableName: string,
  schema: string = 'dbo',
  limit: number = 3
): Promise<Record<string, unknown>[]> {
  try {
    const result = await pool
      .request()
      .query(`SELECT TOP ${limit} * FROM [${schema}].[${tableName}]`);
    return result.recordset;
  } catch {
    return [];
  }
}

function isAccountingRelated(tableName: string): boolean {
  const lower = tableName.toLowerCase();
  return ACCOUNTING_TABLE_HINTS.some((hint) => lower.includes(hint));
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('====================================================================');
  console.log('  DISCOVERY: Esquema SQL Server de Zucchetti');
  console.log(`  Servidor: ${SERVER}:${PORT}`);
  console.log('====================================================================\n');

  const discovery: DiscoveryResult = {
    timestamp: new Date().toISOString(),
    server: SERVER,
    port: PORT,
    companies: {},
  };

  for (const companyKey of ['RSQ', 'VID', 'VIR'] as CompanyKey[]) {
    console.log(`\n🔍 Explorando ${companyKey}...`);

    const companyResult: CompanyDiscovery = {
      companyKey,
      user: COMPANY_CREDS[companyKey].user,
      connected: false,
      databases: [],
      databaseDetails: {},
    };

    const pool = await connectToServer(companyKey);
    if (!pool) {
      companyResult.error = 'No se pudo conectar';
      discovery.companies[companyKey] = companyResult;
      continue;
    }

    companyResult.connected = true;

    // 1. Listar bases de datos
    console.log('  📂 Listando bases de datos...');
    const databases = await getDatabases(pool);
    companyResult.databases = databases;
    console.log(`     Encontradas: ${databases.join(', ')}`);

    // 2. Para cada BD, listar tablas
    for (const db of databases) {
      // Saltar BDs del sistema
      if (['master', 'tempdb', 'model', 'msdb'].includes(db)) {
        continue;
      }

      console.log(`\n  📁 Base de datos: ${db}`);

      try {
        // Nuevo pool para cada BD
        const dbPool = new sql.ConnectionPool({
          server: SERVER,
          port: PORT,
          user: COMPANY_CREDS[companyKey].user,
          password: COMPANY_CREDS[companyKey].pass,
          database: db,
          options: {
            encrypt: false,
            trustServerCertificate: true,
            requestTimeout: 30000,
            connectionTimeout: 15000,
          },
        });
        await dbPool.connect();

        const tables = await getTables(dbPool, db);
        console.log(`     ${tables.length} tablas encontradas`);

        const dbDetail: DatabaseDetail = {
          name: db,
          tables,
          tableDetails: {},
        };

        // 3. Para tablas relevantes, obtener detalle
        const relevantTables = tables.filter(
          (t) => t.type === 'BASE TABLE'
        );

        // Primero explorar TODAS las tablas con conteo
        const tableSummary: Array<{ name: string; schema: string; count: number; relevant: boolean }> = [];

        for (const table of relevantTables) {
          const count = await getRowCount(dbPool, table.name, table.schema);
          const relevant = isAccountingRelated(table.name);
          tableSummary.push({ name: table.name, schema: table.schema, count, relevant });
        }

        // Ordenar por relevancia y luego por conteo
        tableSummary.sort((a, b) => {
          if (a.relevant !== b.relevant) return a.relevant ? -1 : 1;
          return b.count - a.count;
        });

        // Log resumen
        console.log(`\n     📊 Resumen de tablas (${tableSummary.length} total):`);
        for (const t of tableSummary) {
          const marker = t.relevant ? '⭐' : '  ';
          console.log(`     ${marker} ${t.schema}.${t.name}: ${t.count >= 0 ? t.count : '?'} filas`);
        }

        // Detalle de las 30 tablas más relevantes (con datos o accounting-related)
        const tablesForDetail = tableSummary
          .filter((t) => t.count > 0 || t.relevant)
          .slice(0, 30);

        for (const table of tablesForDetail) {
          console.log(`\n     🔎 Detallando ${table.schema}.${table.name} (${table.count} filas)...`);

          const columns = await getColumns(dbPool, table.name, table.schema);
          const sampleRows = table.count > 0
            ? await getSampleRows(dbPool, table.name, table.schema, 3)
            : [];

          dbDetail.tableDetails[`${table.schema}.${table.name}`] = {
            rowCount: table.count,
            columns,
            sampleRows,
          };

          // Log columnas
          if (columns.length > 0) {
            console.log(`        Columnas: ${columns.map((c) => `${c.name}(${c.type})`).join(', ')}`);
          }
        }

        companyResult.databaseDetails[db] = dbDetail;

        await dbPool.close();
      } catch (err: any) {
        console.log(`     ❌ Error explorando ${db}: ${err.message}`);
      }
    }

    // Cerrar pool principal
    try { await pool.close(); } catch { /* ignore */ }

    discovery.companies[companyKey] = companyResult;
  }

  // Guardar resultado
  const outputPath = path.resolve(process.cwd(), 'data', 'zucchetti-schema-discovery.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(discovery, null, 2), 'utf-8');

  console.log('\n====================================================================');
  console.log(`  ✅ Discovery completado. Resultado guardado en:`);
  console.log(`     ${outputPath}`);
  console.log('====================================================================');
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
