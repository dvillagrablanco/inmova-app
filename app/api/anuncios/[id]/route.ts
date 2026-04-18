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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 });

    const prisma = await getPrisma();

    const existing = await prisma.notification.findFirst({
      where: { id: params.id, companyId, entityType: 'anuncio' },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 });
    }

    const metadata = JSON.stringify({
      tipo: body.tipo || 'informativo',
      prioridad: body.prioridad || 'normal',
      visiblePara: body.visiblePara || 'todos',
      building: body.buildingId ? { id: body.buildingId } : null,
    });

    const updated = await prisma.notification.update({
      where: { id: params.id },
      data: {
        titulo: body.titulo ?? existing.titulo,
        mensaje: body.contenido ?? existing.mensaje,
        fechaLimite: body.fechaExpiracion ? new Date(body.fechaExpiracion) : null,
        entityId: metadata,
      },
    });

    return NextResponse.json({ success: true, id: updated.id });
  } catch (error) {
    logger.error('Error en /api/anuncios/[id] PATCH', error as any);
    return NextResponse.json({ error: 'Error al actualizar anuncio' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const prisma = await getPrisma();

    const existing = await prisma.notification.findFirst({
      where: { id: params.id, companyId, entityType: 'anuncio' },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 });
    }

    // Soft delete: marcar como leida (= "desactivado" en la UI de anuncios)
    await prisma.notification.update({
      where: { id: params.id },
      data: { leida: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error en /api/anuncios/[id] DELETE', error as any);
    return NextResponse.json({ error: 'Error al eliminar anuncio' }, { status: 500 });
  }
}
