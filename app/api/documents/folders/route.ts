import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session?.user?.companyId;

    const folders = await prisma.documentFolder.findMany({
      where: { companyId },
      include: {
        subFolders: true,
        documents: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            documents: true,
            subFolders: true,
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return NextResponse.json({ folders });
  } catch (error: any) {
    logger.error('Error fetching folders:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar carpetas' },
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

    const { nombre, descripcion, parentFolderId, color, icono } = await request.json();

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    const companyId = session?.user?.companyId;

    const folder = await prisma.documentFolder.create({
      data: {
        companyId,
        nombre,
        descripcion,
        parentFolderId,
        color,
        icono,
      },
    });

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating folder:', error);
    return NextResponse.json({ error: error.message || 'Error al crear carpeta' }, { status: 500 });
  }
}
