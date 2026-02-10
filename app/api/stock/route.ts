/**
 * API Endpoint: Gestión de Stock
 * Inventario general de materiales y productos
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createStockItemSchema = z.object({
  nombre: z.string().min(2),
  sku: z.string().optional(),
  categoria: z.string(),
  cantidad: z.number().int().min(0),
  stockMinimo: z.number().int().min(0).default(0),
  stockMaximo: z.number().int().optional(),
  unidad: z.string().default('unidades'),
  precioUnitario: z.number().min(0).optional(),
  ubicacion: z.string().optional(),
  proveedor: z.string().optional(),
  fechaCaducidad: z.string().optional(),
  notas: z.string().optional(),
});

// Almacenamiento temporal
let stockStore: any[] = [];

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
    const categoria = searchParams.get('categoria');
    const lowStock = searchParams.get('lowStock') === 'true';

    // Filtrar items
    let items = stockStore.filter(i => i.companyId === companyId);

    if (categoria) items = items.filter(i => i.categoria === categoria);
    if (lowStock) items = items.filter(i => i.cantidad <= i.stockMinimo);

    // Stats
    const stats = {
      totalItems: items.length,
      totalUnidades: items.reduce((sum, i) => sum + (i.cantidad || 0), 0),
      valorTotal: items.reduce((sum, i) => sum + ((i.cantidad || 0) * (i.precioUnitario || 0)), 0),
      lowStock: items.filter(i => i.cantidad <= i.stockMinimo).length,
      categorias: [...new Set(items.map(i => i.categoria))].length,
    };

    return NextResponse.json({
      success: true,
      data: items.sort((a, b) => a.nombre.localeCompare(b.nombre)),
      stats,
    });
  } catch (error: any) {
    logger.error('Error fetching stock:', error);
    return NextResponse.json({ error: 'Error al obtener stock' }, { status: 500 });
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
    const validationResult = createStockItemSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const data = validationResult.data;

    const item = {
      id: `stock-${Date.now()}`,
      companyId,
      ...data,
      sku: data.sku || `SKU-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    stockStore.push(item);

    logger.info('Stock item created', { itemId: item.id, companyId });

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Item de stock creado',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating stock item:', error);
    return NextResponse.json({ error: 'Error al crear item' }, { status: 500 });
  }
}
