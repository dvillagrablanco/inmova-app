/**
 * API Endpoint: Gestión de Licitaciones
 * 
 * Usa ProviderWorkOrder como solicitud de licitación
 * y ProviderQuote como ofertas/propuestas
 * 
 * GET /api/licitaciones - Listar licitaciones
 * POST /api/licitaciones - Crear licitación
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import { sendEmail } from '@/lib/email-service';
import type { Prisma } from '@/types/prisma-types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const WORK_ORDER_STATUSES = [
  'pendiente',
  'asignada',
  'aceptada',
  'en_progreso',
  'pausada',
  'completada',
  'cancelada',
  'rechazada',
] as const;

type WorkOrderStatusValue = (typeof WORK_ORDER_STATUSES)[number];

const parseWorkOrderStatus = (value: string): WorkOrderStatusValue | null => {
  const match = WORK_ORDER_STATUSES.find(
    (item): item is WorkOrderStatusValue => item === value
  );
  return match ?? null;
};

// ============================================================================
// VALIDACIÓN
// ============================================================================

const createTenderSchema = z.object({
  titulo: z.string().min(5),
  descripcion: z.string().min(10),
  buildingId: z.string().optional(),
  unitId: z.string().optional(),
  tipo: z.enum(['mantenimiento', 'renovacion', 'limpieza', 'seguridad', 'jardineria', 'otro']),
  presupuestoMaximo: z.number().positive().optional(),
  fechaLimiteOfertas: z.string(),
  fechaInicioTrabajo: z.string().optional(),
  fechaFinTrabajo: z.string().optional(),
  requisitos: z.array(z.string()).default([]),
  documentos: z.array(z.string()).default([]),
  proveedoresInvitados: z.array(z.string()).default([]), // IDs de proveedores
});

// ============================================================================
// GET - Listar licitaciones
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');

    const { prisma } = await import('@/lib/db');

    // Buscar órdenes de trabajo - licitaciones usan estado 'pendiente' como "abierta"
    // Estados posibles: pendiente, asignada, aceptada, en_progreso, pausada, completada, cancelada, rechazada
    const where: Prisma.ProviderWorkOrderWhereInput = { companyId };

    if (estado) {
      // Mapear estados de UI a estados del enum
      const estadoMap: Record<string, WorkOrderStatusValue[]> = {
        'abierta': ['pendiente'],
        'cerrada': ['asignada'],
        'adjudicada': ['aceptada', 'en_progreso'],
        'completada': ['completada'],
        'cancelada': ['cancelada', 'rechazada'],
      };

      const mapped = estadoMap[estado];
      if (mapped) {
        where.estado = { in: mapped };
      } else {
        const parsed = parseWorkOrderStatus(estado);
        if (!parsed) {
          return NextResponse.json(
            { error: 'Estado inválido' },
            { status: 400 }
          );
        }
        where.estado = { in: [parsed] };
      }
    }

    const tenders = await prisma.providerWorkOrder.findMany({
      where,
      include: {
        provider: {
          select: { id: true, nombre: true, email: true, telefono: true, rating: true },
        },
        building: {
          select: { id: true, nombre: true, direccion: true },
        },
        unit: {
          select: { id: true, numero: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Obtener ofertas/quotes para cada licitación
    const tendersWithQuotes = await Promise.all(
      tenders.map(async (tender) => {
        const quotes = await prisma.providerQuote.findMany({
          where: { workOrderId: tender.id },
          include: {
            provider: {
              select: { id: true, nombre: true, rating: true },
            },
          },
          orderBy: { total: 'asc' },
        });

        // Determinar estado de la licitación basado en enum WorkOrderStatus
        let estadoLicitacion = 'abierta';
        const ahora = new Date();
        const fechaLimite = tender.fechaEstimada;
        
        if (tender.estado === 'aceptada' || tender.estado === 'en_progreso') {
          estadoLicitacion = 'adjudicada';
        } else if (tender.estado === 'completada') {
          estadoLicitacion = 'completada';
        } else if (tender.estado === 'cancelada' || tender.estado === 'rechazada') {
          estadoLicitacion = 'cancelada';
        } else if (tender.estado === 'asignada') {
          estadoLicitacion = 'evaluando';
        } else if (fechaLimite && ahora > fechaLimite) {
          estadoLicitacion = 'cerrada';
        } else if (quotes.length === 0) {
          estadoLicitacion = 'sin_ofertas';
        }

        return {
          ...tender,
          presupuesto: tender.presupuestoInicial, // Alias para compatibilidad con frontend
          ofertas: quotes,
          numOfertas: quotes.length,
          mejorOferta: quotes[0]?.total || null,
          estadoLicitacion,
        };
      })
    );

    // Estadísticas
    const stats = {
      total: tendersWithQuotes.length,
      abiertas: tendersWithQuotes.filter(t => t.estadoLicitacion === 'abierta').length,
      cerradas: tendersWithQuotes.filter(t => t.estadoLicitacion === 'cerrada').length,
      adjudicadas: tendersWithQuotes.filter(t => t.estadoLicitacion === 'adjudicada').length,
      totalOfertas: tendersWithQuotes.reduce((sum, t) => sum + t.numOfertas, 0),
    };

    return NextResponse.json({
      success: true,
      data: tendersWithQuotes,
      stats,
    });
  } catch (error: unknown) {
    logger.error('Error fetching tenders:', error);
    return NextResponse.json({ error: 'Error al obtener licitaciones' }, { status: 500 });
  }
}

// ============================================================================
// POST - Crear licitación
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const body: unknown = await req.json();
    const validationResult = createTenderSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const data = validationResult.data;
    const { prisma } = await import('@/lib/db');

    // Necesitamos un buildingId válido
    let buildingId = data.buildingId;
    if (!buildingId) {
      // Buscar el primer edificio de la compañía
      const building = await prisma.building.findFirst({
        where: { companyId },
        select: { id: true },
      });
      if (!building) {
        return NextResponse.json({
          error: 'Debe tener al menos un edificio para crear licitaciones',
        }, { status: 400 });
      }
      buildingId = building.id;
    }

    // Obtener un proveedor por defecto si hay invitados, o usar un placeholder
    let providerId = data.proveedoresInvitados[0];
    if (!providerId) {
      // Buscar cualquier proveedor de la compañía o crear uno temporal
      const anyProvider = await prisma.provider.findFirst({
        where: { companyId },
        select: { id: true },
      });
      if (!anyProvider) {
        return NextResponse.json(
          { error: 'Debe existir al menos un proveedor para crear licitaciones' },
          { status: 400 }
        );
      }
      providerId = anyProvider.id;
    }

    // Crear la licitación como una orden de trabajo en estado 'pendiente' (abierta)
    const tender = await prisma.providerWorkOrder.create({
      data: {
        companyId,
        buildingId,
        unitId: data.unitId,
        providerId: providerId,
        titulo: data.titulo,
        descripcion: data.descripcion,
        tipo: data.tipo,
        estado: 'pendiente', // Estado del enum WorkOrderStatus
        prioridad: 'media',
        fechaEstimada: new Date(data.fechaLimiteOfertas),
        presupuestoInicial: data.presupuestoMaximo, // Campo correcto del modelo
        // Guardar metadata adicional en comentarios
        comentarios: JSON.stringify({
          requisitos: data.requisitos,
          documentos: data.documentos,
          proveedoresInvitados: data.proveedoresInvitados,
          fechaInicioTrabajo: data.fechaInicioTrabajo,
          fechaFinTrabajo: data.fechaFinTrabajo,
        }),
      },
      include: {
        building: {
          select: { id: true, nombre: true },
        },
      },
    });

    const invitedProviderIds = Array.from(
      new Set(data.proveedoresInvitados.filter((id) => Boolean(id)))
    );

    if (invitedProviderIds.length > 0) {
      const invitedProviders = await prisma.provider.findMany({
        where: {
          companyId,
          id: { in: invitedProviderIds },
        },
        select: {
          id: true,
          email: true,
          nombre: true,
        },
      });

      const emailResults = await Promise.allSettled(
        invitedProviders
          .filter((provider) => provider.email)
          .map((provider) =>
            sendEmail({
              to: provider.email as string,
              subject: `Nueva licitación: ${tender.titulo}`,
              html: `
                <p>Hola ${provider.nombre},</p>
                <p>Has sido invitado a una licitación:</p>
                <ul>
                  <li><strong>Título:</strong> ${tender.titulo}</li>
                  <li><strong>Descripción:</strong> ${tender.descripcion}</li>
                  <li><strong>Fecha límite:</strong> ${tender.fechaEstimada?.toLocaleDateString() || 'No definida'}</li>
                </ul>
                <p>Accede al portal de proveedores para enviar tu propuesta.</p>
              `,
            })
          )
      );

      const failedEmails = emailResults.filter((result) => result.status === 'rejected').length;
      if (failedEmails > 0) {
        logger.warn('No se pudieron enviar algunas invitaciones de licitación', {
          tenderId: tender.id,
          failedEmails,
        });
      }
    }

    logger.info('Tender created', { tenderId: tender.id, companyId });

    return NextResponse.json({
      success: true,
      data: tender,
      message: 'Licitación creada exitosamente',
    }, { status: 201 });
  } catch (error: unknown) {
    logger.error('Error creating tender:', error);
    return NextResponse.json({ error: 'Error al crear licitación' }, { status: 500 });
  }
}
