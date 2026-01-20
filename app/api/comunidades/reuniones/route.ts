import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

const createReunionSchema = z.object({
  buildingId: z.string().min(1),
  titulo: z.string().min(1),
  tipo: z.enum(['ordinaria', 'extraordinaria', 'junta_propietarios', 'comision']),
  fechaReunion: z.string().datetime(),
  ubicacion: z.string().optional(),
  ordenDia: z.string().min(1),
  enviarConvocatoria: z.boolean().default(false),
});

const updateReunionSchema = z.object({
  estado: z.enum(['programada', 'realizada', 'cancelada']).optional(),
  acta: z.string().optional(),
  acuerdos: z.array(z.object({
    numero: z.number(),
    descripcion: z.string(),
    votacion: z.object({
      aFavor: z.number(),
      enContra: z.number(),
      abstenciones: z.number(),
    }).optional(),
    aprobado: z.boolean(),
  })).optional(),
  asistentes: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    unidad: z.string().optional(),
    representado: z.boolean().default(false),
  })).optional(),
});

// GET - Listar reuniones
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
    const tipo = searchParams.get('tipo');
    const proximas = searchParams.get('proximas') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const companyId = (session.user as any).companyId;

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
    const where: any = { companyId };
    if (targetBuildingId) where.buildingId = targetBuildingId;
    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;
    if (proximas) {
      where.fechaReunion = { gte: new Date() };
      where.estado = 'programada';
    }

    const [reuniones, total] = await Promise.all([
      prisma.communityMeeting.findMany({
        where,
        include: {
          building: {
            select: { id: true, name: true },
          },
        },
        orderBy: { fechaReunion: proximas ? 'asc' : 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.communityMeeting.count({ where }),
    ]);

    // Estadísticas
    const now = new Date();
    const [programadas, realizadas, canceladas] = await Promise.all([
      prisma.communityMeeting.count({
        where: { ...where, estado: 'programada', fechaReunion: { gte: now } },
      }),
      prisma.communityMeeting.count({
        where: { ...where, estado: 'realizada' },
      }),
      prisma.communityMeeting.count({
        where: { ...where, estado: 'cancelada' },
      }),
    ]);

    // Próxima reunión
    const proximaReunion = await prisma.communityMeeting.findFirst({
      where: {
        companyId,
        ...(targetBuildingId && { buildingId: targetBuildingId }),
        estado: 'programada',
        fechaReunion: { gte: now },
      },
      orderBy: { fechaReunion: 'asc' },
      include: {
        building: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      reuniones: reuniones.map(r => ({
        ...r,
        acuerdos: r.acuerdos as any[] || [],
        asistentes: r.asistentes as any[] || [],
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total,
        programadas,
        realizadas,
        canceladas,
      },
      proximaReunion,
    });
  } catch (error: any) {
    logger.error('[Reuniones GET Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo reuniones', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Crear reunión
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const userId = (session.user as any).id;
    const body = await request.json();
    const validated = createReunionSchema.parse(body);

    // Verificar que el edificio existe
    const building = await prisma.building.findFirst({
      where: { id: validated.buildingId, companyId },
    });

    if (!building) {
      return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
    }

    const reunion = await prisma.communityMeeting.create({
      data: {
        companyId,
        buildingId: validated.buildingId,
        titulo: validated.titulo,
        tipo: validated.tipo,
        fechaReunion: new Date(validated.fechaReunion),
        ubicacion: validated.ubicacion,
        ordenDel: validated.ordenDia,
        estado: 'programada',
        organizadoPor: userId,
      },
      include: {
        building: { select: { id: true, name: true } },
      },
    });

    // TODO: Si enviarConvocatoria es true, enviar emails a propietarios

    return NextResponse.json({ reunion }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[Reuniones POST Error]:', error);
    return NextResponse.json(
      { error: 'Error creando reunión', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar reunión
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de reunión requerido' }, { status: 400 });
    }

    const body = await request.json();
    const validated = updateReunionSchema.parse(body);

    const existing = await prisma.communityMeeting.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Reunión no encontrada' }, { status: 404 });
    }

    const reunion = await prisma.communityMeeting.update({
      where: { id },
      data: validated,
      include: {
        building: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ reunion });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[Reuniones PATCH Error]:', error);
    return NextResponse.json(
      { error: 'Error actualizando reunión', details: error.message },
      { status: 500 }
    );
  }
}
