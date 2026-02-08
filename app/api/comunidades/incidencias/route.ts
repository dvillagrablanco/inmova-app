import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

const createIncidenciaSchema = z.object({
  buildingId: z.string().min(1),
  titulo: z.string().min(1),
  descripcion: z.string().min(1),
  tipo: z.enum([
    'averia',
    'mantenimiento',
    'limpieza',
    'seguridad',
    'ruidos',
    'otro',
    'ruido',
    'averia_comun',
    'convivencia',
    'mascota',
    'parking',
  ]),
  prioridad: z.enum(['baja', 'media', 'alta', 'urgente']).default('media'),
  ubicacion: z.string().optional(),
  unitId: z.string().optional(),
  fotos: z.array(z.string()).default([]),
});

const updateIncidenciaSchema = z.object({
  estado: z.enum(['abierta', 'en_proceso', 'pendiente_respuesta', 'resuelta', 'cerrada']).optional(),
  prioridad: z.enum(['baja', 'media', 'alta', 'urgente']).optional(),
  asignadoA: z.string().optional(),
  solucion: z.string().optional(),
  costoEstimado: z.number().optional(),
  costoFinal: z.number().optional(),
});

// GET - Listar incidencias
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
    const prioridad = searchParams.get('prioridad');
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
    if (prioridad) where.prioridad = prioridad;

    const [incidencias, total] = await Promise.all([
      prisma.communityIncident.findMany({
        where,
        include: {
          building: {
            select: { id: true, nombre: true },
          },
        },
        orderBy: [
          { prioridad: 'desc' },
          { fechaReporte: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.communityIncident.count({ where }),
    ]);

    // Estadísticas
    const statsWhere = targetBuildingId ? { companyId, buildingId: targetBuildingId } : { companyId };
    
    const [abiertas, enProceso, resueltas, urgentes] = await Promise.all([
      prisma.communityIncident.count({ where: { ...statsWhere, estado: 'abierta' } }),
      prisma.communityIncident.count({ where: { ...statsWhere, estado: 'en_proceso' } }),
      prisma.communityIncident.count({ where: { ...statsWhere, estado: 'resuelta' } }),
      prisma.communityIncident.count({ where: { ...statsWhere, prioridad: 'urgente', estado: { notIn: ['resuelta', 'cerrada'] } } }),
    ]);

    // Tiempo medio de resolución (últimos 30 días)
    const resolucionesRecientes = await prisma.communityIncident.findMany({
      where: {
        ...statsWhere,
        estado: 'resuelta',
        fechaResolucion: { not: null },
        fechaReporte: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { fechaReporte: true, fechaResolucion: true },
    });

    const tiempoMedioResolucion = resolucionesRecientes.length > 0
      ? Math.round(
          resolucionesRecientes.reduce((acc, i) => {
            const diff = (i.fechaResolucion!.getTime() - i.fechaReporte.getTime()) / (1000 * 60 * 60 * 24);
            return acc + diff;
          }, 0) / resolucionesRecientes.length
        )
      : 0;

    return NextResponse.json({
      incidencias,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total,
        abiertas,
        enProceso,
        resueltas,
        urgentes,
        tiempoMedioResolucion,
      },
    });
  } catch (error: any) {
    logger.error('[Incidencias GET Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo incidencias', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Crear incidencia
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const userId = (session.user as any).id;
    const body = await request.json();
    const validated = createIncidenciaSchema.parse(body);
    const normalizedTipo = (
      validated.tipo === 'ruidos'
        ? 'ruido'
        : validated.tipo === 'averia' || validated.tipo === 'mantenimiento'
          ? 'averia_comun'
          : validated.tipo
    ) as
      | 'ruido'
      | 'averia_comun'
      | 'limpieza'
      | 'seguridad'
      | 'convivencia'
      | 'mascota'
      | 'parking'
      | 'otro';

    // Verificar que el edificio existe
    const building = await prisma.building.findFirst({
      where: { id: validated.buildingId, companyId },
    });

    if (!building) {
      return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
    }

    const incidencia = await prisma.communityIncident.create({
      data: {
        companyId,
        buildingId: validated.buildingId,
        reportedBy: userId,
        reporterType: 'user',
        titulo: validated.titulo,
        descripcion: validated.descripcion,
        tipo: normalizedTipo,
        prioridad: validated.prioridad,
        ubicacion: validated.ubicacion,
        unitId: validated.unitId,
        fotos: validated.fotos,
        estado: 'abierta',
      },
      include: {
        building: { select: { id: true, nombre: true } },
      },
    });

    return NextResponse.json({ incidencia }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[Incidencias POST Error]:', error);
    return NextResponse.json(
      { error: 'Error creando incidencia', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar incidencia
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
      return NextResponse.json({ error: 'ID de incidencia requerido' }, { status: 400 });
    }

    const body = await request.json();
    const validated = updateIncidenciaSchema.parse(body);

    const existing = await prisma.communityIncident.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Incidencia no encontrada' }, { status: 404 });
    }

    const updateData: any = { ...validated };
    
    // Si se marca como resuelta, registrar fecha
    if (validated.estado === 'resuelta' && existing.estado !== 'resuelta') {
      updateData.fechaResolucion = new Date();
    }

    const incidencia = await prisma.communityIncident.update({
      where: { id },
      data: updateData,
      include: {
        building: { select: { id: true, nombre: true } },
      },
    });

    return NextResponse.json({ incidencia });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[Incidencias PATCH Error]:', error);
    return NextResponse.json(
      { error: 'Error actualizando incidencia', details: error.message },
      { status: 500 }
    );
  }
}
