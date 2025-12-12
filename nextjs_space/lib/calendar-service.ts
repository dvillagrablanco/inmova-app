/**
 * Servicio de Calendario Unificado
 * Gestiona todos los eventos del sistema en un calendario centralizado
 */

import { prisma } from './db';
import type {CalendarEventType, CalendarEventPriority } from '@prisma/client';
import { addDays, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import logger, { logError } from '@/lib/logger';

export interface EventoCalendario {
  id: string;
  titulo: string;
  descripcion?: string;
  tipo: CalendarEventType;
  prioridad: CalendarEventPriority;
  fechaInicio: Date;
  fechaFin?: Date;
  todoElDia: boolean;
  ubicacion?: string;
  color?: string;
  buildingId?: string;
  unitId?: string;
  tenantId?: string;
  contractId?: string;
  paymentId?: string;
  maintenanceRequestId?: string;
  visitId?: string;
  inspectionId?: string;
}

/**
 * Sincroniza automáticamente los eventos del calendario basados en las entidades existentes
 */
export async function sincronizarEventosAutomaticos(companyId: string) {
  logger.info('🔄 Sincronizando eventos automáticos del calendario...');

  // Obtener la fecha actual y rangos
  const hoy = new Date();
  const inicioMes = startOfMonth(hoy);
  const finPeriodo = addMonths(endOfMonth(hoy), 3); // 3 meses adelante

  try {
    // 1. PAGOS PENDIENTES - Crear eventos para pagos vencidos y próximos
    await sincronizarEventosPagos(companyId, hoy, finPeriodo);

    // 2. VENCIMIENTOS DE CONTRATOS - Alertar 60 días antes
    await sincronizarEventosVencimientoContratos(companyId, hoy, finPeriodo);

    // 3. MANTENIMIENTOS PROGRAMADOS
    await sincronizarEventosMantenimiento(companyId, hoy, finPeriodo);

    // 4. VISITAS PROGRAMADAS
    await sincronizarEventosVisitas(companyId, hoy, finPeriodo);

    // 5. INSPECCIONES
    await sincronizarEventosInspecciones(companyId, hoy, finPeriodo);

    logger.info('✅ Sincronización completada');
    return { success: true, message: 'Eventos sincronizados correctamente' };
  } catch (error) {
    logger.error('❌ Error sincronizando eventos:', error);
    throw error;
  }
}

/**
 * Sincroniza eventos de pagos pendientes
 */
async function sincronizarEventosPagos(companyId: string, inicio: Date, fin: Date) {
  const payments = await prisma.payment.findMany({
    where: {
      contract: {
        unit: {
          building: {
            companyId
          }
        }
      },
      estado: 'pendiente',
      fechaVencimiento: {
        gte: inicio,
        lte: fin
      }
    },
    include: {
      contract: {
        include: {
          unit: {
            include: {
              building: true
            }
          },
          tenant: true
        }
      }
    }
  });

  for (const payment of payments) {
    // Verificar si ya existe un evento para este pago
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        companyId,
        paymentId: payment.id,
        tipo: 'pago'
      }
    });

    if (!existingEvent) {
      const diasHastaVencimiento = Math.ceil(
        (payment.fechaVencimiento.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      const prioridad: CalendarEventPriority = diasHastaVencimiento < 0 
        ? 'critica' 
        : diasHastaVencimiento <= 3 
        ? 'alta' 
        : diasHastaVencimiento <= 7 
        ? 'media' 
        : 'baja';

      await prisma.calendarEvent.create({
        data: {
          companyId,
          titulo: `Pago de renta - ${payment.contract.tenant.nombreCompleto}`,
          descripcion: `Pago de €${payment.monto.toFixed(2)} correspondiente al periodo ${payment.periodo}\nEdificio: ${payment.contract.unit.building.nombre}\nUnidad: ${payment.contract.unit.numero}`,
          tipo: 'pago',
          prioridad,
          fechaInicio: payment.fechaVencimiento,
          todoElDia: true,
          ubicacion: `${payment.contract.unit.building.nombre} - Unidad ${payment.contract.unit.numero}`,
          color: diasHastaVencimiento < 0 ? '#dc2626' : diasHastaVencimiento <= 3 ? '#f59e0b' : '#10b981',
          buildingId: payment.contract.unit.buildingId,
          unitId: payment.contract.unitId,
          tenantId: payment.contract.tenantId,
          contractId: payment.contractId,
          paymentId: payment.id,
          recordatorioActivo: true,
          recordatorioMinutos: 1440, // 24 horas antes
          creadoPor: 'sistema'
        }
      });
    }
  }
}

/**
 * Sincroniza eventos de vencimiento de contratos
 */
async function sincronizarEventosVencimientoContratos(companyId: string, inicio: Date, fin: Date) {
  const fechaAlerta = addDays(new Date(), 60); // Alertar 60 días antes

  const contracts = await prisma.contract.findMany({
    where: {
      unit: {
        building: {
          companyId
        }
      },
      estado: 'activo',
      fechaFin: {
        gte: inicio,
        lte: fin
      }
    },
    include: {
      unit: {
        include: {
          building: true
        }
      },
      tenant: true
    }
  });

  for (const contract of contracts) {
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        companyId,
        contractId: contract.id,
        tipo: 'vencimiento'
      }
    });

    if (!existingEvent) {
      const diasHastaVencimiento = Math.ceil(
        (contract.fechaFin.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      const prioridad: CalendarEventPriority = diasHastaVencimiento <= 30 
        ? 'alta' 
        : diasHastaVencimiento <= 60 
        ? 'media' 
        : 'baja';

      await prisma.calendarEvent.create({
        data: {
          companyId,
          titulo: `Vencimiento de contrato - ${contract.tenant.nombreCompleto}`,
          descripcion: `El contrato finaliza el ${contract.fechaFin.toLocaleDateString('es-ES')}\nEdificio: ${contract.unit.building.nombre}\nUnidad: ${contract.unit.numero}\nRenta: €${contract.rentaMensual.toFixed(2)}`,
          tipo: 'vencimiento',
          prioridad,
          fechaInicio: contract.fechaFin,
          todoElDia: true,
          ubicacion: `${contract.unit.building.nombre} - Unidad ${contract.unit.numero}`,
          color: diasHastaVencimiento <= 30 ? '#dc2626' : '#f59e0b',
          buildingId: contract.unit.buildingId,
          unitId: contract.unitId,
          tenantId: contract.tenantId,
          contractId: contract.id,
          recordatorioActivo: true,
          recordatorioMinutos: 10080, // 7 días antes
          creadoPor: 'sistema'
        }
      });
    }
  }
}

/**
 * Sincroniza eventos de mantenimiento
 */
async function sincronizarEventosMantenimiento(companyId: string, inicio: Date, fin: Date) {
  const maintenanceRequests = await prisma.maintenanceRequest.findMany({
    where: {
      unit: {
        building: {
          companyId
        }
      },
      estado: {
        in: ['pendiente', 'en_progreso']
      },
      fechaProgramada: {
        gte: inicio,
        lte: fin
      }
    },
    include: {
      unit: {
        include: {
          building: true
        }
      },
      provider: true
    }
  });

  for (const maintenance of maintenanceRequests) {
    if (!maintenance.fechaProgramada) continue;

    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        companyId,
        maintenanceRequestId: maintenance.id,
        tipo: 'mantenimiento'
      }
    });

    if (!existingEvent) {
      const prioridadMap: Record<string, CalendarEventPriority> = {
        'urgente': 'critica',
        'alta': 'alta',
        'media': 'media',
        'baja': 'baja'
      };

      const colorMap: Record<string, string> = {
        'urgente': '#dc2626',
        'alta': '#f59e0b',
        'media': '#3b82f6',
        'baja': '#10b981'
      };

      await prisma.calendarEvent.create({
        data: {
          companyId,
          titulo: `Mantenimiento: ${maintenance.titulo}`,
          descripcion: `${maintenance.descripcion}\nEdificio: ${maintenance.unit.building.nombre}\nUnidad: ${maintenance.unit.numero}${maintenance.provider ? `\nProveedor: ${maintenance.provider.nombre}` : ''}${maintenance.costoEstimado ? `\nCosto estimado: €${maintenance.costoEstimado.toFixed(2)}` : ''}`,
          tipo: 'mantenimiento',
          prioridad: prioridadMap[maintenance.prioridad] || 'media',
          fechaInicio: maintenance.fechaProgramada,
          fechaFin: maintenance.fechaProgramada,
          todoElDia: false,
          ubicacion: `${maintenance.unit.building.nombre} - Unidad ${maintenance.unit.numero}`,
          color: colorMap[maintenance.prioridad] || '#3b82f6',
          buildingId: maintenance.unit.buildingId,
          unitId: maintenance.unitId,
          maintenanceRequestId: maintenance.id,
          recordatorioActivo: true,
          recordatorioMinutos: 1440, // 24 horas antes
          creadoPor: 'sistema'
        }
      });
    }
  }
}

/**
 * Sincroniza eventos de visitas
 */
async function sincronizarEventosVisitas(companyId: string, inicio: Date, fin: Date) {
  const visits = await prisma.visit.findMany({
    where: {
      candidate: {
        unit: {
          building: {
            companyId
          }
        }
      },
      fechaVisita: {
        gte: inicio,
        lte: fin
      }
    },
    include: {
      candidate: {
        include: {
          unit: {
            include: {
              building: true
            }
          }
        }
      }
    }
  });

  for (const visit of visits) {
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        companyId,
        visitId: visit.id,
        tipo: 'visita'
      }
    });

    if (!existingEvent) {
      await prisma.calendarEvent.create({
        data: {
          companyId,
          titulo: `Visita: ${visit.candidate.nombreCompleto}`,
          descripcion: `Candidato: ${visit.candidate.nombreCompleto}\nEmail: ${visit.candidate.email}\nTeléfono: ${visit.candidate.telefono}\nEdificio: ${visit.candidate.unit.building.nombre}\nUnidad: ${visit.candidate.unit.numero}${visit.confirmada ? '\n✅ Confirmada' : '\n⏳ Pendiente de confirmar'}`,
          tipo: 'visita',
          prioridad: visit.confirmada ? 'alta' : 'media',
          fechaInicio: visit.fechaVisita,
          fechaFin: addDays(visit.fechaVisita, 0),
          todoElDia: false,
          ubicacion: `${visit.candidate.unit.building.nombre} - Unidad ${visit.candidate.unit.numero}`,
          color: visit.confirmada ? '#10b981' : '#f59e0b',
          buildingId: visit.candidate.unit.buildingId,
          unitId: visit.candidate.unitId,
          visitId: visit.id,
          recordatorioActivo: true,
          recordatorioMinutos: 180, // 3 horas antes
          creadoPor: 'sistema'
        }
      });
    }
  }
}

/**
 * Sincroniza eventos de inspecciones
 */
async function sincronizarEventosInspecciones(companyId: string, inicio: Date, fin: Date) {
  const inspections = await prisma.inspection.findMany({
    where: {
      companyId,
      estado: 'programada',
      fechaProgramada: {
        gte: inicio,
        lte: fin
      }
    }
  });

  for (const inspection of inspections) {
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        companyId,
        inspectionId: inspection.id,
        tipo: 'inspeccion'
      }
    });

    if (!existingEvent) {
      await prisma.calendarEvent.create({
        data: {
          companyId,
          titulo: `Inspección: ${inspection.tipo}`,
          descripcion: inspection.descripcion || `Inspección de tipo ${inspection.tipo}\nInspector: ${inspection.inspector}`,
          tipo: 'inspeccion',
          prioridad: 'media',
          fechaInicio: inspection.fechaProgramada,
          todoElDia: false,
          color: '#8b5cf6',
          buildingId: inspection.buildingId || undefined,
          unitId: inspection.unitId || undefined,
          inspectionId: inspection.id,
          recordatorioActivo: true,
          recordatorioMinutos: 1440, // 24 horas antes
          creadoPor: 'sistema'
        }
      });
    }
  }
}

/**
 * Obtiene eventos del calendario para un rango de fechas
 */
export async function obtenerEventosCalendario(
  companyId: string,
  fechaInicio: Date,
  fechaFin: Date,
  filtros?: {
    tipo?: CalendarEventType[];
    buildingId?: string;
    unitId?: string;
    tenantId?: string;
  }
) {
  const where: any = {
    companyId,
    fechaInicio: {
      gte: fechaInicio,
      lte: fechaFin
    },
    cancelado: false
  };

  if (filtros?.tipo && filtros.tipo.length > 0) {
    where.tipo = { in: filtros.tipo };
  }

  if (filtros?.buildingId) {
    where.buildingId = filtros.buildingId;
  }

  if (filtros?.unitId) {
    where.unitId = filtros.unitId;
  }

  if (filtros?.tenantId) {
    where.tenantId = filtros.tenantId;
  }

  const events = await prisma.calendarEvent.findMany({
    where,
    include: {
      building: true,
      unit: true,
      tenant: true,
      contract: true,
      payment: true,
      maintenanceRequest: true,
      visit: true,
      inspection: true
    },
    orderBy: {
      fechaInicio: 'asc'
    }
  });

  return events;
}

/**
 * Elimina eventos antiguos completados o cancelados
 */
export async function limpiarEventosAntiguos(companyId: string, mesesAtras: number = 6) {
  const fechaLimite = addMonths(new Date(), -mesesAtras);

  const result = await prisma.calendarEvent.deleteMany({
    where: {
      companyId,
      OR: [
        {
          completado: true,
          fechaInicio: {
            lt: fechaLimite
          }
        },
        {
          cancelado: true,
          fechaInicio: {
            lt: fechaLimite
          }
        }
      ]
    }
  });

  return result;
}
