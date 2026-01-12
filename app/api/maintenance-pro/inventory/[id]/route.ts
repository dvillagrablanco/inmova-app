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

    const data = await request.json();

    const item = await prisma.maintenanceInventory.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ item });
  } catch (error: any) {
    logger.error('Error updating inventory item:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar item' },
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

    await prisma.maintenanceInventory.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Error deleting inventory item:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar item' },
      { status: 500 }
    );
  }
}
