/**
 * API Endpoint: Movimientos de Inventario
 * 
 * GET /api/warehouse/movements - Listar movimientos
 * POST /api/warehouse/movements - Registrar movimiento
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createMovementSchema = z.object({
  inventoryId: z.string(),
  tipo: z.enum(['entrada', 'salida', 'ajuste']),
  cantidad: z.number().int(),
  motivo: z.string().optional(),
  notas: z.string().optional(),
});

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
    const inventoryId = searchParams.get('inventoryId');
    const tipo = searchParams.get('tipo');
    const limit = parseInt(searchParams.get('limit') || '50');

    const { prisma } = await import('@/lib/db');

    const where: any = {
      inventory: { companyId },
    };

    if (inventoryId) {
      where.inventoryId = inventoryId;
    }
    if (tipo) {
      where.tipo = tipo;
    }

    const movements = await prisma.sTRInventoryMovement.findMany({
      where,
      include: {
        inventory: {
          select: { id: true, nombre: true, categoria: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: movements,
    });
  } catch (error: any) {
    logger.error('Error fetching movements:', error);
    return NextResponse.json({ error: 'Error al obtener movimientos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const userId = session.user.id;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const body = await req.json();
    const validationResult = createMovementSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const data = validationResult.data;
    const { prisma } = await import('@/lib/db');

    // Verificar que el item existe y pertenece a la compañía
    const item = await prisma.maintenanceInventory.findFirst({
      where: { id: data.inventoryId, companyId },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    // Calcular nueva cantidad
    let nuevaCantidad = item.cantidad;
    if (data.tipo === 'entrada') {
      nuevaCantidad += Math.abs(data.cantidad);
    } else if (data.tipo === 'salida') {
      nuevaCantidad -= Math.abs(data.cantidad);
      if (nuevaCantidad < 0) {
        return NextResponse.json({ error: 'Stock insuficiente' }, { status: 400 });
      }
    } else {
      // ajuste
      nuevaCantidad = data.cantidad;
    }

    // Crear movimiento y actualizar cantidad en transacción
    const [movement] = await prisma.$transaction([
      prisma.sTRInventoryMovement.create({
        data: {
          inventoryId: data.inventoryId,
          tipo: data.tipo,
          cantidad: data.cantidad,
          motivo: data.motivo,
          registradoPor: userId,
        },
      }),
      prisma.maintenanceInventory.update({
        where: { id: data.inventoryId },
        data: { cantidad: nuevaCantidad },
      }),
    ]);

    logger.info('Movement registered', { 
      movementId: movement.id, 
      inventoryId: data.inventoryId,
      tipo: data.tipo,
      cantidad: data.cantidad,
    });

    return NextResponse.json({
      success: true,
      data: movement,
      nuevaCantidad,
      message: 'Movimiento registrado',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error registering movement:', error);
    return NextResponse.json({ error: 'Error al registrar movimiento' }, { status: 500 });
  }
}
