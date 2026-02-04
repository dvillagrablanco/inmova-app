import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

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

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json(
        {
          actas: [],
          pagination: { page: 1, limit: 20, total: 0, pages: 0 },
          stats: { total: 0, borradores: 0, aprobadas: 0, pendientesAprobacion: 0 },
        },
        { status: 200 }
      );
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
    const where: any = { companyId };
    if (targetBuildingId) where.buildingId = targetBuildingId;
    const allowedEstados = ['borrador', 'aprobada', 'rechazada'] as const;
    if (estado && allowedEstados.includes(estado as (typeof allowedEstados)[number])) {
      where.estado = estado;
    }
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
            select: { id: true, name: true, address: true },
          },
        },
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.communityMinute.count({ where }),
    ]);

    // Estadísticas
    const stats = {
      total,
      borradores: await prisma.communityMinute.count({
        where: { ...where, estado: 'borrador' },
      }),
      aprobadas: await prisma.communityMinute.count({
        where: { ...where, estado: 'aprobada' },
      }),
      pendientesAprobacion: 0,
    };

    return NextResponse.json({
      actas: actas.map(a => ({
        ...a,
        asistentes: a.asistentes as any[],
        ordenDia: a.ordenDia as any[],
        acuerdos: a.acuerdos as any[],
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error: any) {
    if (error?.name === 'PrismaClientValidationError') {
      logger.warn('[Actas GET Warning]:', { name: error?.name, message: error?.message });
      return NextResponse.json(
        {
          actas: [],
          pagination: { page: 1, limit: 20, total: 0, pages: 0 },
          stats: { total: 0, borradores: 0, aprobadas: 0, pendientesAprobacion: 0 },
        },
        { status: 200 }
      );
    }
    logger.error('[Actas GET Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo actas', details: error.message },
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

    const companyId = (session.user as any).companyId;
    const userId = (session.user as any).id;
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
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ acta }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[Actas POST Error]:', error);
    return NextResponse.json(
      { error: 'Error creando acta', details: error.message },
      { status: 500 }
    );
  }
}
