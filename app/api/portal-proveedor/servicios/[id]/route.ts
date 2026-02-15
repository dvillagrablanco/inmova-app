/**
 * API de Servicio Individual para el Portal del Proveedor
 * 
 * GET - Obtiene un servicio específico
 * PUT - Actualiza un servicio
 * DELETE - Elimina un servicio
 * PATCH - Actualiza parcialmente (ej: toggle activo)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedProvider } from '@/lib/provider-auth';
import logger from '@/lib/logger';
import { z } from 'zod';
import { requireSession } from '@/lib/api-auth-guard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// Schema de validación para actualizar servicio
const servicioUpdateSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(200).optional(),
  descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres').optional(),
  categoria: z.string().min(1, 'La categoría es requerida').optional(),
  precio: z.number().min(0).optional().nullable(),
  tipoPrecio: z.enum(['fijo', 'hora', 'presupuesto']).optional(),
  activo: z.boolean().optional(),
});

// GET /api/portal-proveedor/servicios/[id] - Obtener servicio específico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = await getPrisma();
  try {
    const provider = await getAuthenticatedProvider();

    if (!provider) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const servicio = await prisma.marketplaceService.findFirst({
      where: {
        id,
        providerId: provider.id,
      },
      include: {
        _count: {
          select: {
            reservas: true,
          },
        },
      },
    });

    if (!servicio) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: servicio.id,
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      categoria: servicio.categoria,
      precio: servicio.precio || 0,
      tipoPrecio: servicio.tipoPrecio,
      activo: servicio.activo,
      destacado: servicio.destacado,
      reservas: servicio._count.reservas,
      valoracion: servicio.rating || 0,
      totalReviews: servicio.totalReviews,
      createdAt: servicio.createdAt,
      updatedAt: servicio.updatedAt,
    });
  } catch (error) {
    logger.error('Error al obtener servicio:', error);
    return NextResponse.json(
      { error: 'Error al obtener servicio' },
      { status: 500 }
    );
  }
}

// PUT /api/portal-proveedor/servicios/[id] - Actualizar servicio
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = await getPrisma();
  try {
    const provider = await getAuthenticatedProvider();

    if (!provider) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    // Verificar que el servicio pertenece al proveedor
    const existingServicio = await prisma.marketplaceService.findFirst({
      where: {
        id,
        providerId: provider.id,
      },
    });

    if (!existingServicio) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    // Validar datos con Zod
    const validationResult = servicioUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Actualizar el servicio
    const servicio = await prisma.marketplaceService.update({
      where: { id },
      data: {
        ...(data.nombre && { nombre: data.nombre }),
        ...(data.descripcion && { descripcion: data.descripcion }),
        ...(data.categoria && { categoria: data.categoria }),
        ...(data.precio !== undefined && { precio: data.precio }),
        ...(data.tipoPrecio && { tipoPrecio: data.tipoPrecio }),
        ...(data.activo !== undefined && { 
          activo: data.activo,
          disponible: data.activo,
        }),
      },
      include: {
        _count: {
          select: {
            reservas: true,
          },
        },
      },
    });

    logger.info(`Servicio actualizado: ${servicio.id}`, {
      providerId: provider.id,
      servicioId: servicio.id,
    });

    return NextResponse.json({
      id: servicio.id,
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      categoria: servicio.categoria,
      precio: servicio.precio || 0,
      tipoPrecio: servicio.tipoPrecio,
      activo: servicio.activo,
      destacado: servicio.destacado,
      reservas: servicio._count.reservas,
      valoracion: servicio.rating || 0,
      totalReviews: servicio.totalReviews,
      createdAt: servicio.createdAt,
      updatedAt: servicio.updatedAt,
    });
  } catch (error) {
    logger.error('Error al actualizar servicio:', error);
    return NextResponse.json(
      { error: 'Error al actualizar servicio' },
      { status: 500 }
    );
  }
}

// PATCH /api/portal-proveedor/servicios/[id] - Actualización parcial (toggle activo, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = await getPrisma();
  try {
    const provider = await getAuthenticatedProvider();

    if (!provider) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    // Verificar que el servicio pertenece al proveedor
    const existingServicio = await prisma.marketplaceService.findFirst({
      where: {
        id,
        providerId: provider.id,
      },
    });

    if (!existingServicio) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    // Solo permitir toggle de activo en PATCH
    if (body.activo !== undefined) {
      const servicio = await prisma.marketplaceService.update({
        where: { id },
        data: {
          activo: body.activo,
          disponible: body.activo,
        },
      });

      logger.info(`Servicio ${body.activo ? 'activado' : 'desactivado'}: ${servicio.id}`, {
        providerId: provider.id,
        servicioId: servicio.id,
      });

      return NextResponse.json({
        success: true,
        activo: servicio.activo,
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error al actualizar servicio:', error);
    return NextResponse.json(
      { error: 'Error al actualizar servicio' },
      { status: 500 }
    );
  }
}

// DELETE /api/portal-proveedor/servicios/[id] - Eliminar servicio
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = await getPrisma();
  try {
    const provider = await getAuthenticatedProvider();

    if (!provider) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verificar que el servicio pertenece al proveedor
    const existingServicio = await prisma.marketplaceService.findFirst({
      where: {
        id,
        providerId: provider.id,
      },
      include: {
        _count: {
          select: {
            reservas: true,
          },
        },
      },
    });

    if (!existingServicio) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si tiene reservas activas
    if (existingServicio._count.reservas > 0) {
      // En lugar de eliminar, desactivar
      await prisma.marketplaceService.update({
        where: { id },
        data: {
          activo: false,
          disponible: false,
        },
      });

      logger.info(`Servicio desactivado (tenía reservas): ${id}`, {
        providerId: provider.id,
        servicioId: id,
      });

      return NextResponse.json({
        success: true,
        message: 'Servicio desactivado (tiene reservas asociadas)',
        desactivado: true,
      });
    }

    // Eliminar el servicio
    await prisma.marketplaceService.delete({
      where: { id },
    });

    logger.info(`Servicio eliminado: ${id}`, {
      providerId: provider.id,
      servicioId: id,
    });

    return NextResponse.json({
      success: true,
      message: 'Servicio eliminado correctamente',
    });
  } catch (error) {
    logger.error('Error al eliminar servicio:', error);
    return NextResponse.json(
      { error: 'Error al eliminar servicio' },
      { status: 500 }
    );
  }
}
