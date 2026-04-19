/**
 * GET /api/cron/zucchetti-full-sync
 *
 * Cron mensual de sincronización completa Zucchetti para el grupo Vidaro.
 * Programado en vercel.json o crontab del servidor.
 *
 * Ejecuta syncZucchettiGroupVidaro() para Rovida + Vidaro + Viroda.
 *
 * Auth: header `x-cron-secret` = `process.env.CRON_SECRET`
 *       o `Authorization: Bearer <CRON_SECRET>` (Vercel cron)
 */
import { NextRequest, NextResponse } from 'next/server';
import { syncZucchettiGroupVidaro } from '@/lib/zucchetti-full-sync-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // Sin secret configurado → bloquear
  const headerSecret = request.headers.get('x-cron-secret');
  const authHeader = request.headers.get('authorization');
  if (headerSecret === secret) return true;
  if (authHeader === `Bearer ${secret}`) return true;
  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  try {
    logger.info('[Cron Zucchetti FullSync] Iniciando sincronización grupo Vidaro');
    const results = await syncZucchettiGroupVidaro();
    const successful = results.filter((r) => r.success).length;
    const total = results.length;

    const summary = {
      success: successful === total,
      successful,
      total,
      durationMs: Date.now() - startedAt,
      societies: results.map((r) => ({
        companyKey: r.companyKey,
        success: r.success,
        durationMs: r.durationMs,
        apuntes: r.apuntes.created + r.apuntes.updated,
        treasury: r.treasury.created,
        iva: r.iva.created,
        terceros: r.terceros.created,
        balances: r.balances.persisted,
        errors:
          r.apuntes.errors +
          r.treasury.errors +
          r.iva.errors +
          r.terceros.errors,
        error: r.error,
      })),
    };

    logger.info(
      `[Cron Zucchetti FullSync] Completado: ${successful}/${total} sociedades en ${summary.durationMs}ms`
    );
    return NextResponse.json(summary);
  } catch (error: any) {
    logger.error('[Cron Zucchetti FullSync] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error en cron' },
      { status: 500 }
    );
  }
}
