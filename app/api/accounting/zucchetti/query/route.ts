/**
 * GET /api/accounting/zucchetti/query
 *
 * Consulta datos del SQL Server de Zucchetti.
 * Solo accesible por admin/superadmin.
 *
 * Params:
 *   company: RSQ | VID | VIR
 *   database: nombre de la BD (obtenido del discovery)
 *   type: databases | tables | columns | sample | count
 *   table: nombre de tabla (para columns, sample, count)
 *   schema: schema de la tabla (default: dbo)
 *   limit: filas de muestra (default: 10, max: 100)
 *
 * Ejemplos:
 *   GET /api/accounting/zucchetti/query?company=VID&type=databases
 *   GET /api/accounting/zucchetti/query?company=VID&database=CONT_VID&type=tables
 *   GET /api/accounting/zucchetti/query?company=VID&database=CONT_VID&type=columns&table=Asientos
 *   GET /api/accounting/zucchetti/query?company=VID&database=CONT_VID&type=sample&table=Asientos&limit=5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  listDatabases,
  listTables,
  listColumns,
  countRows,
  sampleRows,
  isZucchettiSqlConfigured,
  type ZucchettiCompanyKey,
} from '@/lib/zucchetti-sqlserver';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const VALID_COMPANY_KEYS = ['RSQ', 'VID', 'VIR'];
const VALID_QUERY_TYPES = ['databases', 'tables', 'columns', 'sample', 'count'];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo admin/superadmin
    const role = (session.user as any).role;
    if (!['super_admin', 'administrador'].includes(role)) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    if (!isZucchettiSqlConfigured()) {
      return NextResponse.json(
        { error: 'SQL Server de Zucchetti no configurado' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const company = searchParams.get('company')?.toUpperCase();
    const database = searchParams.get('database');
    const type = searchParams.get('type');
    const table = searchParams.get('table');
    const schema = searchParams.get('schema') || 'dbo';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100);

    if (!company || !VALID_COMPANY_KEYS.includes(company)) {
      return NextResponse.json(
        { error: `company debe ser uno de: ${VALID_COMPANY_KEYS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!type || !VALID_QUERY_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `type debe ser uno de: ${VALID_QUERY_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const companyKey = company as ZucchettiCompanyKey;

    if (!isZucchettiSqlConfigured(companyKey)) {
      return NextResponse.json(
        { error: `Credenciales no configuradas para ${companyKey}` },
        { status: 503 }
      );
    }

    switch (type) {
      case 'databases': {
        const databases = await listDatabases(companyKey);
        return NextResponse.json({ company: companyKey, databases });
      }

      case 'tables': {
        if (!database) {
          return NextResponse.json({ error: 'Param database requerido' }, { status: 400 });
        }
        const tables = await listTables(companyKey, database);
        return NextResponse.json({ company: companyKey, database, tables });
      }

      case 'columns': {
        if (!database || !table) {
          return NextResponse.json(
            { error: 'Params database y table requeridos' },
            { status: 400 }
          );
        }
        const columns = await listColumns(companyKey, database, table, schema);
        return NextResponse.json({ company: companyKey, database, table, schema, columns });
      }

      case 'sample': {
        if (!database || !table) {
          return NextResponse.json(
            { error: 'Params database y table requeridos' },
            { status: 400 }
          );
        }
        const rows = await sampleRows(companyKey, database, table, schema, limit);
        return NextResponse.json({
          company: companyKey,
          database,
          table,
          schema,
          limit,
          rows,
        });
      }

      case 'count': {
        if (!database || !table) {
          return NextResponse.json(
            { error: 'Params database y table requeridos' },
            { status: 400 }
          );
        }
        const count = await countRows(companyKey, database, table, schema);
        return NextResponse.json({ company: companyKey, database, table, schema, count });
      }

      default:
        return NextResponse.json({ error: 'Tipo de query no soportado' }, { status: 400 });
    }
  } catch (error: any) {
    logger.error('[Zucchetti Query]', error);
    return NextResponse.json(
      { error: 'Error ejecutando query', details: error.message },
      { status: 500 }
    );
  }
}
