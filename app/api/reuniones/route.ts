import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SessionUser = {
  id?: string;
  companyId?: string;
};

const reunionSchema = z.object({
  buildingId: z.string().min(1),
  titulo: z.string().min(1),
  descripcion: z.string().min(1),
  fecha: z.string().datetime(),
  lugar: z.string().optional(),
  tipo: z.string().optional(),
  ordenDia: z.array(z.object({ titulo: z.string().min(1) })).optional(),
  asistentes: z.array(z.object({ nombre: z.string().min(1) })).optional(),
});

function parseArray<T>(
  value: unknown,
  mapItem: (item: Record<string, unknown>) => T | null
): T[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      return mapItem(item as Record<string, unknown>);
    })
    .filter((item): item is T => item !== null);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const reuniones = await prisma.communityMeeting.findMany({
      where: { companyId: user.companyId },
      include: {
        building: { select: { id: true, nombre: true } },
      },
      orderBy: { fechaReunion: 'desc' },
    });

    const response = reuniones.map((reunion) => ({
      id: reunion.id,
      titulo: reunion.titulo,
      descripcion: reunion.ordenDel,
      fecha: reunion.fechaReunion.toISOString(),
      lugar: reunion.ubicacion || '',
      ordenDia: parseArray(reunion.acuerdos, (item) => {
        const titulo = typeof item.titulo === 'string' ? item.titulo : null;
        return titulo ? { titulo } : null;
      }),
      asistentes: parseArray(reunion.asistentes, (item) => {
        const nombre = typeof item.nombre === 'string' ? item.nombre : null;
        return nombre ? { nombre } : null;
      }),
      actaGenerada: Boolean(reunion.acta || reunion.actaFirmada),
      building: {
        id: reunion.building.id,
        nombre: reunion.building.nombre,
      },
    }));

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error al obtener reuniones', error);
    return NextResponse.json(
      { error: 'Error al obtener reuniones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId || !user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = reunionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const reunion = await prisma.communityMeeting.create({
      data: {
        companyId: user.companyId,
        buildingId: parsed.data.buildingId,
        titulo: parsed.data.titulo,
        tipo: parsed.data.tipo || 'ordinaria',
        fechaReunion: new Date(parsed.data.fecha),
        ubicacion: parsed.data.lugar || '',
        ordenDel: parsed.data.descripcion,
        acuerdos: parsed.data.ordenDia ?? [],
        asistentes: parsed.data.asistentes ?? [],
        estado: 'programada',
        organizadoPor: user.id,
      },
      include: {
        building: { select: { id: true, nombre: true } },
      },
    });

    return NextResponse.json(
      {
        id: reunion.id,
        titulo: reunion.titulo,
        descripcion: reunion.ordenDel,
        fecha: reunion.fechaReunion.toISOString(),
        lugar: reunion.ubicacion || '',
        ordenDia: parsed.data.ordenDia ?? [],
        asistentes: parsed.data.asistentes ?? [],
        actaGenerada: Boolean(reunion.acta || reunion.actaFirmada),
        building: {
          id: reunion.building.id,
          nombre: reunion.building.nombre,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error al crear reunión', error);
    return NextResponse.json(
      { error: 'Error al crear reunión' },
      { status: 500 }
    );
  }
}
