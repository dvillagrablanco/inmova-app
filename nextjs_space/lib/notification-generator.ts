import { prisma } from './db';

interface NotificationParams {
  tipo: string;
  titulo: string;
  mensaje: string;
  prioridad: 'bajo' | 'medio' | 'alto';
  fechaLimite?: Date;
  entityId?: string;
  entityType?: string;
  userId?: string;
}

export async function createNotification(params: NotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        tipo: params.tipo as any,
        titulo: params.titulo,
        mensaje: params.mensaje,
        prioridad: params.prioridad,
        fechaLimite: params.fechaLimite,
        entityId: params.entityId,
        entityType: params.entityType,
        userId: params.userId,
      },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

export async function generateAutomaticNotifications() {
  const notifications: NotificationParams[] = [];
  const now = new Date();

  // 1. Contratos próximos a vencer (30, 60, 90 días)
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);
  const in60Days = new Date(now);
  in60Days.setDate(in60Days.getDate() + 60);
  const in90Days = new Date(now);
  in90Days.setDate(in90Days.getDate() + 90);

  const expiringContracts = await prisma.contract.findMany({
    where: {
      estado: 'activo',
      fechaFin: {
        lte: in90Days,
        gte: now,
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

  for (const contract of expiringContracts) {
    const daysUntilExpiry = Math.ceil(
      (new Date(contract.fechaFin).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    let prioridad: 'bajo' | 'medio' | 'alto' = 'bajo';
    if (daysUntilExpiry <= 30) prioridad = 'alto';
    else if (daysUntilExpiry <= 60) prioridad = 'medio';

    // Verificar si ya existe una notificación para este contrato
    const existingNotification = await prisma.notification.findFirst({
      where: {
        tipo: 'contrato_vencimiento',
        entityId: contract.id,
        leida: false,
      },
    });

    if (!existingNotification) {
      notifications.push({
        tipo: 'contrato_vencimiento',
        titulo: `Contrato próximo a vencer - ${contract.unit?.building?.nombre} ${contract.unit?.numero}`,
        mensaje: `El contrato de ${contract.tenant?.nombreCompleto} vence en ${daysUntilExpiry} días (${new Date(contract.fechaFin).toLocaleDateString('es-ES')}). Es necesario renovar o buscar nuevo inquilino.`,
        prioridad,
        fechaLimite: contract.fechaFin,
        entityId: contract.id,
        entityType: 'Contract',
      });
    }
  }

  // 2. Pagos atrasados
  const latePayments = await prisma.payment.findMany({
    where: {
      estado: 'atrasado',
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

  for (const payment of latePayments) {
    const daysLate = Math.ceil(
      (now.getTime() - new Date(payment.fechaVencimiento).getTime()) / (1000 * 60 * 60 * 24)
    );

    let prioridad: 'bajo' | 'medio' | 'alto' = 'medio';
    if (daysLate > 15) prioridad = 'alto';

    // Verificar si ya existe una notificación para este pago
    const existingNotification = await prisma.notification.findFirst({
      where: {
        tipo: 'pago_atrasado',
        entityId: payment.id,
        leida: false,
      },
    });

    if (!existingNotification) {
      notifications.push({
        tipo: 'pago_atrasado',
        titulo: `Pago atrasado - ${payment.contract?.unit?.building?.nombre} ${payment.contract?.unit?.numero}`,
        mensaje: `El pago de ${payment.contract?.tenant?.nombreCompleto} está atrasado ${daysLate} días. Monto: €${payment.monto.toLocaleString('es-ES')}. Período: ${payment.periodo}.`,
        prioridad,
        entityId: payment.id,
        entityType: 'Payment',
      });
    }
  }

  // 3. Mantenimientos urgentes
  const urgentMaintenance = await prisma.maintenanceRequest.findMany({
    where: {
      estado: { in: ['pendiente', 'en_progreso'] },
      prioridad: 'alta',
    },
    include: {
      unit: {
        include: {
          building: true,
        },
      },
    },
  });

  for (const maintenance of urgentMaintenance) {
    // Verificar si ya existe una notificación para este mantenimiento
    const existingNotification = await prisma.notification.findFirst({
      where: {
        tipo: 'mantenimiento_urgente',
        entityId: maintenance.id,
        leida: false,
      },
    });

    if (!existingNotification) {
      notifications.push({
        tipo: 'mantenimiento_urgente',
        titulo: `Mantenimiento urgente - ${maintenance.unit?.building?.nombre} ${maintenance.unit?.numero}`,
        mensaje: `Solicitud de mantenimiento urgente: ${maintenance.descripcion}. Estado: ${maintenance.estado}.`,
        prioridad: 'alto',
        entityId: maintenance.id,
        entityType: 'MaintenanceRequest',
      });
    }
  }

  // 4. Unidades vacantes por más de 30 días
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const vacantUnits = await prisma.unit.findMany({
    where: {
      estado: 'disponible',
      updatedAt: {
        lte: thirtyDaysAgo,
      },
    },
    include: {
      building: true,
    },
  });

  for (const unit of vacantUnits) {
    // Verificar si ya existe una notificación para esta unidad
    const existingNotification = await prisma.notification.findFirst({
      where: {
        tipo: 'unidad_vacante',
        entityId: unit.id,
        leida: false,
      },
    });

    if (!existingNotification) {
      const daysVacant = Math.ceil(
        (now.getTime() - new Date(unit.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      notifications.push({
        tipo: 'unidad_vacante',
        titulo: `Unidad vacante - ${unit.building?.nombre} ${unit.numero}`,
        mensaje: `La unidad lleva ${daysVacant} días vacante. Renta mensual: €${unit.rentaMensual.toLocaleString('es-ES')}. Considera estrategias de marketing.`,
        prioridad: daysVacant > 60 ? 'alto' : 'medio',
        entityId: unit.id,
        entityType: 'Unit',
      });
    }
  }

  // 5. Mantenimientos preventivos programados
  const in15Days = new Date(now);
  in15Days.setDate(in15Days.getDate() + 15);

  const scheduledMaintenance = await prisma.maintenanceSchedule.findMany({
    where: {
      activo: true,
      proximaFecha: {
        lte: in15Days,
        gte: now,
      },
    },
    include: {
      building: true,
      unit: {
        include: {
          building: true,
        },
      },
    },
  });

  for (const schedule of scheduledMaintenance) {
    const daysUntil = Math.ceil(
      (new Date(schedule.proximaFecha).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Verificar si ya existe una notificación para este mantenimiento
    const existingNotification = await prisma.notification.findFirst({
      where: {
        tipo: 'mantenimiento_preventivo',
        entityId: schedule.id,
        leida: false,
      },
    });

    if (!existingNotification) {
      let prioridad: 'bajo' | 'medio' | 'alto' = 'bajo';
      if (daysUntil <= 3) prioridad = 'alto';
      else if (daysUntil <= 7) prioridad = 'medio';

      const location = schedule.unit
        ? `${schedule.unit.building?.nombre || ''} - ${schedule.unit.numero}`
        : schedule.building?.nombre || 'General';

      notifications.push({
        tipo: 'mantenimiento_preventivo',
        titulo: `Mantenimiento preventivo programado - ${location}`,
        mensaje: `${schedule.titulo}: ${schedule.descripcion}. Programado para ${new Date(schedule.proximaFecha).toLocaleDateString('es-ES')} (en ${daysUntil} días).`,
        prioridad,
        fechaLimite: schedule.proximaFecha,
        entityId: schedule.id,
        entityType: 'MaintenanceSchedule',
      });
    }
  }

  // Crear todas las notificaciones
  const createdNotifications = [];
  for (const notif of notifications) {
    const created = await createNotification(notif);
    if (created) {
      createdNotifications.push(created);
    }
  }

  return createdNotifications;
}
