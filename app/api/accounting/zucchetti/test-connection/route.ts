/**
 * POST /api/accounting/zucchetti/test-connection
 *
 * Prueba la conexión al SQL Server de Zucchetti para cada sociedad configurada.
 * Requiere sesión admin/superadmin.
 *
 * Response:
 * {
 *   sqlServer: {
 *     configured: boolean,
 *     results: { RSQ: {...}, VID: {...}, VIR: {...} }
 *   },
 *   altaiApi: { configured: boolean, ... }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getConfiguredCompanyKeys,
  getZucchettiPool,
  isZucchettiSqlConfigured,
  closeAllPools,
  type ZucchettiCompanyKey,
} from '@/lib/zucchetti-sqlserver';
import { isAltaiConfigured, getZucchettiAuthMode } from '@/lib/zucchetti-altai-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface CompanyTestResult {
  companyKey: string;
  connected: boolean;
  database?: string;
  serverVersion?: string;
  error?: string;
  latencyMs?: number;
}

export async function POST(request: NextRequest) {
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

    const sqlConfigured = isZucchettiSqlConfigured();
    const altaiConfigured = isAltaiConfigured();
    const configuredKeys = getConfiguredCompanyKeys();

    const sqlResults: Record<string, CompanyTestResult> = {};

    if (sqlConfigured) {
      for (const key of configuredKeys) {
        const start = Date.now();
        try {
          const pool = await getZucchettiPool(key);
          const result = await pool.request().query(`
            SELECT DB_NAME() AS current_db, @@VERSION AS version
          `);
          const row = result.recordset[0];
          sqlResults[key] = {
            companyKey: key,
            connected: true,
            database: row?.current_db,
            serverVersion: (row?.version || '').split('\n')[0],
            latencyMs: Date.now() - start,
          };
        } catch (err: any) {
          sqlResults[key] = {
            companyKey: key,
            connected: false,
            error: err.message,
            latencyMs: Date.now() - start,
          };
        }
      }
    }

    return NextResponse.json({
      sqlServer: {
        configured: sqlConfigured,
        configuredCompanies: configuredKeys,
        results: sqlResults,
      },
      altaiApi: {
        configured: altaiConfigured,
        authMode: getZucchettiAuthMode(),
      },
    });
  } catch (error: any) {
    logger.error('[Zucchetti Test Connection]', error);
    return NextResponse.json(
      { error: 'Error probando conexión', details: error.message },
      { status: 500 }
    );
  }
}
