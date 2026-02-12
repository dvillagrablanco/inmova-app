import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import crypto from 'crypto';

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

type VoteOption = {
  id: string;
  texto: string;
  votos: number;
};

const createVoteSchema = z.object({
  buildingId: z.string().min(1),
  titulo: z.string().min(1),
  descripcion: z.string().min(1),
  tipo: z.enum(['decision_comunidad', 'mejora', 'gasto', 'normativa', 'otro']),
  opciones: z.array(z.string().min(1)).min(2),
  fechaCierre: z.string().datetime(),
  quorumRequerido: z.number().min(0).max(100).optional(),
  totalVotantes: z.number().min(0).optional(),
});

async function normalizeOptions(value: unknown): VoteOption[] {
  const prisma = await getPrisma();
  if (!Array.isArray(value)) {
    return [];
  }

  if (value.every((item) => typeof item === 'string')) {
    return (value as string[]).map((texto, index) => ({
      id: `opt-${index + 1}`,
      texto,
      votos: 0,
    }));
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const record = item as Record<string, unknown>;
      const texto = typeof record.texto === 'string' ? record.texto : null;
      if (!texto) {
        return null;
      }
      const id =
        typeof record.id === 'string' && record.id.length > 0
          ? record.id
          : `opt-${crypto.randomUUID()}`;
      const votos = typeof record.votos === 'number' ? record.votos : 0;
      return { id, texto, votos };
    })
    .filter((item): item is VoteOption => item !== null);
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const votos = await prisma.communityVote.findMany({
      where: { companyId: user.companyId },
      include: {
        building: { select: { id: true, nombre: true } },
        votos: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const response = votos.map((vote) => ({
      id: vote.id,
      titulo: vote.titulo,
      descripcion: vote.descripcion,
      tipo: vote.tipo,
      opciones: normalizeOptions(vote.opciones).map((option) => option.texto),
      estado: vote.estado,
      quorumRequerido: vote.quorumRequerido,
      totalVotantes: vote.totalElegibles,
      fechaCierre: vote.fechaCierre.toISOString(),
      fechaResultado: null,
      resultado: vote.opcionGanadora,
      building: {
        id: vote.building.id,
        nombre: vote.building.nombre,
      },
      votos: vote.votos,
      createdAt: vote.createdAt.toISOString(),
    }));

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error al obtener votaciones', error);
    return NextResponse.json(
      { error: 'Error al obtener votaciones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId || !user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = createVoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const opciones = parsed.data.opciones.map((texto, index) => ({
      id: `opt-${index + 1}`,
      texto,
      votos: 0,
    }));

    const vote = await prisma.communityVote.create({
      data: {
        companyId: user.companyId,
        buildingId: parsed.data.buildingId,
        titulo: parsed.data.titulo,
        descripcion: parsed.data.descripcion,
        tipo: parsed.data.tipo,
        opciones,
        requiereQuorum: (parsed.data.quorumRequerido ?? 0) > 0,
        quorumRequerido: parsed.data.quorumRequerido ?? 50,
        fechaCierre: new Date(parsed.data.fechaCierre),
        totalElegibles: parsed.data.totalVotantes ?? 0,
        creadoPor: user.id,
      },
      include: {
        building: { select: { id: true, nombre: true } },
        votos: true,
      },
    });

    return NextResponse.json(
      {
        id: vote.id,
        titulo: vote.titulo,
        descripcion: vote.descripcion,
        tipo: vote.tipo,
        opciones: normalizeOptions(vote.opciones).map((option) => option.texto),
        estado: vote.estado,
        quorumRequerido: vote.quorumRequerido,
        totalVotantes: vote.totalElegibles,
        fechaCierre: vote.fechaCierre.toISOString(),
        fechaResultado: null,
        resultado: vote.opcionGanadora,
        building: {
          id: vote.building.id,
          nombre: vote.building.nombre,
        },
        votos: vote.votos,
        createdAt: vote.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error al crear votación', error);
    return NextResponse.json(
      { error: 'Error al crear votación' },
      { status: 500 }
    );
  }
}
