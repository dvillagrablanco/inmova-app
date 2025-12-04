import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { logError } from '@/lib/logger';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !['super_admin', 'administrador'].includes(session.user.role)) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    );
  }

  try {
    const { id } = params;
    const body = await req.json();

    const {
      nombre,
      descripcion,
      categoria,
      subcategoria,
      tipoPrecio,
      precio,
      unidad,
      comisionPorcentaje,
      disponible,
      duracionEstimada,
      destacado,
      activo
    } = body;

    // Verificar que el servicio pertenece a la empresa del usuario
    const existingService = await prisma.marketplaceService.findFirst({
      where: {
        id,
        companyId: session.user.companyId
      }
    });

    if (!existingService) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    const service = await prisma.marketplaceService.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        categoria,
        subcategoria: subcategoria || null,
        tipoPrecio,
        precio: precio !== null && precio !== undefined ? parseFloat(precio) : null,
        unidad: unidad || null,
        comisionPorcentaje: parseFloat(comisionPorcentaje),
        disponible,
        duracionEstimada: duracionEstimada ? parseInt(duracionEstimada) : null,
        destacado,
        activo
      },
      include: {
        provider: {
          select: {
            nombre: true
          }
        }
      }
    });

    return NextResponse.json(service);
  } catch (error) {
    logError(new Error(error instanceof Error ? error.message : 'Error updating marketplace service'), {
      context: 'PUT /api/admin/marketplace/services/[id]',
      serviceId: params?.id,
      companyId: session?.user?.companyId,
    });
    return NextResponse.json(
      { error: 'Error al actualizar servicio' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !['super_admin', 'administrador'].includes(session.user.role)) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    );
  }

  try {
    const { id } = params;

    // Verificar que el servicio pertenece a la empresa del usuario
    const existingService = await prisma.marketplaceService.findFirst({
      where: {
        id,
        companyId: session.user.companyId
      }
    });

    if (!existingService) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    await prisma.marketplaceService.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Servicio eliminado correctamente' });
  } catch (error) {
    logError(new Error(error instanceof Error ? error.message : 'Error deleting marketplace service'), {
      context: 'DELETE /api/admin/marketplace/services/[id]',
      serviceId: params?.id,
      companyId: session?.user?.companyId,
    });
    return NextResponse.json(
      { error: 'Error al eliminar servicio' },
      { status: 500 }
    );
  }
}