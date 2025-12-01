import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');
    const categoria = searchParams.get('categoria');
    const lowStock = searchParams.get('lowStock') === 'true';

    const companyId = session.user.companyId;

    const where: any = { companyId };
    if (buildingId) where.buildingId = buildingId;
    if (categoria) where.categoria = categoria;
    if (lowStock) {
      where.cantidad = {
        lte: prisma.maintenanceInventory.fields.cantidadMinima,
      };
    }

    const inventory = await prisma.maintenanceInventory.findMany({
      where,
      orderBy: {
        nombre: 'asc',
      },
    });

    return NextResponse.json({ inventory });
  } catch (error: any) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar inventario' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const data = await request.json();

    const item = await prisma.maintenanceInventory.create({
      data: {
        companyId,
        ...data,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear item' },
      { status: 500 }
    );
  }
}
