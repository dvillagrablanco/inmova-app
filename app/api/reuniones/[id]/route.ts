import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requirePermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ordenDiaItemSchema = z.object({
  titulo: z.string().min(1),
});

const asistenteSchema = z.object({
  nombre: z.string().min(1),
});

const reunionUpdateSchema = z.object({
  buildingId: z.string().min(1).optional(),
  titulo: z.string().min(1).trim().optional(),
  descripcion: z.string().optional(),
  fecha: z.string().min(1).optional(),
  lugar: z.string().min(1).optional(),
  ordenDia: z.array(ordenDiaItemSchema).optional(),
  asistentes: z.array(asistenteSchema).optional(),
});

type ReunionUpdateInput = z.infer<typeof reunionUpdateSchema>;

interface ReunionResponse {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  lugar: string;
  ordenDia: Array<{ titulo: string }>;
  asistentes: Array<{ nombre: string }>;
  actaGenerada: boolean;
  building: { id: string; nombre: string };
}

const sanitizeOrdenDia = (items: Array<{ titulo: string }>): Array<{ titulo: string }> =>
  items.map((item) => ({ titulo: item.titulo.trim() })).filter((item) => item.titulo);

const sanitizeAsistentes = (items: Array<{ nombre: string }>): Array<{ nombre: string }> =>
  items.map((item) => ({ nombre: item.nombre.trim() })).filter((item) => item.nombre);

const buildOrdenDel = (descripcion: string, ordenDia: Array<{ titulo: string }>): string =>
  JSON.stringify({ descripcion, ordenDia });

const parseOrdenDel = (
  ordenDel: string
): { descripcion: string; ordenDia: Array<{ titulo: string }> } => {
  if (!ordenDel) return { descripcion: '', ordenDia: [] };

  try {
    const parsed = JSON.parse(ordenDel) as
      | { descripcion?: string; ordenDia?: Array<{ titulo: string }> }
      | Array<{ titulo?: string }>
      | string;

    if (Array.isArray(parsed)) {
      const ordenDia = parsed
        .map((item) => ({
          titulo: String(item?.titulo || item || '').trim(),
        }))
        .filter((item) => item.titulo);
      return { descripcion: '', ordenDia };
    }

    if (typeof parsed === 'object' && parsed !== null) {
      const descripcion = parsed.descripcion ? String(parsed.descripcion) : '';
      const ordenDia = Array.isArray(parsed.ordenDia)
        ? parsed.ordenDia
            .map((item) => ({
              titulo: String(item?.titulo || '').trim(),
            }))
            .filter((item) => item.titulo)
        : [];
      return { descripcion, ordenDia };
    }
  } catch {
    // ignore parse errors
  }

  const fallback = ordenDel.trim();
  return {
    descripcion: fallback,
    ordenDia: fallback ? [{ titulo: fallback }] : [],
  };
};

const mapReunion = (meeting: {
  id: string;
  titulo: string;
  fechaReunion: Date;
  ubicacion: string | null;
  ordenDel: string;
  asistentes: unknown;
  acta: string | null;
  actaFirmada: string | null;
  building: { id: string; nombre: string };
}): ReunionResponse => {
  const ordenInfo = parseOrdenDel(meeting.ordenDel || '');
  const asistentes = Array.isArray(meeting.asistentes) ? (meeting.asistentes as Array<{ nombre: string }>) : [];

  return {
    id: meeting.id,
    titulo: meeting.titulo,
    descripcion: ordenInfo.descripcion,
    fecha: meeting.fechaReunion.toISOString(),
    lugar: meeting.ubicacion || '',
    ordenDia: ordenInfo.ordenDia,
    asistentes,
    actaGenerada: Boolean(meeting.actaFirmada || meeting.acta),
    building: meeting.building,
  };
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    const meeting = await prisma.communityMeeting.findUnique({
      where: { id: params.id },
      include: {
        building: { select: { id: true, nombre: true } },
      },
    });

    if (!meeting || meeting.companyId !== companyId) {
      return NextResponse.json({ error: 'Reunion no encontrada' }, { status: 404 });
    }

    return NextResponse.json(
      mapReunion({
        id: meeting.id,
        titulo: meeting.titulo,
        fechaReunion: meeting.fechaReunion,
        ubicacion: meeting.ubicacion,
        ordenDel: meeting.ordenDel,
        asistentes: meeting.asistentes,
        acta: meeting.acta,
        actaFirmada: meeting.actaFirmada,
        building: meeting.building,
      })
    );
  } catch (error) {
    logger.error('[Reuniones] Error al obtener reunion', error);
    return NextResponse.json({ error: 'Error al obtener reunion' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requirePermission('update');
    const companyId = user.companyId;

    const body = (await req.json()) as ReunionUpdateInput;
    const validationResult = reunionUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        { error: 'Datos invalidos', details: errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const existing = await prisma.communityMeeting.findUnique({
      where: { id: params.id },
      include: {
        building: { select: { id: true, nombre: true } },
      },
    });

    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json({ error: 'Reunion no encontrada' }, { status: 404 });
    }

    const updateData: {
      buildingId?: string;
      titulo?: string;
      fechaReunion?: Date;
      ubicacion?: string;
      ordenDel?: string;
      asistentes?: Array<{ nombre: string }>;
    } = {};

    if (data.buildingId) {
      const building = await prisma.building.findUnique({
        where: { id: data.buildingId },
        select: { id: true, companyId: true },
      });
      if (!building || building.companyId !== companyId) {
        return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
      }
      updateData.buildingId = data.buildingId;
    }

    if (data.titulo) updateData.titulo = data.titulo;
    if (data.lugar) updateData.ubicacion = data.lugar;

    if (data.fecha) {
      const fechaReunion = new Date(data.fecha);
      if (Number.isNaN(fechaReunion.getTime())) {
        return NextResponse.json({ error: 'Fecha invalida' }, { status: 400 });
      }
      updateData.fechaReunion = fechaReunion;
    }

    const existingOrden = parseOrdenDel(existing.ordenDel || '');
    const descripcion = data.descripcion !== undefined ? data.descripcion.trim() : existingOrden.descripcion;
    const ordenDia = data.ordenDia ? sanitizeOrdenDia(data.ordenDia) : existingOrden.ordenDia;

    if (data.descripcion !== undefined || data.ordenDia !== undefined) {
      updateData.ordenDel = buildOrdenDel(descripcion, ordenDia);
    }

    if (data.asistentes) {
      updateData.asistentes = sanitizeAsistentes(data.asistentes);
    }

    const updated = await prisma.communityMeeting.update({
      where: { id: params.id },
      data: updateData,
      include: {
        building: { select: { id: true, nombre: true } },
      },
    });

    return NextResponse.json(
      mapReunion({
        id: updated.id,
        titulo: updated.titulo,
        fechaReunion: updated.fechaReunion,
        ubicacion: updated.ubicacion,
        ordenDel: updated.ordenDel,
        asistentes: updated.asistentes,
        acta: updated.acta,
        actaFirmada: updated.actaFirmada,
        building: updated.building,
      })
    );
  } catch (error: unknown) {
    logger.error('[Reuniones] Error al actualizar reunion', error);
    if (error instanceof Error && error.message?.includes('permiso')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Usuario inactivo') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Error al actualizar reunion' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requirePermission('delete');
    const companyId = user.companyId;

    const existing = await prisma.communityMeeting.findUnique({
      where: { id: params.id },
      select: { id: true, companyId: true },
    });

    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json({ error: 'Reunion no encontrada' }, { status: 404 });
    }

    await prisma.communityMeeting.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Reunion eliminada correctamente' });
  } catch (error: unknown) {
    logger.error('[Reuniones] Error al eliminar reunion', error);
    if (error instanceof Error && error.message?.includes('permiso')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Usuario inactivo') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Error al eliminar reunion' }, { status: 500 });
  }
}
