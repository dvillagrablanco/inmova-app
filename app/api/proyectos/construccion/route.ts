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

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  address: z.string().min(1),
  type: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  budget: z.coerce.number().optional(),
  client: z.string().optional(),
  contractor: z.string().optional(),
});

const updateProjectSchema = createProjectSchema.partial();

const CONSTRUCTION_PHASES = new Set([
  'PLANIFICACION',
  'PERMISOS',
  'CIMENTACION',
  'ESTRUCTURA',
  'CERRAMIENTOS',
  'INSTALACIONES',
  'ACABADOS',
  'ENTREGA',
  'GARANTIA',
]);

function mapPhase(value: string | undefined): string {
  if (!value) {
    return 'PLANIFICACION';
  }
  const upper = value.toUpperCase();
  if (CONSTRUCTION_PHASES.has(upper)) {
    return upper;
  }
  const statusMap: Record<string, string> = {
    PLANIFICACION: 'PLANIFICACION',
    EN_CURSO: 'INSTALACIONES',
    PAUSADO: 'PLANIFICACION',
    FINALIZADO: 'ENTREGA',
    CANCELADO: 'GARANTIA',
  };
  return statusMap[upper] || 'PLANIFICACION';
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const projects = await prisma.constructionProject.findMany({
      where: { companyId: user.companyId },
      include: { workOrders: true },
      orderBy: { createdAt: 'desc' },
    });

    const response = projects.map((project) => ({
      id: project.id,
      name: project.nombre,
      description: project.descripcion,
      address: project.direccion,
      type: project.tipoProyecto,
      status: project.faseActual,
      startDate: project.fechaInicio.toISOString().split('T')[0],
      endDate: project.fechaFinPrevista.toISOString().split('T')[0],
      budget: project.presupuestoTotal,
      spent: project.gastosReales,
      progress: project.porcentajeAvance,
      client: project.arquitecto || undefined,
      contractor: project.constructor || undefined,
      tasks: project.workOrders.map((task) => ({
        id: task.id,
        name: task.titulo,
        description: task.descripcion,
        startDate: task.fechaInicio.toISOString().split('T')[0],
        endDate: task.fechaFin.toISOString().split('T')[0],
        progress: task.porcentajeAvance,
        status: task.estado,
        priority: 'media',
        assignee: task.subcontratista,
        estimatedCost: task.presupuesto,
        actualCost: task.costoReal || undefined,
      })),
      createdAt: project.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      projects: response,
      total: response.length,
    });
  } catch (error) {
    logger.error('[Construcción Projects Error]:', error);
    return NextResponse.json(
      { error: 'Error al obtener proyectos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId || !user.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const project = await prisma.constructionProject.create({
      data: {
        companyId: user.companyId,
        nombre: parsed.data.name,
        descripcion: parsed.data.description,
        direccion: parsed.data.address,
        tipoProyecto: parsed.data.type || 'reforma_integral',
        presupuestoTotal: parsed.data.budget ?? 0,
        fechaInicio: new Date(parsed.data.startDate),
        fechaFinPrevista: new Date(parsed.data.endDate),
        duracionMeses: 0,
        faseActual: mapPhase(parsed.data.status),
        arquitecto: parsed.data.client,
        constructor: parsed.data.contractor,
      },
    });

    return NextResponse.json(
      {
        success: true,
        project: {
          id: project.id,
          name: project.nombre,
          description: project.descripcion,
          address: project.direccion,
          type: project.tipoProyecto,
          status: project.faseActual,
          startDate: project.fechaInicio.toISOString().split('T')[0],
          endDate: project.fechaFinPrevista.toISOString().split('T')[0],
          budget: project.presupuestoTotal,
          spent: project.gastosReales,
          progress: project.porcentajeAvance,
          client: project.arquitecto || undefined,
          contractor: project.constructor || undefined,
          tasks: [],
          createdAt: project.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('[Construcción Create Error]:', error);
    return NextResponse.json(
      { error: 'Error al crear proyecto' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');
    if (!projectId) {
      return NextResponse.json(
        { error: 'ID del proyecto es requerido' },
        { status: 400 }
      );
    }

    const body: unknown = await request.json();
    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const existing = await prisma.constructionProject.findFirst({
      where: { id: projectId, companyId: user.companyId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name) updateData.nombre = parsed.data.name;
    if (parsed.data.description) updateData.descripcion = parsed.data.description;
    if (parsed.data.address) updateData.direccion = parsed.data.address;
    if (parsed.data.type) updateData.tipoProyecto = parsed.data.type;
    if (parsed.data.status) updateData.faseActual = mapPhase(parsed.data.status);
    if (parsed.data.startDate) updateData.fechaInicio = new Date(parsed.data.startDate);
    if (parsed.data.endDate) updateData.fechaFinPrevista = new Date(parsed.data.endDate);
    if (parsed.data.budget !== undefined) updateData.presupuestoTotal = parsed.data.budget;
    if (parsed.data.client !== undefined) updateData.arquitecto = parsed.data.client;
    if (parsed.data.contractor !== undefined) updateData.constructor = parsed.data.contractor;

    await prisma.constructionProject.update({
      where: { id: existing.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Proyecto actualizado correctamente',
    });
  } catch (error) {
    logger.error('[Construcción Update Error]:', error);
    return NextResponse.json(
      { error: 'Error al actualizar proyecto' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');
    if (!projectId) {
      return NextResponse.json(
        { error: 'ID del proyecto es requerido' },
        { status: 400 }
      );
    }

    const existing = await prisma.constructionProject.findFirst({
      where: { id: projectId, companyId: user.companyId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    await prisma.constructionProject.delete({ where: { id: existing.id } });

    return NextResponse.json({
      success: true,
      message: 'Proyecto eliminado correctamente',
    });
  } catch (error) {
    logger.error('[Construcción Delete Error]:', error);
    return NextResponse.json(
      { error: 'Error al eliminar proyecto' },
      { status: 500 }
    );
  }
}
