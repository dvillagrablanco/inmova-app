import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requirePermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const voteTypeSchema = z.enum([
  'decision_comunidad',
  'mejora',
  'gasto',
  'normativa',
  'otro',
]);

const voteStatusSchema = z.enum(['activa', 'cerrada', 'cancelada']);

const voteCreateSchema = z.object({
  buildingId: z.string().min(1, 'Edificio requerido'),
  titulo: z.string().min(1, 'Titulo requerido').trim(),
  descripcion: z.string().min(1, 'Descripcion requerida').trim(),
  tipo: voteTypeSchema,
  opciones: z.array(z.string().trim().min(1)).min(2, 'Debe haber al menos 2 opciones'),
  fechaCierre: z.string().min(1, 'Fecha de cierre requerida'),
  quorumRequerido: z.number().min(0).max(100),
  totalVotantes: z.number().min(0),
});

type VoteCreateInput = z.infer<typeof voteCreateSchema>;

interface VoteListItem {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: z.infer<typeof voteTypeSchema>;
  opciones: string[];
  estado: z.infer<typeof voteStatusSchema>;
  quorumRequerido: number;
  totalVotantes: number;
  fechaCierre: string;
  building: {
    id: string;
    nombre: string;
  };
  votos: Array<{ id: string }>;
  createdAt: string;
}

const mapVoteListItem = (vote: {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: z.infer<typeof voteTypeSchema>;
  opciones: unknown;
  estado: z.infer<typeof voteStatusSchema>;
  quorumRequerido: number;
  totalElegibles: number;
  fechaCierre: Date;
  building: { id: string; nombre: string };
  votos: Array<{ id: string }>;
  createdAt: Date;
}): VoteListItem => {
  const opciones = Array.isArray(vote.opciones) ? (vote.opciones as string[]) : [];
  return {
    id: vote.id,
    titulo: vote.titulo,
    descripcion: vote.descripcion,
    tipo: vote.tipo,
    opciones,
    estado: vote.estado,
    quorumRequerido: Number(vote.quorumRequerido),
    totalVotantes: Number(vote.totalElegibles || 0),
    fechaCierre: vote.fechaCierre.toISOString(),
    building: vote.building,
    votos: vote.votos,
    createdAt: vote.createdAt.toISOString(),
  };
};

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    if (!companyId) {
      return NextResponse.json([]);
    }

    const votes = await prisma.communityVote.findMany({
      where: { companyId },
      include: {
        building: {
          select: {
            id: true,
            nombre: true,
          },
        },
        votos: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = votes.map((vote) =>
      mapVoteListItem({
        id: vote.id,
        titulo: vote.titulo,
        descripcion: vote.descripcion,
        tipo: vote.tipo,
        opciones: vote.opciones,
        estado: vote.estado,
        quorumRequerido: vote.quorumRequerido,
        totalElegibles: vote.totalElegibles,
        fechaCierre: vote.fechaCierre,
        building: vote.building,
        votos: vote.votos,
        createdAt: vote.createdAt,
      })
    );

    return NextResponse.json(mapped);
  } catch (error) {
    logger.error('[Votaciones] Error al obtener votaciones', error);
    return NextResponse.json({ error: 'Error al obtener votaciones' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission('create');
    const companyId = user.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const body = (await req.json()) as VoteCreateInput;
    const validationResult = voteCreateSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      logger.warn('[Votaciones] Datos invalidos', { errors });
      return NextResponse.json(
        { error: 'Datos invalidos', details: errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const fechaCierre = new Date(data.fechaCierre);

    if (Number.isNaN(fechaCierre.getTime())) {
      return NextResponse.json(
        { error: 'Fecha de cierre invalida' },
        { status: 400 }
      );
    }

    const building = await prisma.building.findUnique({
      where: { id: data.buildingId },
      select: { id: true, companyId: true, nombre: true },
    });

    if (!building || building.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Edificio no encontrado' },
        { status: 404 }
      );
    }

    const opciones = data.opciones.map((opcion) => opcion.trim()).filter(Boolean);
    if (opciones.length < 2) {
      return NextResponse.json(
        { error: 'Debe haber al menos 2 opciones' },
        { status: 400 }
      );
    }

    const totalElegibles = data.totalVotantes || 0;
    const requiereQuorum = totalElegibles > 0;

    const vote = await prisma.communityVote.create({
      data: {
        companyId,
        buildingId: data.buildingId,
        titulo: data.titulo,
        descripcion: data.descripcion,
        tipo: data.tipo,
        opciones,
        requiereQuorum,
        quorumRequerido: data.quorumRequerido,
        fechaCierre,
        totalElegibles,
        creadoPor: user.id,
      },
      include: {
        building: {
          select: {
            id: true,
            nombre: true,
          },
        },
        votos: {
          select: { id: true },
        },
      },
    });

    logger.info('[Votaciones] Votacion creada', { voteId: vote.id, companyId });

    return NextResponse.json(
      mapVoteListItem({
        id: vote.id,
        titulo: vote.titulo,
        descripcion: vote.descripcion,
        tipo: vote.tipo,
        opciones: vote.opciones,
        estado: vote.estado,
        quorumRequerido: vote.quorumRequerido,
        totalElegibles: vote.totalElegibles,
        fechaCierre: vote.fechaCierre,
        building: vote.building,
        votos: vote.votos,
        createdAt: vote.createdAt,
      }),
      { status: 201 }
    );
  } catch (error: unknown) {
    logger.error('[Votaciones] Error al crear votacion', error);
    if (error instanceof Error && error.message?.includes('permiso')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al crear votacion' }, { status: 500 });
  }
}
