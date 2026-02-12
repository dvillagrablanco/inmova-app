/**
 * API Endpoint: Movimientos de Inventario
 * 
 * Nota: MaintenanceInventory no tiene tabla de movimientos asociada.
 * Los movimientos se registran actualizando directamente la cantidad
 * y guardando un log simplificado.
 * 
 * GET /api/warehouse/movements - Listar items con cambios recientes
 * POST /api/warehouse/movements - Registrar movimiento (actualiza cantidad)
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

    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const companyId = cookieCompanyId || session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const { prisma } = await import('@/lib/db');

    // Obtener items actualizados recientemente como "movimientos"
    const recentItems = await prisma.maintenanceInventory.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        nombre: true,
        categoria: true,
        cantidad: true,
        updatedAt: true,
        notas: true,
      },
    });

    // Simular formato de movimientos para compatibilidad con frontend
    const movements = recentItems.map(item => ({
      id: `mov-${item.id}-${item.updatedAt.getTime()}`,
      inventoryId: item.id,
      inventory: {
        id: item.id,
        nombre: item.nombre,
        categoria: item.categoria,
      },
      tipo: 'ajuste' as const,
      cantidad: item.cantidad,
      motivo: item.notas || 'Actualización de inventario',
      fecha: item.updatedAt,
      createdAt: item.updatedAt,
    }));

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
      // ajuste - establece la cantidad directamente
      nuevaCantidad = data.cantidad;
    }

    // Actualizar cantidad y guardar nota del movimiento
    const updatedItem = await prisma.maintenanceInventory.update({
      where: { id: data.inventoryId },
      data: { 
        cantidad: nuevaCantidad,
        notas: `${data.tipo.toUpperCase()}: ${data.cantidad} unidades. ${data.motivo || ''} (${new Date().toLocaleString('es-ES')})`,
      },
    });

    logger.info('Inventory movement registered', { 
      inventoryId: data.inventoryId,
      tipo: data.tipo,
      cantidad: data.cantidad,
      nuevaCantidad,
      userId,
    });

    // Crear objeto de movimiento para respuesta
    const movement = {
      id: `mov-${item.id}-${Date.now()}`,
      inventoryId: data.inventoryId,
      tipo: data.tipo,
      cantidad: data.cantidad,
      motivo: data.motivo,
      registradoPor: userId,
      fecha: new Date(),
      createdAt: new Date(),
    };

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
