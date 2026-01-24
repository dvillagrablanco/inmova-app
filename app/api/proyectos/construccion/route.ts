import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requirePermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  address: z.string().min(1),
  type: z.enum([
    'obra_nueva',
    'reforma_integral',
    'reforma_parcial',
    'rehabilitacion',
    'ampliacion',
  ]),
  status: z.enum(['planificacion', 'en_curso', 'pausado', 'finalizado', 'cancelado']).optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  budget: z.number().min(0).optional(),
  client: z.string().optional(),
  contractor: z.string().optional(),
});

type ProjectInput = z.infer<typeof projectSchema>;

const mapProjectStatus = (estado: string | null) => {
  const normalized = estado || 'planificacion';
  const allowed = ['planificacion', 'en_curso', 'pausado', 'finalizado', 'cancelado'];
  if (allowed.includes(normalized)) return normalized;
  return 'planificacion';
};

const allowedTypes = [
  'obra_nueva',
  'reforma_integral',
  'reforma_parcial',
  'rehabilitacion',
  'ampliacion',
];

const mapProject = (project: {
  id: string;
  nombre: string;
  descripcion: string;
  direccion: string;
  tipoProyecto: string;
  estado: string;
  fechaInicio: Date;
  fechaFinPrevista: Date;
  presupuestoTotal: number;
  gastosReales: number;
  porcentajeAvance: number;
  arquitecto: string | null;
  constructor: string | null;
  createdAt: Date;
  updatedAt: Date;
  workOrders: Array<{
    id: string;
    titulo: string;
    descripcion: string;
    fechaInicio: Date;
    fechaFin: Date;
    estado: string;
    porcentajeAvance: number;
    subcontratista: string;
    presupuesto: number;
    costoReal: number | null;
  }>;
}) => ({
  id: project.id,
  name: project.nombre,
  description: project.descripcion,
  address: project.direccion,
  type: allowedTypes.includes(project.tipoProyecto) ? project.tipoProyecto : 'reforma_integral',
  status: mapProjectStatus(project.estado),
  startDate: project.fechaInicio.toISOString(),
  endDate: project.fechaFinPrevista.toISOString(),
  budget: project.presupuestoTotal,
  spent: project.gastosReales,
  progress: project.porcentajeAvance,
  client: project.arquitecto || undefined,
  contractor: project.constructor || undefined,
  tasks: project.workOrders.map((task) => ({
    id: task.id,
    name: task.titulo,
    description: task.descripcion,
    startDate: task.fechaInicio.toISOString(),
    endDate: task.fechaFin.toISOString(),
    progress: task.porcentajeAvance,
    status: task.estado,
    priority: 'media',
    assignee: task.subcontratista,
    estimatedCost: task.presupuesto,
    actualCost: task.costoReal ?? undefined,
  })),
  createdAt: project.createdAt.toISOString(),
  updatedAt: project.updatedAt.toISOString(),
});

/**
 * GET /api/proyectos/construccion
 * Obtiene los proyectos de construcción
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    const projects = await prisma.constructionProject.findMany({
      where: { companyId },
      include: {
        workOrders: {
          orderBy: { fechaInicio: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      projects: projects.map(mapProject),
      total: projects.length,
    });
  } catch (error: any) {
    logger.error('[Construcción Projects Error]:', error);
    if (error instanceof Error && error.message.includes('No autenticado')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('No tienes permiso')) {
      return NextResponse.json({ error: 'Permiso denegado' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Error al obtener proyectos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/proyectos/construccion
 * Crear un nuevo proyecto de construcción
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('create');
    const companyId = user.companyId;

    const body = (await request.json()) as ProjectInput;
    const validationResult = projectSchema.safeParse(body);

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
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Fechas invalidas' }, { status: 400 });
    }

    const durationDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const durationMonths = Math.max(1, Math.ceil(durationDays / 30));
    const status = data.status || 'planificacion';
    const progress = status === 'finalizado' ? 100 : 0;

    const project = await prisma.constructionProject.create({
      data: {
        companyId,
        nombre: data.name,
        descripcion: data.description || '',
        tipoProyecto: data.type,
        estado: status,
        direccion: data.address,
        presupuestoTotal: data.budget || 0,
        gastosReales: 0,
        fechaInicio: startDate,
        fechaFinPrevista: endDate,
        fechaFinReal: status === 'finalizado' ? endDate : null,
        duracionMeses: durationMonths,
        faseActual: status === 'planificacion' ? 'PLANIFICACION' : 'INSTALACIONES',
        porcentajeAvance: progress,
        arquitecto: data.client || null,
        constructor: data.contractor || null,
      },
      include: {
        workOrders: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        project: mapProject(project),
        message: 'Proyecto creado correctamente',
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('[Construcción Create Error]:', error);
    if (error instanceof Error && error.message.includes('No autenticado')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('No tienes permiso')) {
      return NextResponse.json({ error: 'Permiso denegado' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Error al crear proyecto' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/proyectos/construccion
 * Actualizar un proyecto de construcción
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requirePermission('update');
    const companyId = user.companyId;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');

    if (!projectId) {
      return NextResponse.json({ error: 'ID del proyecto es requerido' }, { status: 400 });
    }

    const body = (await request.json()) as ProjectInput;
    const validationResult = projectSchema.safeParse(body);

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

    const existing = await prisma.constructionProject.findFirst({
      where: { id: projectId, companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    const data = validationResult.data;
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Fechas invalidas' }, { status: 400 });
    }

    const durationDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const durationMonths = Math.max(1, Math.ceil(durationDays / 30));
    const status = data.status || existing.estado;
    const progress = status === 'finalizado' ? 100 : existing.porcentajeAvance;

    const project = await prisma.constructionProject.update({
      where: { id: projectId },
      data: {
        nombre: data.name,
        descripcion: data.description || '',
        tipoProyecto: data.type,
        estado: status,
        direccion: data.address,
        presupuestoTotal: data.budget || 0,
        fechaInicio: startDate,
        fechaFinPrevista: endDate,
        fechaFinReal: status === 'finalizado' ? endDate : null,
        duracionMeses: durationMonths,
        faseActual: status === 'planificacion' ? 'PLANIFICACION' : existing.faseActual,
        porcentajeAvance: progress,
        arquitecto: data.client || null,
        constructor: data.contractor || null,
      },
      include: {
        workOrders: true,
      },
    });

    return NextResponse.json({
      success: true,
      project: mapProject(project),
      message: 'Proyecto actualizado correctamente',
    });
  } catch (error: any) {
    logger.error('[Construcción Update Error]:', error);
    if (error instanceof Error && error.message.includes('No autenticado')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('No tienes permiso')) {
      return NextResponse.json({ error: 'Permiso denegado' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Error al actualizar proyecto' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/proyectos/construccion
 * Eliminar un proyecto de construcción
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requirePermission('delete');
    const companyId = user.companyId;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');

    if (!projectId) {
      return NextResponse.json({ error: 'ID del proyecto es requerido' }, { status: 400 });
    }

    const existing = await prisma.constructionProject.findFirst({
      where: { id: projectId, companyId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    await prisma.constructionProject.delete({ where: { id: projectId } });

    return NextResponse.json({
      success: true,
      message: 'Proyecto eliminado correctamente',
    });
  } catch (error: any) {
    logger.error('[Construcción Delete Error]:', error);
    if (error instanceof Error && error.message.includes('No autenticado')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('No tienes permiso')) {
      return NextResponse.json({ error: 'Permiso denegado' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Error al eliminar proyecto' },
      { status: 500 }
    );
  }
}
