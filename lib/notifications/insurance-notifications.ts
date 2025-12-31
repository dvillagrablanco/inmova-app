import { getPrismaClient } from '@/lib/db';
import nodemailer from 'nodemailer';

/**
 * Sistema de notificaciones de vencimiento de seguros
 * Se ejecuta vía cron job diario
 */

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface ExpiringInsurance {
  id: string;
  numeroPoliza: string;
  tipo: string;
  aseguradora: string;
  fechaVencimiento: Date;
  daysUntilExpiration: number;
  primaAnual: number;
  companyId: string;
  companyName: string;
  companyEmail: string;
}

export class InsuranceNotificationService {
  /**
   * Verificar seguros próximos a vencer y enviar notificaciones
   */
  static async checkExpiringInsurances(): Promise<void> {
    const prisma = getPrismaClient();

    try {
      // Fechas de corte para notificaciones
      const today = new Date();
      const in7Days = new Date(today);
      in7Days.setDate(today.getDate() + 7);

      const in30Days = new Date(today);
      in30Days.setDate(today.getDate() + 30);

      const in60Days = new Date(today);
      in60Days.setDate(today.getDate() + 60);

      // Buscar seguros próximos a vencer
      const expiringInsurances = await prisma.insurance.findMany({
        where: {
          estado: 'activa',
          fechaVencimiento: {
            gte: today,
            lte: in60Days,
          },
        },
        include: {
          company: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
        },
        orderBy: {
          fechaVencimiento: 'asc',
        },
      });

      console.log(`[Insurance Notifications] Found ${expiringInsurances.length} expiring policies`);

      // Agrupar por días restantes
      const notifications: ExpiringInsurance[] = expiringInsurances.map((insurance) => {
        const daysUntilExpiration = Math.ceil(
          (insurance.fechaVencimiento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          id: insurance.id,
          numeroPoliza: insurance.numeroPoliza,
          tipo: insurance.tipo,
          aseguradora: insurance.aseguradora,
          fechaVencimiento: insurance.fechaVencimiento,
          daysUntilExpiration,
          primaAnual: insurance.primaAnual || 0,
          companyId: insurance.companyId,
          companyName: insurance.company.nombre,
          companyEmail: insurance.company.email || '',
        };
      });

      // Enviar notificaciones según urgencia
      const urgentNotifications = notifications.filter((n) => n.daysUntilExpiration <= 7);
      const warningNotifications = notifications.filter(
        (n) => n.daysUntilExpiration > 7 && n.daysUntilExpiration <= 30
      );
      const reminderNotifications = notifications.filter(
        (n) => n.daysUntilExpiration > 30 && n.daysUntilExpiration <= 60
      );

      // Enviar notificaciones urgentes
      for (const notification of urgentNotifications) {
        await this.sendUrgentExpirationEmail(notification);
        await this.createInAppNotification(notification, 'URGENT');
      }

      // Enviar advertencias (solo una vez cuando falten exactamente 30 días)
      for (const notification of warningNotifications) {
        if (notification.daysUntilExpiration === 30) {
          await this.sendWarningExpirationEmail(notification);
          await this.createInAppNotification(notification, 'WARNING');
        }
      }

      // Enviar recordatorios (solo una vez cuando falten exactamente 60 días)
      for (const notification of reminderNotifications) {
        if (notification.daysUntilExpiration === 60) {
          await this.sendReminderExpirationEmail(notification);
          await this.createInAppNotification(notification, 'REMINDER');
        }
      }

      console.log(`[Insurance Notifications] Sent notifications:`);
      console.log(`- Urgent (≤7 days): ${urgentNotifications.length}`);
      console.log(
        `- Warning (30 days): ${warningNotifications.filter((n) => n.daysUntilExpiration === 30).length}`
      );
      console.log(
        `- Reminder (60 days): ${reminderNotifications.filter((n) => n.daysUntilExpiration === 60).length}`
      );
    } catch (error) {
      console.error('[Insurance Notifications Error]:', error);
      throw error;
    }
  }

  /**
   * Enviar email urgente (≤7 días)
   */
  private static async sendUrgentExpirationEmail(insurance: ExpiringInsurance): Promise<void> {
    if (!insurance.companyEmail) return;

    const subject = `⚠️ URGENTE: Seguro vence en ${insurance.daysUntilExpiration} días - ${insurance.numeroPoliza}`;

    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1>⚠️ Vencimiento Inminente de Seguro</h1>
          </div>
          <div style="padding: 20px;">
            <p>Estimado/a ${insurance.companyName},</p>
            
            <p><strong>Su póliza de seguro está próxima a vencer en ${insurance.daysUntilExpiration} días.</strong></p>
            
            <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Detalles de la Póliza:</h3>
              <ul>
                <li><strong>Número de Póliza:</strong> ${insurance.numeroPoliza}</li>
                <li><strong>Tipo:</strong> ${insurance.tipo}</li>
                <li><strong>Aseguradora:</strong> ${insurance.aseguradora}</li>
                <li><strong>Fecha de Vencimiento:</strong> ${insurance.fechaVencimiento.toLocaleDateString('es-ES')}</li>
                <li><strong>Prima Anual:</strong> €${insurance.primaAnual.toLocaleString()}</li>
              </ul>
            </div>
            
            <p><strong>Acción Requerida:</strong></p>
            <ul>
              <li>Contacte a su aseguradora inmediatamente para renovar</li>
              <li>Verifique que la cobertura sigue siendo adecuada</li>
              <li>Compare precios con otras aseguradoras si es necesario</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://inmovaapp.com/seguros/${insurance.id}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Ver Detalles del Seguro
              </a>
            </div>
            
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Este es un mensaje automático del sistema Inmova.
            </p>
          </div>
        </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@inmovaapp.com',
        to: insurance.companyEmail,
        subject,
        html,
      });

      console.log(
        `[Email Sent] Urgent notification to ${insurance.companyEmail} for policy ${insurance.numeroPoliza}`
      );
    } catch (error) {
      console.error('[Email Error]:', error);
    }
  }

  /**
   * Enviar email de advertencia (30 días)
   */
  private static async sendWarningExpirationEmail(insurance: ExpiringInsurance): Promise<void> {
    if (!insurance.companyEmail) return;

    const subject = `Recordatorio: Seguro vence en 30 días - ${insurance.numeroPoliza}`;

    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <div style="background-color: #f97316; color: white; padding: 20px; text-align: center;">
            <h1>Recordatorio de Vencimiento</h1>
          </div>
          <div style="padding: 20px;">
            <p>Estimado/a ${insurance.companyName},</p>
            
            <p>Le recordamos que su póliza de seguro vence en <strong>30 días</strong>.</p>
            
            <div style="background-color: #ffedd5; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Detalles:</h3>
              <ul>
                <li><strong>Póliza:</strong> ${insurance.numeroPoliza}</li>
                <li><strong>Vencimiento:</strong> ${insurance.fechaVencimiento.toLocaleDateString('es-ES')}</li>
                <li><strong>Aseguradora:</strong> ${insurance.aseguradora}</li>
              </ul>
            </div>
            
            <p>Es el momento ideal para:</p>
            <ul>
              <li>Revisar su cobertura actual</li>
              <li>Comparar opciones</li>
              <li>Negociar mejores condiciones</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://inmovaapp.com/seguros/${insurance.id}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Gestionar Seguro
              </a>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@inmovaapp.com',
        to: insurance.companyEmail,
        subject,
        html,
      });
    } catch (error) {
      console.error('[Email Error]:', error);
    }
  }

  /**
   * Enviar email de recordatorio (60 días)
   */
  private static async sendReminderExpirationEmail(insurance: ExpiringInsurance): Promise<void> {
    if (!insurance.companyEmail) return;

    const subject = `Aviso: Seguro vence en 60 días - ${insurance.numeroPoliza}`;

    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1>Aviso de Próximo Vencimiento</h1>
          </div>
          <div style="padding: 20px;">
            <p>Estimado/a ${insurance.companyName},</p>
            
            <p>Su póliza de seguro <strong>${insurance.numeroPoliza}</strong> vencerá en 2 meses.</p>
            
            <p>Este es un buen momento para planificar la renovación.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://inmovaapp.com/seguros" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Ver Mis Seguros
              </a>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@inmovaapp.com',
        to: insurance.companyEmail,
        subject,
        html,
      });
    } catch (error) {
      console.error('[Email Error]:', error);
    }
  }

  /**
   * Crear notificación in-app
   */
  private static async createInAppNotification(
    insurance: ExpiringInsurance,
    priority: 'URGENT' | 'WARNING' | 'REMINDER'
  ): Promise<void> {
    const prisma = getPrismaClient();

    try {
      const titles = {
        URGENT: `⚠️ Seguro vence en ${insurance.daysUntilExpiration} días`,
        WARNING: `Seguro vence en 30 días`,
        REMINDER: `Próximo vencimiento de seguro`,
      };

      const messages = {
        URGENT: `La póliza ${insurance.numeroPoliza} (${insurance.tipo}) vence el ${insurance.fechaVencimiento.toLocaleDateString('es-ES')}. Acción inmediata requerida.`,
        WARNING: `La póliza ${insurance.numeroPoliza} vence en 30 días. Considere iniciar el proceso de renovación.`,
        REMINDER: `La póliza ${insurance.numeroPoliza} vence en 60 días. Planifique la renovación con tiempo.`,
      };

      // Buscar usuarios de la empresa con permisos admin/gestor
      const users = await prisma.user.findMany({
        where: {
          companyId: insurance.companyId,
          role: {
            in: ['administrador', 'gestor', 'super_admin'],
          },
          activo: true,
        },
        select: { id: true },
      });

      // Crear notificaciones para cada usuario
      for (const user of users) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            titulo: titles[priority],
            mensaje: messages[priority],
            tipo: 'insurance_expiration',
            prioridad: priority === 'URGENT' ? 'alta' : priority === 'WARNING' ? 'media' : 'baja',
            leido: false,
            metadata: {
              insuranceId: insurance.id,
              policyNumber: insurance.numeroPoliza,
              expirationDate: insurance.fechaVencimiento,
              daysUntilExpiration: insurance.daysUntilExpiration,
            },
          },
        });
      }

      console.log(
        `[In-App Notification] Created ${users.length} notifications for policy ${insurance.numeroPoliza}`
      );
    } catch (error) {
      console.error('[In-App Notification Error]:', error);
    }
  }

  /**
   * Renovar automáticamente seguros configurados
   */
  static async autoRenewInsurances(): Promise<void> {
    const prisma = getPrismaClient();

    try {
      const today = new Date();
      const in7Days = new Date(today);
      in7Days.setDate(today.getDate() + 7);

      // Buscar seguros con renovación automática próximos a vencer
      const insurancesToRenew = await prisma.insurance.findMany({
        where: {
          renovacionAutomatica: true,
          estado: 'activa',
          fechaVencimiento: {
            gte: today,
            lte: in7Days,
          },
        },
      });

      console.log(`[Auto-Renewal] Found ${insurancesToRenew.length} policies to auto-renew`);

      for (const insurance of insurancesToRenew) {
        // Calcular nuevas fechas (1 año más)
        const newStartDate = new Date(insurance.fechaVencimiento);
        const newEndDate = new Date(newStartDate);
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);

        // Actualizar póliza
        await prisma.insurance.update({
          where: { id: insurance.id },
          data: {
            fechaInicio: newStartDate,
            fechaVencimiento: newEndDate,
            // Incrementar prima 3% (ajuste inflación)
            primaAnual: insurance.primaAnual ? insurance.primaAnual * 1.03 : undefined,
            primaMensual: insurance.primaMensual ? insurance.primaMensual * 1.03 : undefined,
          },
        });

        console.log(`[Auto-Renewal] Renewed policy ${insurance.numeroPoliza}`);

        // TODO: Enviar email confirmando renovación automática
      }
    } catch (error) {
      console.error('[Auto-Renewal Error]:', error);
      throw error;
    }
  }
}
