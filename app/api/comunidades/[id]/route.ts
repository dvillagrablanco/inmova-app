import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

const updateComunidadSchema = z.object({
  nombreComunidad: z.string().min(1).optional(),
  cif: z.string().optional(),
  direccion: z.string().optional(),
  codigoPostal: z.string().optional(),
  ciudad: z.string().optional(),
  provincia: z.string().optional(),
  honorariosFijos: z.number().optional(),
  honorariosPorcentaje: z.number().optional(),
  activa: z.boolean().optional(),
});

// GET - Obtener comunidad por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const sessionUser = session.user as { companyId?: string | null };
    const companyId = sessionUser.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const comunidad = await prisma.communityManagement.findFirst({
      where: {
        id: params.id,
        companyId,
      },
      include: {
        building: {
          include: {
            units: {
              select: {
                id: true,
                numero: true,
                tipo: true,
                estado: true,
                superficie: true,
                contracts: {
                  where: { estado: 'activo' },
                  include: {
                    tenant: {
                      select: {
                        id: true,
                        nombreCompleto: true,
                        email: true,
                        telefono: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        facturas: {
          orderBy: { fechaEmision: 'desc' },
          take: 10,
        },
        movimientosCaja: {
          orderBy: { fecha: 'desc' },
          take: 20,
        },
        informes: {
          orderBy: { generadoEn: 'desc' },
          take: 5,
        },
      },
    });

    if (!comunidad) {
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });
    }

    // Obtener estadísticas adicionales
    const [cuotasPendientes, votacionesActivas, reunionesProgramadas, incidenciasAbiertas] = await Promise.all([
      prisma.communityFee.count({
        where: {
          buildingId: comunidad.buildingId,
          estado: 'pendiente',
        },
      }),
      prisma.communityVote.count({
        where: {
          buildingId: comunidad.buildingId,
          estado: 'activa',
        },
      }),
      prisma.communityMeeting.count({
        where: {
          buildingId: comunidad.buildingId,
          estado: 'programada',
          fechaReunion: { gte: new Date() },
        },
      }),
      prisma.communityIncident.count({
        where: {
          buildingId: comunidad.buildingId,
          estado: 'abierta',
        },
      }),
    ]);

    // Obtener fondos
    const fondos = await prisma.communityFund.findMany({
      where: {
        buildingId: comunidad.buildingId,
        activo: true,
      },
    });

    return NextResponse.json({
      comunidad: {
        ...comunidad,
        stats: {
          totalUnidades: comunidad.building?.units?.length || 0,
          cuotasPendientes,
          votacionesActivas,
          reunionesProgramadas,
          incidenciasAbiertas,
        },
        fondos,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Comunidad GET Error]:', { message });
    return NextResponse.json(
      { error: 'Error obteniendo comunidad', details: message },
      { status: 500 }
    );
  }
}

// PUT - Actualizar comunidad
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const sessionUser = session.user as { companyId?: string | null };
    const companyId = sessionUser.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const body = await request.json();
    const validated = updateComunidadSchema.parse(body);

    // Verificar que existe y pertenece a la empresa
    const existing = await prisma.communityManagement.findFirst({
      where: { id: params.id, companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });
    }

    const comunidad = await prisma.communityManagement.update({
      where: { id: params.id },
      data: validated,
      include: {
        building: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    return NextResponse.json({ comunidad });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Comunidad PUT Error]:', { message });
    return NextResponse.json(
      { error: 'Error actualizando comunidad', details: message },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar/Desactivar comunidad
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const sessionUser = session.user as { companyId?: string | null };
    const companyId = sessionUser.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que existe y pertenece a la empresa
    const existing = await prisma.communityManagement.findFirst({
      where: { id: params.id, companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });
    }

    // Soft delete - desactivar en lugar de eliminar
    await prisma.communityManagement.update({
      where: { id: params.id },
      data: {
        activa: false,
        fechaFin: new Date(),
      },
    });

    return NextResponse.json({ message: 'Comunidad desactivada correctamente' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Comunidad DELETE Error]:', { message });
    return NextResponse.json(
      { error: 'Error eliminando comunidad', details: message },
      { status: 500 }
    );
  }
}
