import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener inventario
export async function GET(req: NextRequest) {
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
    (session.user as any).companyId = __resolvedCompanyId;, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const categoria = searchParams.get('categoria');
    const bajoStock = searchParams.get('bajoStock');

    const where: any = {
      companyId: session.user.companyId,
    };

    if (categoria) where.categoria = categoria;
    if (bajoStock === 'true') {
      where.stockActual = {
        lte: prisma.sTRHousekeepingInventory.fields.stockMinimo,
      };
    }

    const items = await prisma.sTRHousekeepingInventory.findMany({
      where,
      include: {
        _count: {
          select: {
            movimientos: true,
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    logger.error('Error al obtener inventario:', error);
    return NextResponse.json(
      { error: 'Error al obtener inventario' },
      { status: 500 }
    );
  }
}

// POST - Crear item de inventario
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      nombre,
      descripcion,
      categoria,
      unidadMedida,
      stockActual,
      stockMinimo,
      costoUnitario,
      ubicacion,
    } = body;

    if (!nombre || !categoria) {
      return NextResponse.json(
        { error: 'Nombre y categoría son requeridos' },
        { status: 400 }
      );
    }

    const item = await prisma.sTRHousekeepingInventory.create({
      data: {
        companyId: session.user.companyId,
        nombre,
        categoria,
        stockActual: stockActual || 0,
        stockMinimo: stockMinimo || 5,
        costoUnitario: costoUnitario || null,
        ubicacion: ubicacion || null,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    logger.error('Error al crear item:', error);
    return NextResponse.json(
      { error: 'Error al crear item' },
      { status: 500 }
    );
  }
}
