/**
 * API de Incidencias para Portal de Inquilinos
 * GET: Listar incidencias del inquilino
 * POST: Crear nueva incidencia con matching IA
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { tenantProviderMatching } from '@/lib/tenant-provider-matching-service';
import { tenantGamification } from '@/lib/tenant-gamification-service';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createIncidenciaSchema = z.object({
  tipo: z.string().min(1),
  descripcion: z.string().min(10),
  urgencia: z.enum(['baja', 'media', 'alta', 'urgente']),
  ubicacion: z.string().optional(),
  fotos: z.array(z.string()).optional(),
  unitId: z.string().optional(),
  autoClassify: z.boolean().optional(), // Si true, usa IA para clasificar
});

// GET: Listar incidencias del inquilino
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const tenantId = session?.user?.tenantId || request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const validStatus = [
      'pendiente',
      'en_progreso',
      'programado',
      'completado',
    ] as const;
    const status = validStatus.includes(statusParam as (typeof validStatus)[number])
      ? (statusParam as (typeof validStatus)[number])
      : undefined;
    const limit = parseInt(searchParams.get('limit') || '20');

    // Obtener inquilino con sus unidades
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { units: true },
    });

    if (!tenant || tenant.units.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No tienes propiedades asignadas',
      });
    }

    const unitIds = tenant.units.map((u) => u.id);

    // Obtener incidencias (MaintenanceRequest)
    const incidencias = await prisma.maintenanceRequest.findMany({
      where: {
        unitId: { in: unitIds },
        ...(status && { estado: status }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        unit: {
          include: { building: true },
        },
        provider: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: incidencias.map((inc) => ({
        id: inc.id,
        tipo: inc.titulo || inc.descripcion.split(' ')[0],
        descripcion: inc.descripcion,
        urgencia: inc.prioridad || 'media',
        estado: inc.estado,
        ubicacion: `${inc.unit?.numero} - ${inc.unit?.building?.nombre}`,
        fechaCreacion: inc.createdAt,
        fechaResolucion: inc.fechaCompletada,
        proveedor: inc.provider
          ? {
              id: inc.provider.id,
              nombre: inc.provider.nombre,
            }
          : null,
        presupuesto: inc.costoEstimado,
        fotos: inc.fotosProblem || [],
      })),
    });
  } catch (error: any) {
    logger.error('[Incidencias GET Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Error obteniendo incidencias' },
      { status: 500 }
    );
  }
}

// POST: Crear nueva incidencia
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const tenantId = session?.user?.tenantId || request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createIncidenciaSchema.parse(body);

    // Obtener inquilino
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { units: true, company: true },
    });

    if (!tenant || tenant.units.length === 0) {
      return NextResponse.json({ error: 'No tienes propiedades asignadas' }, { status: 400 });
    }

    const unitId = validated.unitId || tenant.units[0].id;

    // Auto-clasificar con IA si se solicita
    let classification = {
      tipo: validated.tipo,
      urgencia: validated.urgencia,
    };

    if (validated.autoClassify) {
      try {
        const aiClassification = await tenantProviderMatching.classifyIncidence(
          validated.descripcion
        );
        classification = {
          tipo: aiClassification.tipo,
          urgencia: aiClassification.urgencia,
        };
      } catch (err) {
        logger.warn('[Auto-classify failed, using manual]:', err);
      }
    }

    // Crear incidencia
    const normalizedPriority =
      classification.urgencia === 'urgente' ? 'alta' : classification.urgencia;

    const incidencia = await prisma.maintenanceRequest.create({
      data: {
        unitId,
        titulo: classification.tipo,
        descripcion: validated.descripcion,
        prioridad: normalizedPriority,
        estado: 'pendiente',
        fotosProblem: validated.fotos || [],
      },
      include: {
        unit: {
          include: { building: true },
        },
      },
    });

    // Obtener matching de proveedores con IA
    let matchingResult = null;
    try {
      matchingResult = await tenantProviderMatching.matchProviders({
        id: incidencia.id,
        tenantId,
        unitId,
        tipo: classification.tipo,
        descripcion: validated.descripcion,
        urgencia: classification.urgencia as any,
        fotos: validated.fotos,
        ubicacion: validated.ubicacion,
      });
    } catch (err) {
      logger.warn('[Provider matching failed]:', err);
    }

    // Añadir puntos de gamificación
    try {
      await tenantGamification.addPoints(tenantId, 'REPORTE_INCIDENCIA', {
        incidenciaId: incidencia.id,
        tipo: classification.tipo,
      });
    } catch (err) {
      logger.warn('[Gamification failed]:', err);
    }

    return NextResponse.json({
      success: true,
      data: {
        incidencia: {
          id: incidencia.id,
          tipo: classification.tipo,
          descripcion: validated.descripcion,
          urgencia: classification.urgencia,
          estado: 'pendiente',
          ubicacion: `${incidencia.unit?.numero} - ${incidencia.unit?.building?.nombre}`,
          fechaCreacion: incidencia.createdAt,
        },
        matching: matchingResult,
      },
      message: '¡Incidencia reportada! Te mostramos proveedores recomendados.',
    });
  } catch (error: any) {
    logger.error('[Incidencias POST Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Error creando incidencia' },
      { status: 500 }
    );
  }
}
