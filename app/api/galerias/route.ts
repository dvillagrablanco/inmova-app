import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/galerias - Obtener galerías
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unitId = searchParams.get('unitId');

    const galerias = await prisma.propertyGallery.findMany({
      where: {
        companyId: session?.user?.companyId,
        ...(unitId && { unitId }),
      },
      include: {
        unit: {
          select: {
            numero: true,
            building: { select: { nombre: true } },
          },
        },
        items: {
          orderBy: { orden: 'asc' },
        },
      },
    });

    return NextResponse.json(galerias);
  } catch (error) {
    logger.error('Error fetching galerias:', error);
    return NextResponse.json(
      { error: 'Error al obtener galerías' },
      { status: 500 }
    );
  }
}

// POST /api/galerias - Crear galería
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { unitId, portada, urlTourVirtual, embedCode, usarMarcaAgua } = body;

    const galeria = await prisma.propertyGallery.create({
      data: {
        companyId: session?.user?.companyId,
        unitId,
        portada,
        urlTourVirtual,
        embedCode,
        usarMarcaAgua: usarMarcaAgua !== undefined ? usarMarcaAgua : true,
        orden: [],
      },
      include: {
        unit: {
          include: {
            building: true,
          },
        },
      },
    });

    return NextResponse.json(galeria, { status: 201 });
  } catch (error) {
    logger.error('Error creating galeria:', error);
    return NextResponse.json(
      { error: 'Error al crear galería' },
      { status: 500 }
    );
  }
}
