/**
 * Reminder Service
 * Servicio para generar y enviar recordatorios automáticos
 */

import { addDays, differenceInDays, isBefore, startOfDay } from 'date-fns';
import { sendEmail } from './email-config';
import logger, { logError } from '@/lib/logger';
import {
  paymentReminderEmail,
  contractExpirationEmail,
  maintenanceScheduledEmail,
} from './email-templates';
import { prisma } from './db';

// ============================================
// RECORDATORIOS DE PAGOS
// ============================================
export const sendPaymentReminders = async (companyId: string) => {
  const today = startOfDay(new Date());
  const in7Days = addDays(today, 7);
  const in3Days = addDays(today, 3);
  const tomorrow = addDays(today, 1);

  try {
    // Obtener datos de la empresa
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { nombre: true, email: true, telefono: true },
    });

    if (!company) {
      logger.error('Empresa no encontrada:', companyId);
      return { success: false, error: 'Empresa no encontrada' };
    }

    // Buscar pagos pendientes que vencen en 7, 3 o 1 días
    const pendingPayments = await prisma.payment.findMany({
      where: {
        estado: 'pendiente',
        fechaVencimiento: {
          gte: today,
          lte: in7Days,
        },
        contract: {
          unit: {
            building: {
              companyId,
            },
          },
        },
      },
      include: {
        contract: {
          include: {
            tenant: true,
            unit: {
              include: {
                building: true,
              },
            },
          },
        },
      },
    });

    let emailsSent = 0;
    let errors = 0;

    for (const payment of pendingPayments) {
      const daysUntilDue = differenceInDays(payment.fechaVencimiento, today);

      // Solo enviar recordatorios en días específicos (7, 3, 1)
      if (![7, 3, 1, 0].includes(daysUntilDue)) {
        continue;
      }

      // Verificar si ya enviamos un recordatorio hoy para este pago
      const notificationExists = await prisma.notification.findFirst({
        where: {
          companyId,
          tipo: 'pago_atrasado',
          entityId: payment.id,
          createdAt: {
            gte: today,
          },
        },
      });

      if (notificationExists) {
        continue; // Ya se envió recordatorio hoy
      }

      const emailTemplate = paymentReminderEmail({
        tenantName: payment.contract.tenant.nombreCompleto,
        periodo: payment.periodo,
        monto: payment.monto,
        fechaVencimiento: payment.fechaVencimiento,
        diasRestantes: daysUntilDue,
        unidad: payment.contract.unit.numero,
        edificio: payment.contract.unit.building.nombre,
        company: {
          nombre: company.nombre,
          email: company.email || undefined,
          telefono: company.telefono || undefined,
        },
      });

      const result = await sendEmail({
        to: payment.contract.tenant.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      if (result.success) {
        emailsSent++;

        // Crear notificación en el sistema
        await prisma.notification.create({
          data: {
            companyId,
            tipo: 'pago_atrasado',
            titulo: `Recordatorio: Pago ${payment.periodo}`,
            mensaje: `El pago de ${payment.monto.toFixed(2)}€ vence ${daysUntilDue === 0 ? 'hoy' : `en ${daysUntilDue} día${daysUntilDue > 1 ? 's' : ''}`}`,
            prioridad: daysUntilDue <= 1 ? 'alto' : daysUntilDue <= 3 ? 'medio' : 'bajo',
            entityId: payment.id,
            entityType: 'payment',
            userId: null, // Notificación global
            fechaLimite: payment.fechaVencimiento,
          },
        });
      } else {
        errors++;
        logger.error(
          `Error enviando recordatorio a ${payment.contract.tenant.email}:`,
          result.error
        );
      }
    }

    return {
      success: true,
      emailsSent,
      errors,
      message: `Recordatorios de pago enviados: ${emailsSent}, Errores: ${errors}`,
    };
  } catch (error) {
    logger.error('Error en sendPaymentReminders:', error);
    return { success: false, error };
  }
};

// ============================================
// ALERTAS DE CONTRATOS PRÓXIMOS A VENCER
// ============================================
export const sendContractExpirationAlerts = async (companyId: string) => {
  const today = startOfDay(new Date());
  const in60Days = addDays(today, 60);
  const in30Days = addDays(today, 30);

  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { nombre: true, email: true, telefono: true },
    });

    if (!company) {
      logger.error('Empresa no encontrada:', companyId);
      return { success: false, error: 'Empresa no encontrada' };
    }

    // Buscar contratos activos que vencen en 60 o 30 días
    const expiringContracts = await prisma.contract.findMany({
      where: {
        estado: 'activo',
        fechaFin: {
          gte: today,
          lte: in60Days,
        },
        unit: {
          building: {
            companyId,
          },
        },
      },
      include: {
        tenant: true,
        unit: {
          include: {
            building: true,
          },
        },
      },
    });

    let emailsSent = 0;
    let errors = 0;

    for (const contract of expiringContracts) {
      const daysUntilExpiration = differenceInDays(contract.fechaFin, today);

      // Solo enviar alertas en días específicos (60, 30)
      if (![60, 30].includes(daysUntilExpiration)) {
        continue;
      }

      // Verificar si ya enviamos una alerta hoy para este contrato
      const notificationExists = await prisma.notification.findFirst({
        where: {
          companyId,
          tipo: 'contrato_vencimiento',
          entityId: contract.id,
          createdAt: {
            gte: today,
          },
        },
      });

      if (notificationExists) {
        continue;
      }

      const emailTemplate = contractExpirationEmail({
        tenantName: contract.tenant.nombreCompleto,
        fechaFin: contract.fechaFin,
        diasRestantes: daysUntilExpiration,
        unidad: contract.unit.numero,
        edificio: contract.unit.building.nombre,
        rentaMensual: contract.rentaMensual,
        company: {
          nombre: company.nombre,
          email: company.email || undefined,
          telefono: company.telefono || undefined,
        },
      });

      const result = await sendEmail({
        to: contract.tenant.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      if (result.success) {
        emailsSent++;

        await prisma.notification.create({
          data: {
            companyId,
            tipo: 'contrato_vencimiento',
            titulo: `Contrato próximo a vencer`,
            mensaje: `El contrato de ${contract.tenant.nombreCompleto} vence en ${daysUntilExpiration} días`,
            prioridad: daysUntilExpiration <= 30 ? 'alto' : 'medio',
            entityId: contract.id,
            entityType: 'contract',
            userId: null,
            fechaLimite: contract.fechaFin,
          },
        });
      } else {
        errors++;
        logger.error(`Error enviando alerta a ${contract.tenant.email}:`, result.error);
      }
    }

    return {
      success: true,
      emailsSent,
      errors,
      message: `Alertas de contrato enviadas: ${emailsSent}, Errores: ${errors}`,
    };
  } catch (error) {
    logger.error('Error en sendContractExpirationAlerts:', error);
    return { success: false, error };
  }
};

// ============================================
// NOTIFICACIONES DE MANTENIMIENTO PROGRAMADO
// ============================================
export const sendMaintenanceNotifications = async (companyId: string) => {
  const today = startOfDay(new Date());
  const in3Days = addDays(today, 3);

  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { nombre: true, email: true, telefono: true },
    });

    if (!company) {
      logger.error('Empresa no encontrada:', companyId);
      return { success: false, error: 'Empresa no encontrada' };
    }

    // Buscar mantenimientos programados en los próximos 3 días
    const scheduledMaintenance = await prisma.maintenanceRequest.findMany({
      where: {
        estado: 'programado',
        fechaProgramada: {
          gte: today,
          lte: in3Days,
        },
        unit: {
          building: {
            companyId,
          },
        },
      },
      include: {
        unit: {
          include: {
            building: true,
            tenant: true,
          },
        },
        provider: true,
      },
    });

    let emailsSent = 0;
    let errors = 0;

    for (const maintenance of scheduledMaintenance) {
      if (!maintenance.unit.tenant || !maintenance.fechaProgramada) {
        continue;
      }

      const daysUntilMaintenance = differenceInDays(maintenance.fechaProgramada, today);

      // Solo enviar notificaciones en días específicos (3, 1)
      if (![3, 1].includes(daysUntilMaintenance)) {
        continue;
      }

      // Verificar si ya enviamos notificación hoy
      const notificationExists = await prisma.notification.findFirst({
        where: {
          companyId,
          tipo: 'mantenimiento_preventivo',
          entityId: maintenance.id,
          createdAt: {
            gte: today,
          },
        },
      });

      if (notificationExists) {
        continue;
      }

      const emailTemplate = maintenanceScheduledEmail({
        tenantName: maintenance.unit.tenant.nombreCompleto,
        titulo: maintenance.titulo,
        descripcion: maintenance.descripcion,
        fechaProgramada: maintenance.fechaProgramada,
        unidad: maintenance.unit.numero,
        edificio: maintenance.unit.building.nombre,
        proveedor: maintenance.provider?.nombre,
        company: {
          nombre: company.nombre,
          email: company.email || undefined,
          telefono: company.telefono || undefined,
        },
      });

      const result = await sendEmail({
        to: maintenance.unit.tenant.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      if (result.success) {
        emailsSent++;

        await prisma.notification.create({
          data: {
            companyId,
            tipo: 'mantenimiento_preventivo',
            titulo: `Mantenimiento programado: ${maintenance.titulo}`,
            mensaje: `Mantenimiento programado para ${maintenance.unit.building.nombre} - ${maintenance.unit.numero}`,
            prioridad: 'medio',
            entityId: maintenance.id,
            entityType: 'maintenancerequest',
            userId: null,
            fechaLimite: maintenance.fechaProgramada,
          },
        });
      } else {
        errors++;
        logger.error(
          `Error enviando notificación a ${maintenance.unit.tenant.email}:`,
          result.error
        );
      }
    }

    return {
      success: true,
      emailsSent,
      errors,
      message: `Notificaciones de mantenimiento enviadas: ${emailsSent}, Errores: ${errors}`,
    };
  } catch (error) {
    logger.error('Error en sendMaintenanceNotifications:', error);
    return { success: false, error };
  }
};

// ============================================
// FUNCIÓN PRINCIPAL PARA EJECUTAR TODOS LOS RECORDATORIOS
// ============================================
export const runAllReminders = async (companyId: string) => {
  logger.info(`\n🔔 Ejecutando recordatorios automáticos para empresa: ${companyId}`);

  const results = {
    paymentReminders: await sendPaymentReminders(companyId),
    contractAlerts: await sendContractExpirationAlerts(companyId),
    maintenanceNotifications: await sendMaintenanceNotifications(companyId),
  };

  logger.info('\n✅ Resultados de recordatorios:');
  logger.info('  - Recordatorios de pago:', results.paymentReminders.message);
  logger.info('  - Alertas de contratos:', results.contractAlerts.message);
  logger.info('  - Notificaciones de mantenimiento:', results.maintenanceNotifications.message);
  logger.info('\n');

  return results;
};
