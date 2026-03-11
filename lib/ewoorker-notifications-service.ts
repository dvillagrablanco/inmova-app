// @ts-nocheck
/**
 * Servicio de Notificaciones para eWoorker
 *
 * Gestiona notificaciones push, email y SMS específicas para:
 * - Nuevas obras en zona/especialidad
 * - Ofertas recibidas
 * - Actualizaciones de contratos
 * - Vencimiento de documentos
 *
 * @module EwoorkerNotificationsService
 */

import { prisma } from './db';
import logger from './logger';
import {
  sendPushNotification,
  sendPushNotificationToMany,
  NotificationPayload,
} from './push-notification-service';
import { enviarSMSDirecto } from './sms-service';
import nodemailer from 'nodemailer';

// ============================================================================
// TIPOS DE NOTIFICACIÓN EWOORKER
// ============================================================================

export type EwoorkerNotificationType =
  | 'NUEVA_OBRA_ZONA' // Nueva obra publicada en tu zona
  | 'NUEVA_OBRA_ESPECIALIDAD' // Nueva obra de tu especialidad
  | 'OFERTA_RECIBIDA' // Tu obra recibió una oferta
  | 'OFERTA_ACEPTADA' // Tu oferta fue aceptada
  | 'OFERTA_RECHAZADA' // Tu oferta fue rechazada
  | 'CONTRATO_CREADO' // Se creó un contrato
  | 'HITO_COMPLETADO' // Hito de pago completado
  | 'PAGO_RECIBIDO' // Pago recibido
  | 'DOCUMENTO_VENCIENDO' // Documento próximo a vencer
  | 'DOCUMENTO_VENCIDO' // Documento vencido
  | 'SOLICITUD_TRABAJADOR' // Solicitud de subcontratar trabajador
  | 'TRABAJADOR_ASIGNADO' // Trabajador asignado a contrato
  | 'NUEVA_VALORACION' // Nueva valoración recibida
  | 'VERIFICACION_APROBADA' // Empresa verificada
  | 'MENSAJE_OBRA'; // Nuevo mensaje en obra

export interface EwoorkerNotificationPayload {
  type: EwoorkerNotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  url?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

// ============================================================================
// PREFERENCIAS DE NOTIFICACIÓN
// ============================================================================

export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  sms: boolean;
  tipos: EwoorkerNotificationType[];
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  push: true,
  email: true,
  sms: false, // SMS solo para urgentes por defecto
  tipos: [
    'NUEVA_OBRA_ZONA',
    'NUEVA_OBRA_ESPECIALIDAD',
    'OFERTA_RECIBIDA',
    'OFERTA_ACEPTADA',
    'DOCUMENTO_VENCIENDO',
    'PAGO_RECIBIDO',
    'VERIFICACION_APROBADA',
  ],
};

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

class EwoorkerNotificationsService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initEmailTransporter();
  }

  private initEmailTransporter() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    }
  }

  // --------------------------------------------------------------------------
  // NOTIFICACIONES PUSH
  // --------------------------------------------------------------------------

  /**
   * Envía notificación push a usuario de ewoorker
   */
  async sendPushToUser(
    userId: string,
    notification: EwoorkerNotificationPayload
  ): Promise<{ sent: number; failed: number }> {
    try {
      const payload: NotificationPayload = {
        title: notification.title,
        body: notification.body,
        icon: '/ewoorker/icons/ewoorker-icon.png',
        badge: '/ewoorker/icons/badge.png',
        url: notification.url || '/ewoorker/dashboard',
        data: {
          ...notification.data,
          type: notification.type,
          timestamp: new Date().toISOString(),
        },
      };

      // Agregar acciones según tipo
      if (notification.type === 'OFERTA_RECIBIDA') {
        payload.actions = [
          { action: 'view', title: 'Ver Oferta' },
          { action: 'dismiss', title: 'Después' },
        ];
      } else if (notification.type === 'DOCUMENTO_VENCIENDO') {
        payload.actions = [
          { action: 'upload', title: 'Subir Documento' },
          { action: 'remind', title: 'Recordar' },
        ];
      }

      const result = await sendPushNotification(userId, payload, 'GENERAL');

      // Log de notificación ewoorker
      await this.logNotification(userId, notification, 'push', result.sent > 0);

      return result;
    } catch (error: any) {
      logger.error('[EwoorkerNotifications] Error enviando push:', error);
      return { sent: 0, failed: 1 };
    }
  }

  /**
   * Envía notificación push a empresas por zona y especialidad
   */
  async notifyNewObraToMatchingEmpresas(obra: {
    id: string;
    titulo: string;
    especialidad: string;
    provincia: string;
    presupuestoEstimado?: number;
  }): Promise<{ notified: number }> {
    try {
      // Buscar empresas con matching de zona y especialidad
      const empresasMatching = await prisma.ewoorkerPerfilEmpresa.findMany({
        where: {
          verificado: true,
          activo: true,
          OR: [
            { especialidadPrincipal: obra.especialidad },
            { especialidadesSecundarias: { has: obra.especialidad } },
          ],
          zonasOperacion: { has: obra.provincia },
        },
        include: {
          company: {
            include: {
              users: {
                where: { activo: true },
                select: { id: true },
              },
            },
          },
        },
      });

      const userIds = empresasMatching.flatMap((e) => e.company.users.map((u) => u.id));

      if (userIds.length === 0) {
        logger.info('[EwoorkerNotifications] No hay empresas matching para obra:', obra.id);
        return { notified: 0 };
      }

      const notification: EwoorkerNotificationPayload = {
        type: 'NUEVA_OBRA_ESPECIALIDAD',
        title: '🏗️ Nueva Obra en tu Zona',
        body: `${obra.titulo} - ${obra.especialidad} en ${obra.provincia}${
          obra.presupuestoEstimado ? ` (€${obra.presupuestoEstimado.toLocaleString()})` : ''
        }`,
        url: `/ewoorker/obras/${obra.id}`,
        priority: 'high',
        data: { obraId: obra.id },
      };

      const payload: NotificationPayload = {
        title: notification.title,
        body: notification.body,
        icon: '/ewoorker/icons/obra-icon.png',
        url: notification.url,
        data: notification.data,
        actions: [
          { action: 'view', title: 'Ver Obra' },
          { action: 'offer', title: 'Hacer Oferta' },
        ],
      };

      const result = await sendPushNotificationToMany(userIds, payload, 'GENERAL');

      logger.info(`[EwoorkerNotifications] Notificados ${result.sent} usuarios sobre nueva obra`);

      return { notified: result.sent };
    } catch (error: any) {
      logger.error('[EwoorkerNotifications] Error notificando nueva obra:', error);
      return { notified: 0 };
    }
  }

  // --------------------------------------------------------------------------
  // NOTIFICACIONES DE DOCUMENTOS (SMS/EMAIL)
  // --------------------------------------------------------------------------

  /**
   * Procesa alertas de documentos próximos a vencer
   * Se ejecuta diariamente via cron
   */
  async processDocumentAlerts(): Promise<{
    alertas30dias: number;
    alertas15dias: number;
    alertas7dias: number;
    vencidos: number;
  }> {
    const now = new Date();
    const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in15days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const results = {
      alertas30dias: 0,
      alertas15dias: 0,
      alertas7dias: 0,
      vencidos: 0,
    };

    try {
      // Documentos vencidos (no alertados hoy)
      const vencidos = await prisma.ewoorkerDocumento.findMany({
        where: {
          fechaCaducidad: { lt: now },
          estado: { not: 'RECHAZADO' },
          OR: [
            { fechaUltimaAlerta: null },
            { fechaUltimaAlerta: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
          ],
        },
        include: {
          perfilEmpresa: {
            include: {
              company: {
                include: {
                  users: {
                    where: { activo: true },
                    select: { id: true, email: true, telefono: true },
                  },
                },
              },
            },
          },
        },
      });

      for (const doc of vencidos) {
        await this.sendDocumentAlert(doc, 'VENCIDO');
        results.vencidos++;
      }

      // Documentos que vencen en 7 días
      const vencen7dias = await prisma.ewoorkerDocumento.findMany({
        where: {
          fechaCaducidad: { gte: now, lte: in7days },
          estado: { not: 'RECHAZADO' },
          OR: [
            { fechaUltimaAlerta: null },
            { fechaUltimaAlerta: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
          ],
        },
        include: {
          perfilEmpresa: {
            include: {
              company: {
                include: {
                  users: {
                    where: { activo: true },
                    select: { id: true, email: true, telefono: true },
                  },
                },
              },
            },
          },
        },
      });

      for (const doc of vencen7dias) {
        await this.sendDocumentAlert(doc, '7_DIAS');
        results.alertas7dias++;
      }

      // Documentos que vencen en 15 días (pero no en 7)
      const vencen15dias = await prisma.ewoorkerDocumento.findMany({
        where: {
          fechaCaducidad: { gt: in7days, lte: in15days },
          estado: { not: 'RECHAZADO' },
          OR: [
            { fechaUltimaAlerta: null },
            { fechaUltimaAlerta: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
          ],
        },
        include: {
          perfilEmpresa: {
            include: {
              company: {
                include: {
                  users: {
                    where: { activo: true },
                    select: { id: true, email: true, telefono: true },
                  },
                },
              },
            },
          },
        },
      });

      for (const doc of vencen15dias) {
        await this.sendDocumentAlert(doc, '15_DIAS');
        results.alertas15dias++;
      }

      // Documentos que vencen en 30 días (pero no en 15)
      const vencen30dias = await prisma.ewoorkerDocumento.findMany({
        where: {
          fechaCaducidad: { gt: in15days, lte: in30days },
          estado: { not: 'RECHAZADO' },
          OR: [
            { fechaUltimaAlerta: null },
            { fechaUltimaAlerta: { lt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000) } },
          ],
        },
        include: {
          perfilEmpresa: {
            include: {
              company: {
                include: {
                  users: {
                    where: { activo: true },
                    select: { id: true, email: true, telefono: true },
                  },
                },
              },
            },
          },
        },
      });

      for (const doc of vencen30dias) {
        await this.sendDocumentAlert(doc, '30_DIAS');
        results.alertas30dias++;
      }

      logger.info('[EwoorkerNotifications] Alertas de documentos procesadas:', results);
      return results;
    } catch (error: any) {
      logger.error('[EwoorkerNotifications] Error procesando alertas de documentos:', error);
      return results;
    }
  }

  /**
   * Envía alerta de documento específico
   */
  private async sendDocumentAlert(
    doc: any,
    tipo: 'VENCIDO' | '7_DIAS' | '15_DIAS' | '30_DIAS'
  ): Promise<void> {
    const diasTexto = {
      VENCIDO: 'ha vencido',
      '7_DIAS': 'vence en 7 días',
      '15_DIAS': 'vence en 15 días',
      '30_DIAS': 'vence en 30 días',
    };

    const tipoDoc = doc.tipo || 'Documento';
    const empresa = doc.perfilEmpresa?.company?.nombre || 'Tu empresa';
    const usuarios = doc.perfilEmpresa?.company?.users || [];

    // Notificación Push a todos los usuarios de la empresa
    for (const user of usuarios) {
      await this.sendPushToUser(user.id, {
        type: tipo === 'VENCIDO' ? 'DOCUMENTO_VENCIDO' : 'DOCUMENTO_VENCIENDO',
        title: tipo === 'VENCIDO' ? '⚠️ Documento Vencido' : '📄 Documento por Vencer',
        body: `${tipoDoc} ${diasTexto[tipo]}. Actualízalo para mantener tu perfil activo.`,
        url: '/ewoorker/compliance',
        priority: tipo === 'VENCIDO' || tipo === '7_DIAS' ? 'urgent' : 'high',
        data: { documentoId: doc.id, tipoDocumento: doc.tipo },
      });
    }

    // Email a usuarios con email
    const emailUsers = usuarios.filter((u: any) => u.email);
    if (emailUsers.length > 0 && this.transporter) {
      for (const user of emailUsers) {
        await this.sendDocumentAlertEmail(user.email, {
          tipoDocumento: tipoDoc,
          estado: tipo,
          empresa,
          fechaVencimiento: doc.fechaCaducidad,
        });
      }
    }

    // SMS para alertas urgentes (7 días o vencido)
    if ((tipo === 'VENCIDO' || tipo === '7_DIAS') && usuarios.some((u: any) => u.telefono)) {
      const usersWithPhone = usuarios.filter((u: any) => u.telefono);
      for (const user of usersWithPhone) {
        try {
          await enviarSMSDirecto(
            user.telefono,
            `[eWoorker] URGENTE: Tu ${tipoDoc} ${diasTexto[tipo]}. ` +
              `Actualízalo en inmovaapp.com/ewoorker/compliance para evitar suspensión.`
          );
        } catch (smsError) {
          logger.warn('[EwoorkerNotifications] Error enviando SMS:', smsError);
        }
      }
    }

    // Actualizar fecha de última alerta
    await prisma.ewoorkerDocumento.update({
      where: { id: doc.id },
      data: { fechaUltimaAlerta: new Date() },
    });
  }

  /**
   * Envía email de alerta de documento
   */
  private async sendDocumentAlertEmail(
    email: string,
    data: {
      tipoDocumento: string;
      estado: string;
      empresa: string;
      fechaVencimiento: Date;
    }
  ): Promise<void> {
    if (!this.transporter) return;

    const esVencido = data.estado === 'VENCIDO';
    const diasRestantes =
      data.estado === '7_DIAS'
        ? 7
        : data.estado === '15_DIAS'
          ? 15
          : data.estado === '30_DIAS'
            ? 30
            : 0;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: ${esVencido ? '#DC2626' : '#F59E0B'}; color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .alert-box { background: ${esVencido ? '#FEE2E2' : '#FEF3C7'}; border-left: 4px solid ${esVencido ? '#DC2626' : '#F59E0B'}; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .btn { display: inline-block; background: #2563EB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${esVencido ? '⚠️ Documento Vencido' : '📄 Documento por Vencer'}</h1>
    </div>
    <div class="content">
      <p>Hola,</p>
      <div class="alert-box">
        <strong>${data.tipoDocumento}</strong> de ${data.empresa} 
        ${
          esVencido
            ? `<span style="color: #DC2626;">ha vencido</span>`
            : `vence en <strong>${diasRestantes} días</strong> (${new Date(data.fechaVencimiento).toLocaleDateString('es-ES')})`
        }
      </div>
      <p>
        ${
          esVencido
            ? 'Tu perfil ha sido temporalmente suspendido hasta que actualices este documento.'
            : 'Para mantener tu perfil activo y seguir recibiendo ofertas, actualiza este documento antes de su vencimiento.'
        }
      </p>
      <p>
        <strong>Documentos que requieren renovación periódica:</strong>
      </p>
      <ul>
        <li>REA (Registro de Empresas Acreditadas)</li>
        <li>Seguro de Responsabilidad Civil</li>
        <li>TC1/TC2 (Certificados Seguridad Social)</li>
        <li>Certificado de estar al corriente con Hacienda</li>
      </ul>
      <center>
        <a href="https://inmovaapp.com/ewoorker/compliance" class="btn">
          Actualizar Documento
        </a>
      </center>
    </div>
    <div class="footer">
      <p>Este es un mensaje automático de eWoorker - Marketplace de Subcontratación</p>
      <p>© ${new Date().getFullYear()} eWoorker by Inmova</p>
    </div>
  </div>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'eWoorker <noreply@inmovaapp.com>',
        to: email,
        subject: esVencido
          ? `⚠️ URGENTE: Tu ${data.tipoDocumento} ha vencido - eWoorker`
          : `📄 Tu ${data.tipoDocumento} vence en ${diasRestantes} días - eWoorker`,
        html,
      });

      logger.debug('[EwoorkerNotifications] Email de alerta enviado a:', email);
    } catch (error: any) {
      logger.error('[EwoorkerNotifications] Error enviando email:', error);
    }
  }

  // --------------------------------------------------------------------------
  // NOTIFICACIONES ESPECÍFICAS
  // --------------------------------------------------------------------------

  /**
   * Notifica oferta recibida al propietario de la obra
   */
  async notifyOfertaRecibida(
    obraId: string,
    ofertaData: {
      empresaOfertante: string;
      monto: number;
      plazoEjecucion: number;
    }
  ): Promise<void> {
    try {
      const obra = await prisma.ewoorkerObra.findUnique({
        where: { id: obraId },
        include: {
          perfilEmpresa: {
            include: {
              company: {
                include: {
                  users: { where: { activo: true }, select: { id: true } },
                },
              },
            },
          },
        },
      });

      if (!obra) return;

      const userIds = obra.perfilEmpresa.company.users.map((u) => u.id);

      for (const userId of userIds) {
        await this.sendPushToUser(userId, {
          type: 'OFERTA_RECIBIDA',
          title: '💼 Nueva Oferta Recibida',
          body: `${ofertaData.empresaOfertante} ha ofertado €${ofertaData.monto.toLocaleString()} para "${obra.titulo}"`,
          url: `/ewoorker/obras/${obraId}`,
          priority: 'high',
          data: { obraId },
        });
      }
    } catch (error: any) {
      logger.error('[EwoorkerNotifications] Error notificando oferta:', error);
    }
  }

  /**
   * Notifica solicitud de trabajador
   */
  async notifySolicitudTrabajador(
    trabajadorId: string,
    solicitante: {
      empresaNombre: string;
      obraTitulo: string;
      fechaInicio: Date;
      duracionDias: number;
    }
  ): Promise<void> {
    try {
      const trabajador = await prisma.ewoorkerTrabajador.findUnique({
        where: { id: trabajadorId },
        include: {
          perfilEmpresa: {
            include: {
              company: {
                include: {
                  users: { where: { activo: true }, select: { id: true } },
                },
              },
            },
          },
        },
      });

      if (!trabajador) return;

      const userIds = trabajador.perfilEmpresa.company.users.map((u) => u.id);

      for (const userId of userIds) {
        await this.sendPushToUser(userId, {
          type: 'SOLICITUD_TRABAJADOR',
          title: '👷 Solicitud de Subcontratación',
          body: `${solicitante.empresaNombre} solicita a ${trabajador.nombre} para "${solicitante.obraTitulo}" (${solicitante.duracionDias} días)`,
          url: `/ewoorker/trabajadores`,
          priority: 'high',
          data: { trabajadorId, ...solicitante },
        });
      }
    } catch (error: any) {
      logger.error('[EwoorkerNotifications] Error notificando solicitud trabajador:', error);
    }
  }

  /**
   * Notifica verificación aprobada
   */
  async notifyVerificacionAprobada(perfilEmpresaId: string): Promise<void> {
    try {
      const perfil = await prisma.ewoorkerPerfilEmpresa.findUnique({
        where: { id: perfilEmpresaId },
        include: {
          company: {
            include: {
              users: { where: { activo: true }, select: { id: true, email: true } },
            },
          },
        },
      });

      if (!perfil) return;

      const userIds = perfil.company.users.map((u) => u.id);

      for (const userId of userIds) {
        await this.sendPushToUser(userId, {
          type: 'VERIFICACION_APROBADA',
          title: '✅ ¡Empresa Verificada!',
          body: `¡Felicidades! ${perfil.company.nombre} ahora es una empresa verificada en eWoorker. Tu perfil aparecerá destacado en las búsquedas.`,
          url: `/ewoorker/perfil`,
          priority: 'normal',
        });
      }

      // Email de bienvenida a verificados
      if (this.transporter) {
        for (const user of perfil.company.users.filter((u) => u.email)) {
          await this.sendVerificationEmail(user.email, perfil.company.nombre);
        }
      }
    } catch (error: any) {
      logger.error('[EwoorkerNotifications] Error notificando verificación:', error);
    }
  }

  private async sendVerificationEmail(email: string, empresaNombre: string): Promise<void> {
    if (!this.transporter) return;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 40px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .badge { display: inline-block; background: white; color: #10B981; padding: 8px 20px; border-radius: 20px; margin-top: 15px; font-weight: bold; }
    .content { padding: 30px; }
    .benefits { background: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .benefits ul { margin: 0; padding-left: 20px; }
    .benefits li { margin: 10px 0; color: #166534; }
    .btn { display: inline-block; background: #10B981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ ¡Verificación Completada!</h1>
      <div class="badge">EMPRESA VERIFICADA</div>
    </div>
    <div class="content">
      <p>Hola,</p>
      <p><strong>${empresaNombre}</strong> ahora es una empresa verificada en eWoorker.</p>
      <div class="benefits">
        <strong>Beneficios de tu verificación:</strong>
        <ul>
          <li>✅ Badge de verificación en tu perfil</li>
          <li>✅ Prioridad en resultados de búsqueda</li>
          <li>✅ Mayor confianza de contratistas</li>
          <li>✅ Acceso a obras premium</li>
          <li>✅ Soporte prioritario</li>
        </ul>
      </div>
      <center>
        <a href="https://inmovaapp.com/ewoorker/dashboard" class="btn">
          Ir a mi Dashboard
        </a>
      </center>
    </div>
  </div>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'eWoorker <noreply@inmovaapp.com>',
        to: email,
        subject: `✅ ¡${empresaNombre} es ahora una Empresa Verificada! - eWoorker`,
        html,
      });
    } catch (error: any) {
      logger.error('[EwoorkerNotifications] Error enviando email verificación:', error);
    }
  }

  // --------------------------------------------------------------------------
  // LOGGING
  // --------------------------------------------------------------------------

  private async logNotification(
    userId: string,
    notification: EwoorkerNotificationPayload,
    channel: 'push' | 'email' | 'sms',
    success: boolean
  ): Promise<void> {
    try {
      await prisma.ewoorkerLogSocio.create({
        data: {
          action: `NOTIFICATION_${notification.type}`,
          userId,
          userName: 'System',
          details: JSON.stringify({
            channel,
            title: notification.title,
            success,
            timestamp: new Date().toISOString(),
          }),
        },
      });
    } catch (error) {
      // No fallar si el log falla
    }
  }
}

// Exportar instancia singleton
export const ewoorkerNotifications = new EwoorkerNotificationsService();

export default ewoorkerNotifications;
