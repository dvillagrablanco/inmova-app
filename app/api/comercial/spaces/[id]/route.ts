import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const space = await prisma.commercialSpace.findUnique({
      where: { id: params.id },
      include: {
        building: { select: { nombre: true, direccion: true } },
        commercialLeases: {
          where: { estado: 'activo' },
          include: {
            tenant: { select: { nombreCompleto: true, email: true, telefono: true } },
          },
          take: 1,
        },
      },
    });

    if (!space) {
      return NextResponse.json({ error: 'Espacio no encontrado' }, { status: 404 });
    }

    return NextResponse.json(space);
  } catch (error: any) {
    logger.error('Error fetching commercial space:', error);
    return NextResponse.json({ error: 'Error al obtener espacio' }, { status: 500 });
  }
}
