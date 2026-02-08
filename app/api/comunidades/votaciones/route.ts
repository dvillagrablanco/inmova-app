import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import type { Prisma } from '@/types/prisma-types';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

const VOTE_TYPE_MAP = {
  ordinaria: 'decision_comunidad',
  extraordinaria: 'gasto',
  urgente: 'normativa',
  decision_comunidad: 'decision_comunidad',
  mejora: 'mejora',
  gasto: 'gasto',
  normativa: 'normativa',
  otro: 'otro',
} as const;

type VoteTypeInput = keyof typeof VOTE_TYPE_MAP;
const voteTypeSchema = z.enum(Object.keys(VOTE_TYPE_MAP) as [VoteTypeInput, ...VoteTypeInput[]]);
const isVoteTypeInput = (value: string): value is VoteTypeInput =>
  Object.prototype.hasOwnProperty.call(VOTE_TYPE_MAP, value);

const VOTE_STATUSES = ['activa', 'cerrada', 'cancelada'] as const;
type VoteStatusValue = (typeof VOTE_STATUSES)[number];
const isVoteStatus = (value: string): value is VoteStatusValue =>
  VOTE_STATUSES.includes(value as VoteStatusValue);

type VoteOption = { id: string; texto: string; votos: number };

const createVotacionSchema = z.object({
  buildingId: z.string().min(1),
  titulo: z.string().min(1),
  descripcion: z.string().min(1),
  tipo: voteTypeSchema,
  opciones: z.array(z.object({
    id: z.string(),
    texto: z.string(),
    votos: z.number().default(0),
  })).min(2),
  requiereQuorum: z.boolean().default(true),
  quorumRequerido: z.number().min(0).max(100).default(50),
  fechaCierre: z.string().datetime(),
});

const votarSchema = z.object({
  votacionId: z.string().min(1),
  opcionId: z.string().min(1),
  propietarioId: z.string().min(1),
  coeficiente: z.number().optional(),
});

// GET - Listar votaciones
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const sessionUser = session.user as { companyId?: string | null };
    const companyId = sessionUser.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Empresa no válida' }, { status: 400 });
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
    const where: Prisma.CommunityVoteWhereInput = { companyId };
    if (targetBuildingId) where.buildingId = targetBuildingId;
    const estadoValue = estado && isVoteStatus(estado) ? estado : null;
    if (estadoValue) where.estado = estadoValue;

    const [votaciones, total] = await Promise.all([
      prisma.communityVote.findMany({
        where,
        include: {
          building: {
            select: { id: true, nombre: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.communityVote.count({ where }),
    ]);

    // Estadísticas
    const now = new Date();
    const [activas, cerradas, pendientes] = await Promise.all([
      prisma.communityVote.count({
        where: { ...where, estado: 'activa', fechaCierre: { gt: now } },
      }),
      prisma.communityVote.count({
        where: { ...where, estado: 'cerrada' },
      }),
      prisma.communityVote.count({
        where: { ...where, estado: 'activa', fechaCierre: { lte: now } },
      }),
    ]);

    return NextResponse.json({
      votaciones: votaciones.map((v) => ({
        ...v,
        opciones: Array.isArray(v.opciones) ? (v.opciones as VoteOption[]) : [],
        participacion: v.totalElegibles > 0 
          ? Math.round((v.totalVotos / v.totalElegibles) * 100) 
          : 0,
        quorumAlcanzado: v.totalElegibles > 0
          ? (v.totalVotos / v.totalElegibles) * 100 >= v.quorumRequerido
          : false,
        building: v.building ? { id: v.building.id, name: v.building.nombre } : null,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total,
        activas,
        cerradas,
        pendientesCierre: pendientes,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Votaciones GET Error]:', { message });
    return NextResponse.json(
      { error: 'Error obteniendo votaciones', details: message },
      { status: 500 }
    );
  }
}

// POST - Crear votación
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
      return NextResponse.json({ error: 'Empresa no válida' }, { status: 400 });
    }
    const body = await request.json();

    // Verificar si es un voto o crear votación
    if (body.votacionId && body.opcionId) {
      // Registrar voto
      const validated = votarSchema.parse(body);

      const votacion = await prisma.communityVote.findFirst({
        where: { id: validated.votacionId, companyId },
      });

      if (!votacion) {
        return NextResponse.json({ error: 'Votación no encontrada' }, { status: 404 });
      }

      if (votacion.estado !== 'activa') {
        return NextResponse.json({ error: 'La votación no está activa' }, { status: 400 });
      }

      if (new Date() > votacion.fechaCierre) {
        return NextResponse.json({ error: 'La votación ha cerrado' }, { status: 400 });
      }

      // Actualizar votos
      const opciones = Array.isArray(votacion.opciones)
        ? (votacion.opciones as VoteOption[])
        : [];
      const opcionIndex = opciones.findIndex((o) => o.id === validated.opcionId);
      
      if (opcionIndex === -1) {
        return NextResponse.json({ error: 'Opción no válida' }, { status: 400 });
      }

      opciones[opcionIndex].votos += 1;

      const updated = await prisma.communityVote.update({
        where: { id: validated.votacionId },
        data: {
          opciones,
          totalVotos: votacion.totalVotos + 1,
        },
      });

      return NextResponse.json({
        votacion: updated,
        message: 'Voto registrado correctamente',
      });
    } else {
      // Crear nueva votación
      const validated = createVotacionSchema.parse(body);

      // Verificar que el edificio existe
      const building = await prisma.building.findFirst({
        where: { id: validated.buildingId, companyId },
        include: { units: true },
      });

      if (!building) {
        return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
      }

      const votacion = await prisma.communityVote.create({
        data: {
          companyId,
          buildingId: validated.buildingId,
          titulo: validated.titulo,
          descripcion: validated.descripcion,
          tipo: VOTE_TYPE_MAP[validated.tipo],
          opciones: validated.opciones,
          requiereQuorum: validated.requiereQuorum,
          quorumRequerido: validated.quorumRequerido,
          fechaCierre: new Date(validated.fechaCierre),
          totalElegibles: building.units.length,
          estado: 'activa',
          creadoPor: userId,
        },
        include: {
          building: { select: { id: true, nombre: true } },
        },
      });

      return NextResponse.json(
        {
          votacion: {
            ...votacion,
            building: votacion.building
              ? { id: votacion.building.id, name: votacion.building.nombre }
              : null,
          },
        },
        { status: 201 }
      );
    }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Votaciones POST Error]:', { message });
    return NextResponse.json(
      { error: 'Error procesando votación', details: message },
      { status: 500 }
    );
  }
}
