import { NextRequest, NextResponse } from 'next/server';
import { processRenewalAlerts } from '@/lib/contract-renewal-service';
import logger from '@/lib/logger';
import { authorizeCronRequest } from '@/lib/cron-auth';
import { requireCronSecret } from '@/lib/api-auth-guard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/process-contract-renewals
 * Endpoint para procesar alertas de renovación de contratos
 * Este endpoint debe ser llamado por un servicio de cron externo (diariamente)
 */
export async function GET(request: NextRequest) {
  // Cron auth guard
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;
  // Cron auth guard (auditoria V2)
  const cronAuth = await authorizeCronRequest(request as any);
  if (!cronAuth.authorized) {
  // Cron auth guard
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;
    return NextResponse.json({ error: cronAuth.error || 'No autorizado' }, { status: cronAuth.status });
  }

  try {
    // Validar token de autenticación para cron (opcional pero recomendado)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Si hay un secret configurado, validarlo
    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        );
      }
    }

    logger.info('Iniciando procesamiento de renovación de contratos...');
    await processRenewalAlerts();
    
    return NextResponse.json({
      success: true,
      message: 'Alertas de renovación procesadas correctamente',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error al procesar renovación de contratos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al procesar renovación de contratos',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/process-contract-renewals
 * Alternativa con método POST
 */
export async function POST(request: NextRequest) {
  // Cron auth guard
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;
  // Cron auth guard (auditoria V2)
  const cronAuth = await authorizeCronRequest(request as any);
  if (!cronAuth.authorized) {
  // Cron auth guard
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;
    return NextResponse.json({ error: cronAuth.error || 'No autorizado' }, { status: cronAuth.status });
  }

  return GET(request);
}
