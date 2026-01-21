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

const reunionCreateSchema = z.object({
  buildingId: z.string().min(1),
  titulo: z.string().min(1).trim(),
  descripcion: z.string().optional(),
  fecha: z.string().min(1),
  lugar: z.string().min(1),
  ordenDia: z.array(ordenDiaItemSchema).optional(),
  asistentes: z.array(asistenteSchema).optional(),
});

type ReunionCreateInput = z.infer<typeof reunionCreateSchema>;

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

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    const meetings = await prisma.communityMeeting.findMany({
      where: { companyId },
      include: {
        building: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { fechaReunion: 'desc' },
    });

    return NextResponse.json(
      meetings.map((meeting) =>
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
      )
    );
  } catch (error) {
    logger.error('[Reuniones] Error al obtener reuniones', error);
    return NextResponse.json({ error: 'Error al obtener reuniones' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission('create');
    const companyId = user.companyId;

    const body = (await req.json()) as ReunionCreateInput;
    const validationResult = reunionCreateSchema.safeParse(body);

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
    const fechaReunion = new Date(data.fecha);
    if (Number.isNaN(fechaReunion.getTime())) {
      return NextResponse.json({ error: 'Fecha invalida' }, { status: 400 });
    }

    const building = await prisma.building.findUnique({
      where: { id: data.buildingId },
      select: { id: true, companyId: true, nombre: true },
    });

    if (!building || building.companyId !== companyId) {
      return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
    }

    const ordenDia = data.ordenDia ? sanitizeOrdenDia(data.ordenDia) : [];
    const asistentes = data.asistentes ? sanitizeAsistentes(data.asistentes) : [];
    const descripcion = data.descripcion?.trim() || '';

    const meeting = await prisma.communityMeeting.create({
      data: {
        companyId,
        buildingId: data.buildingId,
        titulo: data.titulo,
        tipo: 'ordinaria',
        fechaReunion,
        ubicacion: data.lugar,
        ordenDel: buildOrdenDel(descripcion, ordenDia),
        asistentes,
        estado: 'programada',
        organizadoPor: user.id,
      },
      include: {
        building: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

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
      }),
      { status: 201 }
    );
  } catch (error: unknown) {
    logger.error('[Reuniones] Error al crear reunion', error);
    if (error instanceof Error && error.message?.includes('permiso')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Usuario inactivo') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Error al crear reunion' }, { status: 500 });
  }
}
