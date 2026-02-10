import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST - Registrar movimiento de inventario
export async function POST(
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

    const body = await req.json();
    const { tipo, cantidad, motivo, realizadoPor, taskId } = body;

    if (!tipo || !cantidad) {
      return NextResponse.json(
        { error: 'Tipo y cantidad son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el item pertenece a la compañía
    const item = await prisma.sTRHousekeepingInventory.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    // Calcular nuevo stock
    let nuevoStock = item.stockActual;
    if (tipo === 'entrada' || tipo === 'devolucion') {
      nuevoStock += cantidad;
    } else if (tipo === 'salida' || tipo === 'uso') {
      nuevoStock -= cantidad;
      if (nuevoStock < 0) {
        return NextResponse.json(
          { error: 'Stock insuficiente' },
          { status: 400 }
        );
      }
    }

    // Crear movimiento y actualizar stock en una transacción
    const result = await prisma.$transaction([
      prisma.sTRInventoryMovement.create({
        data: {
          inventoryId: params.id,
          tipo,
          cantidad,
          motivo: motivo || null,
          registradoPor: realizadoPor || session.user.name || session.user.email,
          taskId: taskId || null,
        },
      }),
      prisma.sTRHousekeepingInventory.update({
        where: { id: params.id },
        data: { 
          stockActual: nuevoStock,
          fechaUltimoConteo: new Date(),
        },
      }),
    ]);

    return NextResponse.json(
      {
        movimiento: result[0],
        item: result[1],
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error al registrar movimiento:', error);
    return NextResponse.json(
      { error: 'Error al registrar movimiento' },
      { status: 500 }
    );
  }
}
