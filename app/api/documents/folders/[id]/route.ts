import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { nombre, descripcion, parentFolderId, color, icono } = await request.json();

    const folder = await prisma.documentFolder.update({
      where: { id: params.id },
      data: {
        ...(nombre && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(parentFolderId !== undefined && { parentFolderId }),
        ...(color && { color }),
        ...(icono && { icono }),
      },
    });

    return NextResponse.json({ folder });
  } catch (error: any) {
    logger.error('Error updating folder:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar carpeta' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.documentFolder.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Error deleting folder:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar carpeta' },
      { status: 500 }
    );
  }
}
