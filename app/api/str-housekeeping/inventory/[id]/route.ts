import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener item específico
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;

    const item = await prisma.sTRHousekeepingInventory.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        movimientos: {
          orderBy: {
            fecha: 'desc',
          },
          take: 20,
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    logger.error('Error al obtener item:', error);
    return NextResponse.json(
      { error: 'Error al obtener item' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar item
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();

    // Verificar que el item pertenece a la compañía
    const existingItem = await prisma.sTRHousekeepingInventory.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    const updateData: any = {};

    if (body.nombre !== undefined) updateData.nombre = body.nombre;
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
    if (body.categoria !== undefined) updateData.categoria = body.categoria;
    if (body.unidadMedida !== undefined) updateData.unidadMedida = body.unidadMedida;
    if (body.stockActual !== undefined) updateData.stockActual = body.stockActual;
    if (body.stockMinimo !== undefined) updateData.stockMinimo = body.stockMinimo;
    if (body.costoUnitario !== undefined) updateData.costoUnitario = body.costoUnitario;
    if (body.proveedor !== undefined) updateData.proveedor = body.proveedor;
    if (body.ubicacion !== undefined) updateData.ubicacion = body.ubicacion;
    if (body.alertaBajoStock !== undefined) updateData.alertaBajoStock = body.alertaBajoStock;

    const item = await prisma.sTRHousekeepingInventory.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(item);
  } catch (error) {
    logger.error('Error al actualizar item:', error);
    return NextResponse.json(
      { error: 'Error al actualizar item' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar item
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que el item pertenece a la compañía
    const existingItem = await prisma.sTRHousekeepingInventory.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    await prisma.sTRHousekeepingInventory.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Item eliminado correctamente' });
  } catch (error) {
    logger.error('Error al eliminar item:', error);
    return NextResponse.json(
      { error: 'Error al eliminar item' },
      { status: 500 }
    );
  }
}
