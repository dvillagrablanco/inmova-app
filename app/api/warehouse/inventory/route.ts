/**
 * API Endpoint: Inventario de Almacén
 * 
 * GET /api/warehouse/inventory - Listar inventario
 * POST /api/warehouse/inventory - Crear item de inventario
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createItemSchema = z.object({
  nombre: z.string().min(2),
  categoria: z.string(),
  descripcion: z.string().optional(),
  codigoSKU: z.string().optional(),
  cantidad: z.number().int().min(0).default(0),
  cantidadMinima: z.number().int().min(0).default(5),
  unidadMedida: z.string().default('unidad'),
  costoUnitario: z.number().min(0).default(0),
  proveedor: z.string().optional(),
  ubicacion: z.string().optional(),
  buildingId: z.string().optional(),
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
    const categoria = searchParams.get('categoria');
    const lowStock = searchParams.get('lowStock') === 'true';
    const buildingId = searchParams.get('buildingId');

    const { prisma } = await import('@/lib/db');

    const where: any = { companyId };

    if (categoria) {
      where.categoria = categoria;
    }
    if (buildingId) {
      where.buildingId = buildingId;
    }

    // Primero obtenemos todos los items
    let items = await prisma.maintenanceInventory.findMany({
      where,
      orderBy: [
        { categoria: 'asc' },
        { nombre: 'asc' },
      ],
    });

    // Si hay items con buildingId, obtener los nombres de los edificios
    const buildingIds = [...new Set(items.filter(i => i.buildingId).map(i => i.buildingId!))];
    let buildingsMap: Record<string, { id: string; nombre: string }> = {};
    
    if (buildingIds.length > 0) {
      const buildings = await prisma.building.findMany({
        where: { id: { in: buildingIds } },
        select: { id: true, nombre: true },
      });
      buildingsMap = buildings.reduce((acc, b) => {
        acc[b.id] = b;
        return acc;
      }, {} as Record<string, { id: string; nombre: string }>);
    }

    // Filtrar por stock bajo si se solicita
    if (lowStock) {
      items = items.filter(item => item.cantidad <= item.cantidadMinima);
    }

    // Calcular items con stock bajo y añadir info de building
    const itemsWithStatus = items.map(item => ({
      ...item,
      building: item.buildingId ? buildingsMap[item.buildingId] || null : null,
      stockBajo: item.cantidad <= item.cantidadMinima,
      valorTotal: item.cantidad * item.costoUnitario,
    }));

    // Stats
    const stats = {
      totalItems: items.length,
      stockBajo: itemsWithStatus.filter(i => i.stockBajo).length,
      valorTotal: itemsWithStatus.reduce((sum, i) => sum + i.valorTotal, 0),
      categorias: [...new Set(items.map(i => i.categoria))].length,
    };

    return NextResponse.json({
      success: true,
      data: itemsWithStatus,
      stats,
    });
  } catch (error: any) {
    logger.error('Error fetching warehouse inventory:', error);
    return NextResponse.json({ error: 'Error al obtener inventario' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const body = await req.json();
    const validationResult = createItemSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const data = validationResult.data;
    const { prisma } = await import('@/lib/db');

    const item = await prisma.maintenanceInventory.create({
      data: {
        companyId,
        ...data,
      },
    });

    logger.info('Warehouse item created', { itemId: item.id, companyId });

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Item de inventario creado',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating warehouse item:', error);
    return NextResponse.json({ error: 'Error al crear item' }, { status: 500 });
  }
}
