/**
 * API de Alertas del Dashboard
 * Proporciona alertas priorizadas para mostrar en el dashboard
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { addDays, differenceInDays, startOfDay } from 'date-fns';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Alert {
  id: string;
  type: 'payment' | 'contract' | 'maintenance' | 'document';
  priority: 'alto' | 'medio' | 'bajo';
  title: string;
  description: string;
  date?: Date;
  daysRemaining?: number;
  entityId: string;
  entityType: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = session?.user?.companyId;
    const today = startOfDay(new Date());
    const alerts: Alert[] = [];

    // ============================================
    // ALERTAS DE PAGOS PENDIENTES
    // ============================================
    const pendingPayments = await prisma.payment.findMany({
      where: {
        estado: { in: ['pendiente', 'atrasado'] },
        fechaVencimiento: {
          lte: addDays(today, 7), // Pagos que vencen en los próximos 7 días
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
      orderBy: { fechaVencimiento: 'asc' },
    });

    for (const payment of pendingPayments) {
      const daysRemaining = differenceInDays(payment.fechaVencimiento, today);
      const isOverdue = daysRemaining < 0;

      alerts.push({
        id: `payment-${payment.id}`,
        type: 'payment',
        priority: isOverdue || daysRemaining <= 1 ? 'alto' : daysRemaining <= 3 ? 'medio' : 'bajo',
        title: isOverdue
          ? `Pago Atrasado - ${payment.contract.tenant.nombreCompleto}`
          : `Pago Próximo a Vencer`,
        description: `${payment.contract.unit.building.nombre} - ${payment.contract.unit.numero} | ${payment.periodo} | ${payment.monto.toFixed(2)}€`,
        date: payment.fechaVencimiento,
        daysRemaining: Math.max(0, daysRemaining),
        entityId: payment.id,
        entityType: 'payment',
      });
    }

    // ============================================
    // ALERTAS DE CONTRATOS PRÓXIMOS A VENCER
    // ============================================
    const expiringContracts = await prisma.contract.findMany({
      where: {
        estado: 'activo',
        fechaFin: {
          gte: today,
          lte: addDays(today, 60), // Contratos que vencen en los próximos 60 días
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
      orderBy: { fechaFin: 'asc' },
    });

    for (const contract of expiringContracts) {
      const daysRemaining = differenceInDays(contract.fechaFin, today);

      alerts.push({
        id: `contract-${contract.id}`,
        type: 'contract',
        priority: daysRemaining <= 30 ? 'alto' : 'medio',
        title: `Contrato Próximo a Vencer`,
        description: `${contract.tenant.nombreCompleto} | ${contract.unit.building.nombre} - ${contract.unit.numero}`,
        date: contract.fechaFin,
        daysRemaining,
        entityId: contract.id,
        entityType: 'contract',
      });
    }

    // ============================================
    // ALERTAS DE MANTENIMIENTO URGENTE
    // ============================================
    const urgentMaintenance = await prisma.maintenanceRequest.findMany({
      where: {
        estado: { in: ['pendiente', 'en_progreso'] },
        prioridad: { in: ['alta', 'media'] },
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
          },
        },
        provider: true,
      },
      orderBy: { fechaSolicitud: 'desc' },
      take: 10,
    });

    for (const maintenance of urgentMaintenance) {
      alerts.push({
        id: `maintenance-${maintenance.id}`,
        type: 'maintenance',
        priority: maintenance.prioridad === 'alta' ? 'alto' : 'medio',
        title: `Mantenimiento ${maintenance.prioridad === 'alta' ? 'Urgente' : 'Pendiente'}`,
        description: `${maintenance.titulo} | ${maintenance.unit.building.nombre} - ${maintenance.unit.numero}`,
        date: maintenance.fechaProgramada || maintenance.fechaSolicitud,
        entityId: maintenance.id,
        entityType: 'maintenancerequest',
      });
    }

    // ============================================
    // ALERTAS DE DOCUMENTOS PRÓXIMOS A VENCER
    // ============================================
    const expiringDocuments = await prisma.document.findMany({
      where: {
        fechaVencimiento: {
          gte: today,
          lte: addDays(today, 30), // Documentos que vencen en los próximos 30 días
        },
        OR: [
          {
            building: {
              companyId,
            },
          },
          {
            unit: {
              building: {
                companyId,
              },
            },
          },
          {
            tenant: {
              companyId,
            },
          },
        ],
      },
      include: {
        building: true,
        unit: {
          include: {
            building: true,
          },
        },
        tenant: true,
      },
      orderBy: { fechaVencimiento: 'asc' },
    });

    for (const document of expiringDocuments) {
      if (!document.fechaVencimiento) continue;

      const daysRemaining = differenceInDays(document.fechaVencimiento, today);

      let location = '';
      if (document.building) {
        location = document.building.nombre;
      } else if (document.unit) {
        location = `${document.unit.building.nombre} - ${document.unit.numero}`;
      } else if (document.tenant) {
        location = document.tenant.nombreCompleto;
      }

      alerts.push({
        id: `document-${document.id}`,
        type: 'document',
        priority: daysRemaining <= 7 ? 'alto' : daysRemaining <= 15 ? 'medio' : 'bajo',
        title: `Documento Próximo a Vencer`,
        description: `${document.nombre} | ${location}`,
        date: document.fechaVencimiento,
        daysRemaining,
        entityId: document.id,
        entityType: 'document',
      });
    }

    // Ordenar alertas por prioridad y fecha
    const priorityOrder = { alto: 0, medio: 1, bajo: 2 };
    alerts.sort((a, b) => {
      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (a.date && b.date) {
        return a.date.getTime() - b.date.getTime();
      }
      return 0;
    });

    return NextResponse.json({
      alerts,
      summary: {
        total: alerts.length,
        high: alerts.filter((a) => a.priority === 'alto').length,
        medium: alerts.filter((a) => a.priority === 'medio').length,
        low: alerts.filter((a) => a.priority === 'bajo').length,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo alertas:', error);
    return NextResponse.json(
      { error: 'Error al obtener alertas' },
      { status: 500 }
    );
  }
}
