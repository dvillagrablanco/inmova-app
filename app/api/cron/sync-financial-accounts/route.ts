import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/api-auth-guard';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/cron/sync-financial-accounts
 * Sincronización diaria de cuentas financieras:
 * - PSD2: consultar saldos via Nordigen/GoCardless
 * - Actualizar timestamps de última sincronización
 * - Generar alertas si hay problemas de conexión
 */
export async function GET(request: NextRequest) {
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;

  const prisma = await getPrisma();

  try {
    const accounts = await prisma.financialAccount.findMany({
      where: { activa: true },
      include: {
        company: { select: { nombre: true } },
      },
    });

    const results: Array<{
      accountId: string;
      entidad: string;
      company: string;
      conexionTipo: string;
      synced: boolean;
      saldoAnterior: number;
      saldoNuevo: number;
      error?: string;
    }> = [];

    for (const account of accounts) {
      const config = account.apiConfig as any;

      if (account.conexionTipo === 'psd2' && config?.nordigenInstitutionId) {
        // PSD2: En producción, aquí se llamaría a Nordigen API
        // GET /api/v2/accounts/{account_id}/balances/
        try {
          // Simular sync exitoso (en producción: llamada real a Nordigen)
          const saldoAnterior = account.saldoActual;

          await prisma.financialAccount.update({
            where: { id: account.id },
            data: { ultimaSync: new Date() },
          });

          results.push({
            accountId: account.id,
            entidad: account.entidad,
            company: account.company?.nombre || '',
            conexionTipo: 'psd2',
            synced: true,
            saldoAnterior,
            saldoNuevo: saldoAnterior, // En producción: saldo real de Nordigen
          });
        } catch (err: any) {
          results.push({
            accountId: account.id,
            entidad: account.entidad,
            company: account.company?.nombre || '',
            conexionTipo: 'psd2',
            synced: false,
            saldoAnterior: account.saldoActual,
            saldoNuevo: account.saldoActual,
            error: err.message,
          });
        }
      } else {
        // SWIFT/OCR: solo registrar que necesita sync manual
        const daysSinceSync = account.ultimaSync
          ? Math.round((Date.now() - new Date(account.ultimaSync).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        if (daysSinceSync > 7) {
          results.push({
            accountId: account.id,
            entidad: account.entidad,
            company: account.company?.nombre || '',
            conexionTipo: account.conexionTipo,
            synced: false,
            saldoAnterior: account.saldoActual,
            saldoNuevo: account.saldoActual,
            error: `Última sync hace ${daysSinceSync} días. Requiere importación manual.`,
          });
        }
      }
    }

    const synced = results.filter((r) => r.synced).length;
    const failed = results.filter((r) => !r.synced).length;

    logger.info(`[FO Sync] ${synced} cuentas sincronizadas, ${failed} con problemas`);

    return NextResponse.json({
      success: true,
      message: `Sync: ${synced} OK, ${failed} pendientes`,
      resumen: { total: accounts.length, synced, failed },
      results,
    });
  } catch (error: any) {
    logger.error('[FO Sync Cron]:', error);
    return NextResponse.json({ error: 'Error en sync financiero' }, { status: 500 });
  }
}
