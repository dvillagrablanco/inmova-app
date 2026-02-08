import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import type { Prisma } from '@/types/prisma-types';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

const createActaSchema = z.object({
  buildingId: z.string().min(1),
  fecha: z.string().datetime(),
  convocatoria: z.string().min(1),
  asistentes: z.array(z.object({
    nombre: z.string(),
    unidad: z.string().optional(),
    representado: z.boolean().default(false),
  })),
  ordenDia: z.array(z.object({
    numero: z.number(),
    titulo: z.string(),
    descripcion: z.string().optional(),
  })),
  acuerdos: z.array(z.object({
    numero: z.number(),
    descripcion: z.string(),
    votacion: z.object({
      aFavor: z.number().default(0),
      enContra: z.number().default(0),
      abstenciones: z.number().default(0),
    }).optional(),
    aprobado: z.boolean(),
  })).optional(),
  observaciones: z.string().optional(),
});

const ACTA_ESTADOS = ['borrador', 'aprobada', 'rechazada'] as const;
type ActaEstadoValue = (typeof ACTA_ESTADOS)[number];
const isActaEstado = (value: string): value is ActaEstadoValue =>
  ACTA_ESTADOS.includes(value as ActaEstadoValue);

type ActaAsistente = { nombre: string; unidad?: string; representado?: boolean };
type ActaOrdenDia = { numero: number; titulo: string; descripcion?: string };
type ActaAcuerdo = {
  numero: number;
  descripcion: string;
  aprobado: boolean;
  votacion?: { aFavor: number; enContra: number; abstenciones: number };
};

// GET - Listar actas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');
    const comunidadId = searchParams.get('comunidadId');
    const estado = searchParams.get('estado');
    const year = searchParams.get('year');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const sessionUser = session.user as { companyId?: string | null };
    const companyId = sessionUser.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener buildingId si se proporciona comunidadId
    let targetBuildingId = buildingId;
    if (comunidadId && !buildingId) {
      const comunidad = await prisma.communityManagement.findFirst({
        where: { id: comunidadId, companyId },
        select: { buildingId: true },
      });
      targetBuildingId = comunidad?.buildingId || null;
    }

    // Construir filtros
    const where: Prisma.CommunityMinuteWhereInput = { companyId };
    if (targetBuildingId) where.buildingId = targetBuildingId;
    const estadoValue = estado && isActaEstado(estado) ? estado : null;
    if (estadoValue) where.estado = estadoValue;
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      where.fecha = { gte: startDate, lte: endDate };
    }

    const [actas, total] = await Promise.all([
      prisma.communityMinute.findMany({
        where,
        include: {
          building: {
            select: { id: true, nombre: true, direccion: true },
          },
        },
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.communityMinute.count({ where }),
    ]);

    // Estadísticas
    const [borradores, aprobadas, rechazadas] = await Promise.all([
      prisma.communityMinute.count({
        where: { ...where, estado: 'borrador' },
      }),
      prisma.communityMinute.count({
        where: { ...where, estado: 'aprobada' },
      }),
      prisma.communityMinute.count({
        where: { ...where, estado: 'rechazada' },
      }),
    ]);

    const stats = {
      total,
      borradores,
      aprobadas,
      pendientesAprobacion: borradores,
      rechazadas,
    };

    return NextResponse.json({
      actas: actas.map((a) => ({
        ...a,
        asistentes: Array.isArray(a.asistentes)
          ? (a.asistentes as ActaAsistente[])
          : [],
        ordenDia: Array.isArray(a.ordenDia)
          ? (a.ordenDia as ActaOrdenDia[])
          : [],
        acuerdos: Array.isArray(a.acuerdos)
          ? (a.acuerdos as ActaAcuerdo[])
          : [],
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Actas GET Error]:', { message });
    return NextResponse.json(
      { error: 'Error obteniendo actas', details: message },
      { status: 500 }
    );
  }
}

// POST - Crear acta
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const sessionUser = session.user as { companyId?: string | null; id?: string | null };
    const companyId = sessionUser.companyId;
    const userId = sessionUser.id;
    if (!companyId || !userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const body = await request.json();
    const validated = createActaSchema.parse(body);

    // Verificar que el edificio existe y pertenece a la empresa
    const building = await prisma.building.findFirst({
      where: { id: validated.buildingId, companyId },
    });

    if (!building) {
      return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
    }

    // Obtener el siguiente número de acta
    const lastActa = await prisma.communityMinute.findFirst({
      where: { companyId, buildingId: validated.buildingId },
      orderBy: { numeroActa: 'desc' },
      select: { numeroActa: true },
    });

    const numeroActa = (lastActa?.numeroActa || 0) + 1;

    const acta = await prisma.communityMinute.create({
      data: {
        companyId,
        buildingId: validated.buildingId,
        numeroActa,
        fecha: new Date(validated.fecha),
        convocatoria: validated.convocatoria,
        asistentes: validated.asistentes,
        ordenDia: validated.ordenDia,
        acuerdos: validated.acuerdos || [],
        estado: 'borrador',
        observaciones: validated.observaciones,
        creadoPor: userId,
      },
      include: {
        building: {
          select: { id: true, nombre: true },
        },
      },
    });

    return NextResponse.json({ acta }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Actas POST Error]:', { message });
    return NextResponse.json(
      { error: 'Error creando acta', details: message },
      { status: 500 }
    );
  }
}
