/**
 * GET /api/accounting/zucchetti/status
 * Devuelve el estado de la integración Zucchetti/Altai para la empresa activa
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isAltaiConfigured, getZucchettiAuthMode } from '@/lib/zucchetti-altai-service';
import {
  isZucchettiSqlConfigured,
  getConfiguredCompanyKeys,
  mapInmovaIdToCompanyKey,
} from '@/lib/zucchetti-sqlserver';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ configured: false });
    }

    const { searchParams } = new URL(req.url);
    const queryCompanyId = searchParams.get('companyId');
    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const activeCompanyId = queryCompanyId || cookieCompanyId || session.user.companyId;

    const company = await prisma.company.findUnique({
      where: { id: activeCompanyId },
      select: {
        zucchettiEnabled: true,
        zucchettiCompanyId: true,
        zucchettiLastSync: true,
        zucchettiTokenExpiry: true,
        zucchettiSyncErrors: true,
      },
    });

    if (!company) {
      return NextResponse.json({ configured: false });
    }

    const altaiConfigured = isAltaiConfigured();
    const authMode = getZucchettiAuthMode();
    const tokenExpired = company.zucchettiTokenExpiry
      ? company.zucchettiTokenExpiry < new Date()
      : true;

    // SQL Server direct connection info
    const sqlServerConfigured = isZucchettiSqlConfigured();
    const sqlCompanyKey = mapInmovaIdToCompanyKey(activeCompanyId);
    const sqlCompanyConfigured = sqlCompanyKey
      ? isZucchettiSqlConfigured(sqlCompanyKey)
      : false;
    const sqlConfiguredKeys = getConfiguredCompanyKeys();

    const isConfigured =
      company.zucchettiEnabled && (altaiConfigured || sqlServerConfigured);

    return NextResponse.json({
      configured: isConfigured,
      enabled: company.zucchettiEnabled,
      connected: company.zucchettiEnabled && !!company.zucchettiCompanyId && !tokenExpired,
      altaiConfigured,
      authMode,
      companyCode: company.zucchettiCompanyId,
      lastSync: company.zucchettiLastSync?.toISOString() || null,
      syncErrors: company.zucchettiSyncErrors,
      needsCredentials: company.zucchettiEnabled && !altaiConfigured && !sqlServerConfigured,
      // SQL Server direct connection
      sqlServer: {
        configured: sqlServerConfigured,
        companyKey: sqlCompanyKey,
        companyConfigured: sqlCompanyConfigured,
        configuredKeys: sqlConfiguredKeys,
      },
      features: [
        'Sincronización automática de asientos contables',
        'Lectura directa de contabilidad desde SQL Server',
        'Envío de facturas de alquiler',
        'Conciliación bancaria automática',
        'Plan General Contable (PGC) integrado',
        'Exportación de modelos fiscales (303, 390, 347)',
        'Sincronización bidireccional de clientes',
      ],
      message: company.zucchettiEnabled && !altaiConfigured && !sqlServerConfigured
        ? 'Zucchetti está habilitado para esta empresa pero las credenciales del servidor no están configuradas. Contacta con el administrador de la plataforma.'
        : !company.zucchettiEnabled
        ? 'Activa Zucchetti en la configuración de la empresa.'
        : sqlServerConfigured
        ? 'Integración activa. Conexión SQL Server configurada para lectura directa.'
        : 'Integración activa y funcionando.',
    });
  } catch (error) {
    logger.error('[Zucchetti Status]', error);
    return NextResponse.json({ configured: false });
  }
}
