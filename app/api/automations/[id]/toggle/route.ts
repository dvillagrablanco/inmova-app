import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const companyId = session?.user?.companyId;
    const { id } = params;
    const body = await request.json();
    const { activa } = body;
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
    // Actualizar estado
    const updated = await prisma.automation.update({
      where: { id },
      data: { activa },
    });
    return NextResponse.json(updated);
  } catch (error) {
    logger.error('Error toggling automation:', error);
    return NextResponse.json(
      { error: 'Error al actualizar automatización' },
      { status: 500 }
    );
  }
}
