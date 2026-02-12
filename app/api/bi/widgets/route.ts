import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// GET /api/bi/widgets - Obtener widgets
export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const widgets = await prisma.biWidget.findMany({
      where: {
        companyId: session?.user?.companyId,
        activo: true,
      },
      orderBy: { posicion: 'asc' },
    });

    return NextResponse.json(widgets);
  } catch (error) {
    logger.error('Error fetching widgets:', error);
    return NextResponse.json(
      { error: 'Error al obtener widgets' },
      { status: 500 }
    );
  }
}

// POST /api/bi/widgets - Crear widget
export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { nombre, descripcion, tipo, dataSource, config, posicion } = body;

    const widget = await prisma.biWidget.create({
      data: {
        companyId: session?.user?.companyId,
        nombre,
        descripcion: descripcion || null,
        tipo,
        dataSource,
        config,
        posicion: posicion || 0,
        creadoPor: session?.user?.email|| '',
      },
    });

    return NextResponse.json(widget, { status: 201 });
  } catch (error) {
    logger.error('Error creating widget:', error);
    return NextResponse.json(
      { error: 'Error al crear widget' },
      { status: 500 }
    );
  }
}
