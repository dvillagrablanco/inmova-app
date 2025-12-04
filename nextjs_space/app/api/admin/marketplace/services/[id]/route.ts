import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

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
    console.error('Error al actualizar servicio:', error);
    return NextResponse.json(
      { error: 'Error al actualizar servicio' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

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
    console.error('Error al eliminar servicio:', error);
    return NextResponse.json(
      { error: 'Error al eliminar servicio' },
      { status: 500 }
    );
  }
}