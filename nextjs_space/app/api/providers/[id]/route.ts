/**
 * Endpoints API para operaciones específicas de Proveedores
 * 
 * Implementa operaciones GET, PUT y DELETE con validación Zod
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { providerUpdateSchema } from '@/lib/validations';
import { z } from 'zod';
import { requirePermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/providers/[id]
 * Obtiene un proveedor específico con sus relaciones
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado', message: 'Debe iniciar sesión' },
        { status: 401 }
      );
    }

    const provider = await prisma.provider.findUnique({
      where: { id: params.id },
      include: {
        maintenanceRequests: {
          include: {
            unit: {
              select: {
                numero: true,
                building: { select: { nombre: true } },
              },
            },
          },
          orderBy: { fechaSolicitud: 'desc' },
          take: 10,
        },
        expenses: {
          include: {
            building: { select: { nombre: true } },
            unit: { select: { numero: true } },
          },
          orderBy: { fecha: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            maintenanceRequests: true,
            expenses: true,
          },
        },
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'No encontrado', message: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el proveedor pertenece a la compañía del usuario
    if (provider.companyId !== session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Prohibido', message: 'No tiene acceso a este proveedor' },
        { status: 403 }
      );
    }

    logger.info(`Proveedor obtenido: ${provider.id}`, { userId: session?.user?.id});
    return NextResponse.json(provider, { status: 200 });
    
  } catch (error) {
    logger.error('Error fetching provider:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', message: 'Error al obtener proveedor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/providers/[id]
 * Actualiza un proveedor existente con validación Zod
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requirePermission('update');
    const body = await req.json();

    // Validación con Zod
    const validatedData = providerUpdateSchema.parse(body);

    // Verificar que el proveedor existe y pertenece a la compañía
    const existingProvider = await prisma.provider.findUnique({
      where: { id: params.id },
    });

    if (!existingProvider) {
      return NextResponse.json(
        { error: 'No encontrado', message: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    if (existingProvider.companyId !== user.companyId) {
      return NextResponse.json(
        { error: 'Prohibido', message: 'No tiene acceso a este proveedor' },
        { status: 403 }
      );
    }

    // Verificar duplicados si se está actualizando email
    if (validatedData.email && validatedData.email !== existingProvider.email) {
      const duplicateEmail = await prisma.provider.findFirst({
        where: {
          companyId: user.companyId,
          email: validatedData.email,
          id: { not: params.id },
        },
      });
      
      if (duplicateEmail) {
        return NextResponse.json(
          { error: 'Proveedor duplicado', message: 'Ya existe un proveedor con este email' },
          { status: 409 }
        );
      }
    }

    const provider = await prisma.provider.update({
      where: { id: params.id },
      data: validatedData,
    });

    logger.info(`Proveedor actualizado: ${provider.id}`, { userId: user.id, providerId: provider.id });
    return NextResponse.json(provider, { status: 200 });
    
  } catch (error: any) {
    logger.error('Error updating provider:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validación fallida',
          message: 'Los datos proporcionados no son válidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error.message?.includes('permiso')) {
      return NextResponse.json(
        { error: 'Prohibido', message: error.message },
        { status: 403 }
      );
    }
    
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado', message: 'Debe iniciar sesión' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor', message: 'Error al actualizar proveedor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/providers/[id]
 * Elimina un proveedor existente
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requirePermission('delete');

    // Verificar que el proveedor existe y pertenece a la compañía
    const existingProvider = await prisma.provider.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            maintenanceRequests: true,
            expenses: true,
          },
        },
      },
    });

    if (!existingProvider) {
      return NextResponse.json(
        { error: 'No encontrado', message: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    if (existingProvider.companyId !== user.companyId) {
      return NextResponse.json(
        { error: 'Prohibido', message: 'No tiene acceso a este proveedor' },
        { status: 403 }
      );
    }

    // Verificar si tiene relaciones activas
    if (existingProvider._count.maintenanceRequests > 0 || existingProvider._count.expenses > 0) {
      return NextResponse.json(
        {
          error: 'Conflicto',
          message: 'No se puede eliminar el proveedor porque tiene solicitudes de mantenimiento o gastos asociados',
        },
        { status: 409 }
      );
    }

    await prisma.provider.delete({
      where: { id: params.id },
    });

    logger.info(`Proveedor eliminado: ${params.id}`, { userId: user.id, providerId: params.id });
    return NextResponse.json(
      { message: 'Proveedor eliminado exitosamente' },
      { status: 200 }
    );
    
  } catch (error: any) {
    logger.error('Error deleting provider:', error);

    if (error.message?.includes('permiso')) {
      return NextResponse.json(
        { error: 'Prohibido', message: error.message },
        { status: 403 }
      );
    }
    
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado', message: 'Debe iniciar sesión' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor', message: 'Error al eliminar proveedor' },
      { status: 500 }
    );
  }
}
