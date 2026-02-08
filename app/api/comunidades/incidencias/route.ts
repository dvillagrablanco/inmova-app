import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import type { Prisma } from '@/types/prisma-types';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

const INCIDENT_TYPE_MAP = {
  averia: 'averia_comun',
  mantenimiento: 'averia_comun',
  limpieza: 'limpieza',
  seguridad: 'seguridad',
  ruidos: 'ruido',
  ruido: 'ruido',
  convivencia: 'convivencia',
  mascota: 'mascota',
  parking: 'parking',
  otro: 'otro',
  averia_comun: 'averia_comun',
} as const;

type IncidentTypeInput = keyof typeof INCIDENT_TYPE_MAP;
const incidentTypeSchema = z.enum(
  Object.keys(INCIDENT_TYPE_MAP) as [IncidentTypeInput, ...IncidentTypeInput[]]
);
const isIncidentTypeInput = (value: string): value is IncidentTypeInput =>
  Object.prototype.hasOwnProperty.call(INCIDENT_TYPE_MAP, value);

const INCIDENT_STATUS_MAP = {
  abierta: 'abierta',
  en_proceso: 'en_proceso',
  pendiente_respuesta: 'en_proceso',
  resuelta: 'resuelta',
  cerrada: 'cerrada',
  rechazada: 'rechazada',
} as const;

type IncidentStatusInput = keyof typeof INCIDENT_STATUS_MAP;
const incidentStatusSchema = z.enum(
  Object.keys(INCIDENT_STATUS_MAP) as [IncidentStatusInput, ...IncidentStatusInput[]]
);
const isIncidentStatusInput = (value: string): value is IncidentStatusInput =>
  Object.prototype.hasOwnProperty.call(INCIDENT_STATUS_MAP, value);

const PRIORIDADES = ['baja', 'media', 'alta', 'urgente'] as const;
type IncidentPriorityValue = (typeof PRIORIDADES)[number];
const isIncidentPriority = (value: string): value is IncidentPriorityValue =>
  PRIORIDADES.includes(value as IncidentPriorityValue);

const createIncidenciaSchema = z.object({
  buildingId: z.string().min(1),
  titulo: z.string().min(1),
  descripcion: z.string().min(1),
  tipo: incidentTypeSchema,
  prioridad: z.enum(PRIORIDADES).default('media'),
  ubicacion: z.string().optional(),
  unitId: z.string().optional(),
  fotos: z.array(z.string()).default([]),
});

const updateIncidenciaSchema = z.object({
  estado: incidentStatusSchema.optional(),
  prioridad: z.enum(PRIORIDADES).optional(),
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
    const where: Prisma.CommunityIncidentWhereInput = { companyId };
    if (targetBuildingId) where.buildingId = targetBuildingId;
    const estadoValue = estado && isIncidentStatusInput(estado) ? INCIDENT_STATUS_MAP[estado] : null;
    const tipoValue = tipo && isIncidentTypeInput(tipo) ? INCIDENT_TYPE_MAP[tipo] : null;
    const prioridadValue = prioridad && isIncidentPriority(prioridad) ? prioridad : null;
    if (estadoValue) where.estado = estadoValue;
    if (tipoValue) where.tipo = tipoValue;
    if (prioridadValue) where.prioridad = prioridadValue;

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
      incidencias: incidencias.map((incidencia) => ({
        ...incidencia,
        building: incidencia.building
          ? { id: incidencia.building.id, name: incidencia.building.nombre }
          : null,
      })),
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Incidencias GET Error]:', { message });
    return NextResponse.json(
      { error: 'Error obteniendo incidencias', details: message },
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

    const sessionUser = session.user as { companyId?: string | null; id?: string | null };
    const companyId = sessionUser.companyId;
    const userId = sessionUser.id;
    if (!companyId || !userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const body = await request.json();
    const validated = createIncidenciaSchema.parse(body);

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
        tipo: INCIDENT_TYPE_MAP[validated.tipo],
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

    return NextResponse.json(
      {
        incidencia: {
          ...incidencia,
          building: incidencia.building
            ? { id: incidencia.building.id, name: incidencia.building.nombre }
            : null,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Incidencias POST Error]:', { message });
    return NextResponse.json(
      { error: 'Error creando incidencia', details: message },
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

    const sessionUser = session.user as { companyId?: string | null };
    const companyId = sessionUser.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
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

    const updateData: Prisma.CommunityIncidentUpdateInput = {
      asignadoA: validated.asignadoA,
      solucion: validated.solucion,
      costoEstimado: validated.costoEstimado,
      costoFinal: validated.costoFinal,
    };

    if (validated.estado) {
      updateData.estado = INCIDENT_STATUS_MAP[validated.estado];
    }

    if (validated.prioridad) {
      updateData.prioridad = validated.prioridad;
    }
    
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

    return NextResponse.json({
      incidencia: {
        ...incidencia,
        building: incidencia.building
          ? { id: incidencia.building.id, name: incidencia.building.nombre }
          : null,
      },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Incidencias PATCH Error]:', { message });
    return NextResponse.json(
      { error: 'Error actualizando incidencia', details: message },
      { status: 500 }
    );
  }
}
