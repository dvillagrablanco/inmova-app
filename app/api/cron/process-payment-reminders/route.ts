import { NextRequest, NextResponse } from 'next/server';
import { processPaymentReminders } from '@/lib/payment-reminder-service';
import logger from '@/lib/logger';
import { requireCronSecret } from '@/lib/api-auth-guard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/process-payment-reminders
 * Endpoint para procesar recordatorios de pagos pendientes
 * Este endpoint debe ser llamado por un servicio de cron externo (diariamente)
 */
export async function GET(request: NextRequest) {
  // Cron auth guard
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;
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

    logger.info('Iniciando procesamiento de recordatorios de pago...');
    await processPaymentReminders();
    
    return NextResponse.json({
      success: true,
      message: 'Recordatorios de pago procesados correctamente',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error al procesar recordatorios de pago:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al procesar recordatorios de pago',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/process-payment-reminders
 * Alternativa con método POST
 */
export async function POST(request: NextRequest) {
  // Cron auth guard
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;
  return GET(request);
}
