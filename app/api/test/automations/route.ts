import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Endpoint de prueba para ejecutar y probar todas las automatizaciones
 * Solo disponible en desarrollo o para super_admin
 */
export async function GET(request: NextRequest) {
  try {
    // Validar que sea desarrollo o super_admin
    const isDevelopment = process.env.NODE_ENV === 'development';
    const session = await getServerSession(authOptions);
    
    if (!isDevelopment) {
      if (!session || session.user.role !== 'super_admin') {
        return NextResponse.json(
          { error: 'No autorizado. Este endpoint solo está disponible en desarrollo o para super_admin.' },
          { status: 403 }
        );
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    const cronSecret = process.env.CRON_SECRET;

    logger.info('Iniciando prueba de automatizaciones...');

    // Ejecutar todas las automatizaciones en paralelo
    const [contractRenewals, paymentReminders, preventiveMaintenance] = await Promise.allSettled([
      // Renovación de contratos
      fetch(`${baseUrl}/api/cron/process-contract-renewals`, {
        method: 'POST',
        headers: cronSecret ? { 'Authorization': `Bearer ${cronSecret}` } : {}
      }).then(async (res) => ({
        status: res.status,
        ok: res.ok,
        data: await res.json()
      })),

      // Recordatorios de pago
      fetch(`${baseUrl}/api/cron/process-payment-reminders`, {
        method: 'POST',
        headers: cronSecret ? { 'Authorization': `Bearer ${cronSecret}` } : {}
      }).then(async (res) => ({
        status: res.status,
        ok: res.ok,
        data: await res.json()
      })),

      // Mantenimiento preventivo
      fetch(`${baseUrl}/api/cron/process-preventive-maintenance`, {
        method: 'POST',
        headers: cronSecret ? { 'Authorization': `Bearer ${cronSecret}` } : {}
      }).then(async (res) => ({
        status: res.status,
        ok: res.ok,
        data: await res.json()
      }))
    ]);

    // Procesar resultados
    const results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      baseUrl,
      summary: {
        total: 3,
        exitosos: 0,
        fallidos: 0
      },
      automations: {
        contractRenewals: {
          name: 'Renovación de Contratos',
          status: contractRenewals.status === 'fulfilled' ? 'success' : 'error',
          ...(contractRenewals.status === 'fulfilled' 
            ? { result: contractRenewals.value }
            : { error: contractRenewals.reason?.message || 'Error desconocido' })
        },
        paymentReminders: {
          name: 'Recordatorios de Pago',
          status: paymentReminders.status === 'fulfilled' ? 'success' : 'error',
          ...(paymentReminders.status === 'fulfilled'
            ? { result: paymentReminders.value }
            : { error: paymentReminders.reason?.message || 'Error desconocido' })
        },
        preventiveMaintenance: {
          name: 'Mantenimiento Preventivo',
          status: preventiveMaintenance.status === 'fulfilled' ? 'success' : 'error',
          ...(preventiveMaintenance.status === 'fulfilled'
            ? { result: preventiveMaintenance.value }
            : { error: preventiveMaintenance.reason?.message || 'Error desconocido' })
        }
      },
      tips: [
        '🔑 Verifica que CRON_SECRET esté configurado en .env',
        '📧 Asegúrate de que las variables SMTP estén configuradas',
        '📅 Los datos de prueba deben tener contratos/pagos/mantenimiento próximos',
        '🔔 Revisa las notificaciones en /notificaciones para ver si se crearon',
        '📧 Revisa el email configurado en emailContacto de las empresas'
      ]
    };

    // Calcular resumen
    results.summary.exitosos = [
      results.automations.contractRenewals.status,
      results.automations.paymentReminders.status,
      results.automations.preventiveMaintenance.status
    ].filter(s => s === 'success').length;
    results.summary.fallidos = 3 - results.summary.exitosos;

    logger.info('Prueba de automatizaciones completada:', results.summary);

    return NextResponse.json(results, { status: 200 });

  } catch (error: any) {
    logger.error('Error en endpoint de prueba de automatizaciones:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al ejecutar automatizaciones de prueba',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
