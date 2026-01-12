import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const companyId = session?.user?.companyId;
    const { id } = params;
    // Verificar que la automatización pertenece a la empresa
    const automation = await prisma.automation.findFirst({
      where: { id, companyId },
    });
    if (!automation) {
      return NextResponse.json(
        { error: 'Automatización no encontrada' },
        { status: 404 }
      );
    }
    // Eliminar automatización
    await prisma.automation.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Automatización eliminada' });
  } catch (error) {
    logger.error('Error deleting automation:', error);
    return NextResponse.json(
      { error: 'Error al eliminar automatización' },
      { status: 500 }
    );
  }
}
