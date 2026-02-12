import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

type SessionUser = {
  id?: string;
  companyId?: string;
};

const updateReunionSchema = z.object({
  buildingId: z.string().min(1).optional(),
  titulo: z.string().min(1).optional(),
  descripcion: z.string().min(1).optional(),
  fecha: z.string().datetime().optional(),
  lugar: z.string().optional(),
  tipo: z.string().optional(),
  ordenDia: z.array(z.object({ titulo: z.string().min(1) })).optional(),
  asistentes: z.array(z.object({ nombre: z.string().min(1) })).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = updateReunionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const existing = await prisma.communityMeeting.findFirst({
      where: { id: params.id, companyId: user.companyId },
      include: { building: { select: { id: true, nombre: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Reunión no encontrada' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.buildingId) updateData.buildingId = parsed.data.buildingId;
    if (parsed.data.titulo) updateData.titulo = parsed.data.titulo;
    if (parsed.data.descripcion) updateData.ordenDel = parsed.data.descripcion;
    if (parsed.data.fecha) updateData.fechaReunion = new Date(parsed.data.fecha);
    if (parsed.data.lugar !== undefined) updateData.ubicacion = parsed.data.lugar;
    if (parsed.data.tipo) updateData.tipo = parsed.data.tipo;
    if (parsed.data.ordenDia) updateData.acuerdos = parsed.data.ordenDia;
    if (parsed.data.asistentes) updateData.asistentes = parsed.data.asistentes;

    const updated = await prisma.communityMeeting.update({
      where: { id: existing.id },
      data: updateData,
      include: { building: { select: { id: true, nombre: true } } },
    });

    return NextResponse.json({
      id: updated.id,
      titulo: updated.titulo,
      descripcion: updated.ordenDel,
      fecha: updated.fechaReunion.toISOString(),
      lugar: updated.ubicacion || '',
      ordenDia: updated.acuerdos ?? [],
      asistentes: updated.asistentes ?? [],
      actaGenerada: Boolean(updated.acta || updated.actaFirmada),
      building: {
        id: updated.building.id,
        nombre: updated.building.nombre,
      },
    });
  } catch (error) {
    logger.error('Error al actualizar reunión', error);
    return NextResponse.json(
      { error: 'Error al actualizar reunión' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const existing = await prisma.communityMeeting.findFirst({
      where: { id: params.id, companyId: user.companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Reunión no encontrada' }, { status: 404 });
    }

    await prisma.communityMeeting.delete({ where: { id: existing.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error al eliminar reunión', error);
    return NextResponse.json(
      { error: 'Error al eliminar reunión' },
      { status: 500 }
    );
  }
}
