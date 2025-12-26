import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email-config';
import logger from '@/lib/logger';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

/**
 * Procesa y notifica sobre tareas de mantenimiento preventivo próximas
 */
async function processPreventiveMaintenance() {
  const today = new Date();
  const next7Days = addDays(today, 7);
  const next3Days = addDays(today, 3);

  // Obtener todas las tareas programadas que están próximas
  const schedules = await prisma.maintenanceSchedule.findMany({
    where: {
      activo: true,
      AND: [{ proximaFecha: { lte: next7Days } }, { proximaFecha: { gte: today } }],
    },
    include: {
      building: {
        include: {
          company: true,
        },
      },
    },
  });

  const results = {
    total: schedules.length,
    notificadas: 0,
    errores: 0,
    detalles: [] as any[],
  };

  for (const schedule of schedules) {
    try {
      const diasRestantes = Math.ceil(
        (schedule.proximaFecha.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      let prioridad: 'alto' | 'medio' | 'bajo' = 'bajo';
      let urgencia = '';

      if (diasRestantes <= 1) {
        prioridad = 'alto';
        urgencia = '¡URGENTE! ';
      } else if (diasRestantes <= 3) {
        prioridad = 'alto';
        urgencia = 'IMPORTANTE: ';
      } else if (diasRestantes <= 7) {
        prioridad = 'medio';
      }

      // Skip if building is null
      if (!schedule.building) {
        continue;
      }

      // Crear notificación en el sistema
      await prisma.notification.create({
        data: {
          companyId: schedule.building.companyId,
          titulo: `${urgencia}Mantenimiento Preventivo Próximo`,
          mensaje: `La tarea "${schedule.titulo}" está programada para ${format(schedule.proximaFecha, "d 'de' MMMM", { locale: es })} (en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}). Edificio: ${schedule.building.nombre}.`,
          tipo: prioridad === 'alto' ? 'mantenimiento_urgente' : 'mantenimiento_preventivo',
          prioridad,
          entityType: 'MaintenanceSchedule',
          entityId: schedule.id,
        },
      });

      // Enviar email al contacto del edificio o administradores
      if (schedule.building?.company?.emailContacto) {
        try {
          await sendEmail({
            to: schedule.building.company.emailContacto,
            subject: `${urgencia}Mantenimiento Preventivo Próximo - ${schedule.titulo}`,
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                    .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 32px 24px; text-align: center; }
                    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
                    .content { padding: 32px 24px; }
                    .alert-badge { display: inline-block; padding: 8px 16px; background-color: ${prioridad === 'alto' ? '#FEE2E2' : '#FEF3C7'}; color: ${prioridad === 'alto' ? '#991B1B' : '#92400E'}; border-radius: 6px; font-weight: 600; font-size: 14px; margin-bottom: 16px; }
                    .info-box { background-color: #F3F4F6; border-left: 4px solid #4F46E5; padding: 16px; margin: 20px 0; border-radius: 6px; }
                    .info-box strong { color: #4F46E5; }
                    .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
                    .footer { background-color: #F9FAFB; padding: 20px 24px; text-align: center; font-size: 12px; color: #6B7280; border-top: 1px solid #E5E7EB; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>🛠️ INMOVA - Mantenimiento Preventivo</h1>
                    </div>
                    <div class="content">
                      <div class="alert-badge">${urgencia}ACCIÓN REQUERIDA</div>
                      <h2 style="color: #1F2937; margin-top: 0;">Tarea de Mantenimiento Próxima</h2>
                      <p>Le informamos que tiene una tarea de mantenimiento preventivo programada que requiere su atención:</p>
                      
                      <div class="info-box">
                        <p style="margin: 8px 0;"><strong>Tarea:</strong> ${schedule.titulo}</p>
                        <p style="margin: 8px 0;"><strong>Edificio:</strong> ${schedule.building.nombre}</p>
                        <p style="margin: 8px 0;"><strong>Fecha Programada:</strong> ${format(schedule.proximaFecha, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</p>
                        <p style="margin: 8px 0;"><strong>Días Restantes:</strong> ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}</p>
                        ${schedule.descripcion ? `<p style="margin: 8px 0;"><strong>Descripción:</strong> ${schedule.descripcion}</p>` : ''}
                        <p style="margin: 8px 0;"><strong>Frecuencia:</strong> ${schedule.frecuencia === 'mensual' ? 'Mensual' : schedule.frecuencia === 'trimestral' ? 'Trimestral' : schedule.frecuencia === 'semestral' ? 'Semestral' : 'Anual'}</p>
                      </div>

                      <p style="color: #6B7280; font-size: 14px; margin-top: 24px;">
                        ${prioridad === 'alto' ? '⚠️ <strong>Es importante que coordine esta tarea con anticipación para evitar interrupciones en el servicio.</strong>' : 'Por favor, coordine esta tarea con el proveedor correspondiente.'}
                      </p>

                      <div style="text-align: center;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://inmova.app'}/mantenimiento-preventivo" class="button">Ver Detalles en INMOVA</a>
                      </div>
                    </div>
                    <div class="footer">
                      <p style="margin: 8px 0;">Este es un mensaje automático del sistema INMOVA.</p>
                      <p style="margin: 8px 0;">© ${new Date().getFullYear()} INMOVA - Gestión Inmobiliaria Inteligente</p>
                    </div>
                  </div>
                </body>
              </html>
            `,
          });
          results.notificadas++;
        } catch (emailError) {
          logger.error('Error al enviar email de mantenimiento preventivo:', emailError);
          results.errores++;
        }
      }

      results.detalles.push({
        id: schedule.id,
        titulo: schedule.titulo,
        edificio: schedule.building.nombre,
        diasRestantes,
        prioridad,
        notificada: true,
      });
    } catch (error) {
      logger.error(`Error al procesar mantenimiento preventivo ${schedule.id}:`, error);
      results.errores++;
      results.detalles.push({
        id: schedule.id,
        error: (error as Error).message,
      });
    }
  }

  logger.info('Procesamiento de mantenimiento preventivo completado:', results);
  return results;
}

/**
 * GET /api/cron/process-preventive-maintenance
 * Endpoint para procesar notificaciones de mantenimiento preventivo
 * Este endpoint debe ser llamado por un servicio de cron externo (diariamente)
 */
export async function GET(request: NextRequest) {
  try {
    // Validar token de autenticación para cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
    }

    logger.info('Iniciando procesamiento de mantenimiento preventivo...');
    const results = await processPreventiveMaintenance();

    return NextResponse.json({
      success: true,
      message: 'Mantenimiento preventivo procesado correctamente',
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error: any) {
    logger.error('Error al procesar mantenimiento preventivo:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al procesar mantenimiento preventivo',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/process-preventive-maintenance
 * Alternativa con método POST
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
