/**
 * API: Tours Virtuales 360° de Propiedades
 * 
 * GET /api/v1/properties/[id]/virtual-tour - Obtener tour
 * POST /api/v1/properties/[id]/virtual-tour - Crear/actualizar tour
 * DELETE /api/v1/properties/[id]/virtual-tour - Eliminar tour
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// ============================================================================
// VALIDACIÓN
// ============================================================================

const virtualTourSchema = z.object({
  titulo: z.string().min(3, 'Título muy corto'),
  descripcion: z.string().optional(),
  tipo: z.enum(['MATTERPORT', 'KUULA', 'YOUTUBE', 'SELF_HOSTED']),
  urlPrincipal: z.string().url('URL inválida'),
  urlThumbnail: z.string().url().optional(),
  embedCode: z.string().optional(),
  escenas: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    urlImagen: z.string().url(),
  })).optional(),
  hotspots: z.array(z.object({
    escenaId: z.string(),
    x: z.number(),
    y: z.number(),
    tipo: z.enum(['INFO', 'LINK', 'IMAGEN']),
    contenido: z.string(),
  })).optional(),
});

// ============================================================================
// GET - Obtener tour virtual
// ============================================================================

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // 2. Buscar tour
    const tour = await prisma.virtualTour.findFirst({
      where: {
        unitId: params.id,
        companyId: session.user.companyId,
      },
      include: {
        unit: {
          select: {
            id: true,
            numero: true,
            building: {
              select: {
                nombre: true,
                direccion: true,
              },
            },
          },
        },
      },
    });

    if (!tour) {
      return NextResponse.json(
        { error: 'Tour virtual no encontrado' },
        { status: 404 }
      );
    }

    // 3. Incrementar contador de vistas
    await prisma.virtualTour.update({
      where: { id: tour.id },
      data: {
        vistas: { increment: 1 },
      },
    });

    // 4. Respuesta
    return NextResponse.json({
      success: true,
      data: {
        id: tour.id,
        titulo: tour.titulo,
        descripcion: tour.descripcion,
        tipo: tour.tipo,
        urlPrincipal: tour.urlPrincipal,
        urlThumbnail: tour.urlThumbnail,
        embedCode: tour.embedCode,
        escenas: tour.escenas,
        hotspots: tour.hotspots,
        vistas: tour.vistas + 1,
        property: {
          id: tour.unit?.id,
          numero: tour.unit?.numero,
          building: tour.unit?.building.nombre,
          direccion: tour.unit?.building.direccion,
        },
        createdAt: tour.createdAt,
      },
    });

  } catch (error: any) {
    logger.error('Error fetching virtual tour:', error);
    return NextResponse.json(
      { error: 'Error al obtener el tour virtual' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Crear/actualizar tour virtual
// ============================================================================

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // 2. Validar body
    const body = await req.json();
    const validation = virtualTourSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // 3. Verificar que la propiedad existe y pertenece a la empresa
    const unit = await prisma.unit.findFirst({
      where: {
        id: params.id,
        building: {
          companyId: session.user.companyId,
        },
      },
    });

    if (!unit) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      );
    }

    // 4. Verificar si ya existe un tour
    const existingTour = await prisma.virtualTour.findFirst({
      where: {
        unitId: params.id,
        companyId: session.user.companyId,
      },
    });

    let tour;

    if (existingTour) {
      // Actualizar tour existente
      tour = await prisma.virtualTour.update({
        where: { id: existingTour.id },
        data: {
          titulo: data.titulo,
          descripcion: data.descripcion,
          tipo: data.tipo,
          urlPrincipal: data.urlPrincipal,
          urlThumbnail: data.urlThumbnail,
          embedCode: data.embedCode,
          escenas: data.escenas,
          hotspots: data.hotspots,
        },
      });

      logger.info('✅ Virtual tour updated', {
        tourId: tour.id,
        unitId: params.id,
      });

    } else {
      // Crear nuevo tour
      tour = await prisma.virtualTour.create({
        data: {
          companyId: session.user.companyId,
          unitId: params.id,
          titulo: data.titulo,
          descripcion: data.descripcion,
          tipo: data.tipo,
          urlPrincipal: data.urlPrincipal,
          urlThumbnail: data.urlThumbnail,
          embedCode: data.embedCode,
          escenas: data.escenas,
          hotspots: data.hotspots,
        },
      });

      logger.info('✅ Virtual tour created', {
        tourId: tour.id,
        unitId: params.id,
      });
    }

    // 5. Respuesta
    return NextResponse.json({
      success: true,
      data: tour,
      message: existingTour ? 'Tour actualizado exitosamente' : 'Tour creado exitosamente',
    }, { status: existingTour ? 200 : 201 });

  } catch (error: any) {
    logger.error('Error creating/updating virtual tour:', error);
    return NextResponse.json(
      { error: 'Error al guardar el tour virtual' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Eliminar tour virtual
// ============================================================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // 2. Buscar y eliminar tour
    const tour = await prisma.virtualTour.findFirst({
      where: {
        unitId: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!tour) {
      return NextResponse.json(
        { error: 'Tour no encontrado' },
        { status: 404 }
      );
    }

    await prisma.virtualTour.delete({
      where: { id: tour.id },
    });

    logger.info('✅ Virtual tour deleted', {
      tourId: tour.id,
      unitId: params.id,
    });

    // 3. Respuesta
    return NextResponse.json({
      success: true,
      message: 'Tour eliminado exitosamente',
    });

  } catch (error: any) {
    logger.error('Error deleting virtual tour:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el tour virtual' },
      { status: 500 }
    );
  }
}
