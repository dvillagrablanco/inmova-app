/**
 * Servicio de Automatizaciones
 * 
 * Gestiona tareas automáticas programadas (CRON jobs):
 * - Cálculo mensual de comisiones para partners/comerciales
 * - Envío de notificaciones automáticas
 * - Generación de reportes programados
 * - Actualización de métricas y estadísticas
 */

import { prisma } from '@/lib/db';
import salesTeamService from './sales-team-service';
import { sendEmail } from '@/lib/email-service';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

import logger from '@/lib/logger';
// ====================================
// AUTOMATIZACIÓN DE COMISIONES
// ====================================

/**
 * Cálculo mensual automático de comisiones recurrentes
 * Esta función debe ejecutarse el día 1 de cada mes
 */
export async function calculateMonthlyCommissions() {
  try {
    console.log('[AUTOMATION] Iniciando cálculo de comisiones mensuales...');
    
    // Obtener el periodo anterior (mes que acaba de terminar)
    const lastMonth = subMonths(new Date(), 1);
    const periodo = format(lastMonth, 'yyyy-MM');
    
    console.log(`[AUTOMATION] Calculando comisiones para periodo: ${periodo}`);
    
    // Generar comisiones recurrentes
    const comisiones = await salesTeamService.generateRecurrentCommissions(periodo);
    
    console.log(`[AUTOMATION] Generadas ${comisiones.length} comisiones recurrentes`);
    
    // Procesar bonificaciones por objetivos cumplidos
    const bonificaciones = await salesTeamService.processBonifications(periodo);
    
    console.log(`[AUTOMATION] Generadas ${bonificaciones.length} bonificaciones por objetivos`);
    
    // Enviar notificaciones a los comerciales
    await notifyCommissionsGenerated(periodo, comisiones, bonificaciones);
    
    // Generar reporte de comisiones para administradores
    await generateCommissionsReport(periodo, comisiones, bonificaciones);
    
    return {
      success: true,
      periodo,
      comisionesGeneradas: comisiones.length,
      bonificacionesGeneradas: bonificaciones.length,
    };
  } catch (error) {
    logger.error('[AUTOMATION] Error al calcular comisiones:', error);
    throw error;
  }
}

/**
 * Notificar a comerciales sobre comisiones generadas
 */
async function notifyCommissionsGenerated(
  periodo: string,
  comisiones: any[],
  bonificaciones: any[]
) {
  try {
    // Agrupar comisiones por comercial
    const comercialesComisiones = new Map<string, any[]>();
    
    for (const comision of comisiones) {
      const salesRepId = comision.salesRepId;
      if (!comercialesComisiones.has(salesRepId)) {
        comercialesComisiones.set(salesRepId, []);
      }
      comercialesComisiones.get(salesRepId)!.push(comision);
    }
    
    // Añadir bonificaciones
    for (const bonificacion of bonificaciones) {
      const salesRepId = bonificacion.salesRepId;
      if (!comercialesComisiones.has(salesRepId)) {
        comercialesComisiones.set(salesRepId, []);
      }
      comercialesComisiones.get(salesRepId)!.push(bonificacion);
    }
    
    // Enviar email a cada comercial
    for (const [salesRepId, comisionesList] of comercialesComisiones) {
      const salesRep = await prisma.salesRepresentative.findUnique({
        where: { id: salesRepId },
      });
      
      if (!salesRep || !salesRep.email) continue;
      
      const totalComisiones = comisionesList.reduce(
        (sum, c) => sum + c.montoNeto,
        0
      );
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Comisiones Generadas - ${periodo}</h2>
          <p>Hola ${salesRep.nombre},</p>
          <p>Se han generado tus comisiones correspondientes al periodo <strong>${periodo}</strong>.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Resumen de Comisiones</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px;"><strong>Total de comisiones:</strong></td>
                <td style="text-align: right; padding: 8px;">${comisionesList.length}</td>
              </tr>
              <tr>
                <td style="padding: 8px;"><strong>Monto total:</strong></td>
                <td style="text-align: right; padding: 8px; font-size: 20px; color: #10b981; font-weight: bold;">
                  €${totalComisiones.toFixed(2)}
                </td>
              </tr>
            </table>
          </div>
          
          <h4>Detalle de Comisiones:</h4>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1;">Tipo</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1;">Descripción</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #cbd5e1;">Monto Neto</th>
              </tr>
            </thead>
            <tbody>
              ${comisionesList
                .map(
                  (c) => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px;">${c.tipo}</td>
                  <td style="padding: 10px;">${c.descripcion}</td>
                  <td style="padding: 10px; text-align: right; font-weight: bold;">€${c.montoNeto.toFixed(2)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <small style="color: #64748b;">
              Las comisiones estarán disponibles para aprobación y posterior pago según los términos acordados.
            </small>
          </p>
          
          <p style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal-comercial/comisiones" 
               style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Ver Mis Comisiones
            </a>
          </p>
        </div>
      `;
      
      await sendEmail({
        to: salesRep.email,
        subject: `💰 Comisiones Generadas - ${periodo}`,
        html: htmlContent,
      });
      
      console.log(`[AUTOMATION] Email enviado a ${salesRep.email}`);
    }
    
    console.log('[AUTOMATION] Notificaciones de comisiones enviadas exitosamente');
  } catch (error) {
    logger.error('[AUTOMATION] Error al enviar notificaciones:', error);
  }
}

/**
 * Generar reporte de comisiones para administradores
 */
async function generateCommissionsReport(
  periodo: string,
  comisiones: any[],
  bonificaciones: any[]
) {
  try {
    const totalComisiones = comisiones.reduce((sum, c) => sum + c.montoNeto, 0);
    const totalBonificaciones = bonificaciones.reduce((sum, b) => sum + b.montoNeto, 0);
    const totalGeneral = totalComisiones + totalBonificaciones;
    
    // Obtener administradores activos
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['administrador', 'super_admin'] },
      },
    });
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Reporte de Comisiones - ${periodo}</h2>
        <p>Se han generado las comisiones para el periodo ${periodo}.</p>
        
        <div style="display: flex; gap: 20px; margin: 30px 0;">
          <div style="flex: 1; background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">Comisiones Recurrentes</div>
            <div style="font-size: 28px; font-weight: bold; color: #4F46E5;">€${totalComisiones.toFixed(2)}</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${comisiones.length} comisiones</div>
          </div>
          
          <div style="flex: 1; background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">Bonificaciones</div>
            <div style="font-size: 28px; font-weight: bold; color: #10b981;">€${totalBonificaciones.toFixed(2)}</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${bonificaciones.length} bonificaciones</div>
          </div>
          
          <div style="flex: 1; background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">Total General</div>
            <div style="font-size: 28px; font-weight: bold; color: #0ea5e9;">€${totalGeneral.toFixed(2)}</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Total a pagar</div>
          </div>
        </div>
        
        <p style="margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/sales-team/commissions" 
             style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Revisar y Aprobar Comisiones
          </a>
        </p>
      </div>
    `;
    
    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: `📊 Reporte de Comisiones - ${periodo}`,
        html: htmlContent,
      });
    }
    
    console.log('[AUTOMATION] Reporte de comisiones enviado a administradores');
  } catch (error) {
    logger.error('[AUTOMATION] Error al generar reporte:', error);
  }
}

// ====================================
// AUTOMATIZACIÓN DE NOTIFICACIONES
// ====================================

/**
 * Enviar notificaciones de bienvenida a nuevos partners
 */
export async function sendPartnerWelcomeEmail(salesRepId: string) {
  try {
    const salesRep = await prisma.salesRepresentative.findUnique({
      where: { id: salesRepId },
    });
    
    if (!salesRep || !salesRep.email) return;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <h1 style="color: white; margin: 0; font-size: 32px;">¡Bienvenido a INMOVA Partners!</h1>
        </div>
        
        <div style="padding: 40px 20px;">
          <p>Hola <strong>${salesRep.nombre}</strong>,</p>
          
          <p>¡Bienvenido al Programa de Partners de INMOVA! Nos complace tenerte en nuestro equipo de comerciales.</p>
          
          <h3 style="color: #4F46E5; margin-top: 30px;">Tu Código de Referido:</h3>
          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <div style="font-size: 24px; font-weight: bold; color: #4F46E5; letter-spacing: 2px;">
              ${salesRep.codigoReferido}
            </div>
            <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
              Comparte este código con tus clientes potenciales
            </div>
          </div>
          
          <h3 style="color: #4F46E5; margin-top: 30px;">Tus Comisiones:</h3>
          <ul style="line-height: 1.8;">
            <li><strong>Comisión por Captación:</strong> €${salesRep.comisionCaptacion.toFixed(2)} por cliente nuevo</li>
            <li><strong>Comisión Recurrente:</strong> ${salesRep.comisionRecurrente}% mensual sobre MRR del cliente</li>
            <li><strong>Bonificación por Objetivos:</strong> €${salesRep.bonificacionObjetivo.toFixed(2)} al cumplir metas</li>
          </ul>
          
          <h3 style="color: #4F46E5; margin-top: 30px;">Tus Objetivos Mensuales:</h3>
          <ul style="line-height: 1.8;">
            <li>${salesRep.objetivoLeadsMes} Leads generados</li>
            <li>${salesRep.objetivoConversionesMes} Conversiones cerradas</li>
          </ul>
          
          <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 30px 0;">
            <strong>Consejo:</strong> Accede a tu portal de partner para ver materiales de marketing, tracking de leads y tus comisiones en tiempo real.
          </div>
          
          <p style="text-align: center; margin-top: 40px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal-comercial/login" 
               style="background: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Acceder a Mi Portal
            </a>
          </p>
          
          <p style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
            Si tienes alguna pregunta, contacta con nosotros en soporte@inmova.com
          </p>
        </div>
      </div>
    `;
    
    await sendEmail({
      to: salesRep.email,
      subject: '¡Bienvenido al Programa INMOVA Partners! 🎉',
      html: htmlContent,
    });
    
    console.log(`[AUTOMATION] Email de bienvenida enviado a ${salesRep.email}`);
  } catch (error) {
    logger.error('[AUTOMATION] Error al enviar email de bienvenida:', error);
  }
}

/**
 * Enviar recordatorio de objetivos mensuales
 */
export async function sendMonthlyGoalsReminder() {
  try {
    console.log('[AUTOMATION] Enviando recordatorios de objetivos mensuales...');
    
    const salesReps = await prisma.salesRepresentative.findMany({
      where: { activo: true, estado: 'ACTIVO' },
    });
    
    const today = new Date();
    const periodoActual = format(today, 'yyyy-MM');
    
    for (const salesRep of salesReps) {
      // Obtener objetivo actual
      const target = await prisma.salesTarget.findUnique({
        where: {
          salesRepId_periodo: {
            salesRepId: salesRep.id,
            periodo: periodoActual,
          },
        },
      });
      
      if (!target) continue;
      
      const leadsRestantes = target.objetivoLeads - target.leadsGenerados;
      const conversionesRestantes = target.objetivoConversiones - target.conversionesLogradas;
      
      if (leadsRestantes <= 0 && conversionesRestantes <= 0) continue; // Ya cumplió
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Recordatorio de Objetivos - ${periodoActual}</h2>
          <p>Hola ${salesRep.nombre},</p>
          <p>Este es un recordatorio de tus objetivos para este mes:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Progreso Actual</h3>
            
            <div style="margin: 15px 0;">
              <div style="font-size: 14px; color: #64748b; margin-bottom: 4px;">Leads Generados</div>
              <div style="background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background: #4F46E5; height: 100%; width: ${target.porcentajeLeads}%;"></div>
              </div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                ${target.leadsGenerados} / ${target.objetivoLeads} (${target.porcentajeLeads.toFixed(0)}%)
              </div>
            </div>
            
            <div style="margin: 15px 0;">
              <div style="font-size: 14px; color: #64748b; margin-bottom: 4px;">Conversiones</div>
              <div style="background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background: #10b981; height: 100%; width: ${target.porcentajeConversiones}%;"></div>
              </div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                ${target.conversionesLogradas} / ${target.objetivoConversiones} (${target.porcentajeConversiones.toFixed(0)}%)
              </div>
            </div>
          </div>
          
          ${leadsRestantes > 0 || conversionesRestantes > 0 ? `
            <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 20px 0;">
              <strong>¡Ánimo!</strong> Te quedan:
              ${leadsRestantes > 0 ? `<br/>- ${leadsRestantes} leads por generar` : ''}
              ${conversionesRestantes > 0 ? `<br/>- ${conversionesRestantes} conversiones por cerrar` : ''}
            </div>
          ` : ''}
          
          <p style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal-comercial/dashboard" 
               style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Ver Mi Dashboard
            </a>
          </p>
        </div>
      `;
      
      await sendEmail({
        to: salesRep.email,
        subject: `🎯 Recordatorio de Objetivos - ${periodoActual}`,
        html: htmlContent,
      });
    }
    
    console.log('[AUTOMATION] Recordatorios de objetivos enviados');
  } catch (error) {
    logger.error('[AUTOMATION] Error al enviar recordatorios:', error);
  }
}

// ====================================
// ACTUALIZACIÓN DE MÉTRICAS
// ====================================

/**
 * Actualizar métricas de todos los comerciales activos
 */
export async function updateAllSalesRepsMetrics() {
  try {
    console.log('[AUTOMATION] Actualizando métricas de comerciales...');
    
    const salesReps = await prisma.salesRepresentative.findMany({
      where: { activo: true },
    });
    
    for (const salesRep of salesReps) {
      await salesTeamService.updateSalesRepMetrics(salesRep.id);
      await salesTeamService.updateTargetProgress(salesRep.id);
    }
    
    console.log(`[AUTOMATION] Métricas actualizadas para ${salesReps.length} comerciales`);
  } catch (error) {
    logger.error('[AUTOMATION] Error al actualizar métricas:', error);
  }
}

// ====================================
// EXPORTAR FUNCIONES
// ====================================

export default {
  calculateMonthlyCommissions,
  sendPartnerWelcomeEmail,
  sendMonthlyGoalsReminder,
  updateAllSalesRepsMetrics,
};
