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

type ProfessionalStatusDb =
  | 'PROPUESTA'
  | 'ACEPTADO'
  | 'EN_CURSO'
  | 'REVISION'
  | 'ENTREGADO'
  | 'CERRADO'
  | 'CANCELADO';

type ProfessionalStatusUi =
  | 'propuesta'
  | 'aprobado'
  | 'en_curso'
  | 'revision'
  | 'completado'
  | 'cancelado';

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  clientName: z.string().optional(),
  clientEmail: z.string().optional(),
  clientPhone: z.string().optional(),
  serviceType: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  budget: z.coerce.number().optional(),
  hourlyRate: z.coerce.number().optional(),
  estimatedHours: z.coerce.number().optional(),
});

const updateProjectSchema = createProjectSchema.partial();

const statusToDb: Record<ProfessionalStatusUi, ProfessionalStatusDb> = {
  propuesta: 'PROPUESTA',
  aprobado: 'ACEPTADO',
  en_curso: 'EN_CURSO',
  revision: 'REVISION',
  completado: 'ENTREGADO',
  cancelado: 'CANCELADO',
};

const statusToUi: Record<ProfessionalStatusDb, ProfessionalStatusUi> = {
  PROPUESTA: 'propuesta',
  ACEPTADO: 'aprobado',
  EN_CURSO: 'en_curso',
  REVISION: 'revision',
  ENTREGADO: 'completado',
  CERRADO: 'completado',
  CANCELADO: 'cancelado',
};

const serviceTypeMap: Record<string, string> = {
  consultoria: 'CONSULTORIA',
  tasacion: 'TASACION',
  gestion: 'DIRECCION_OBRA',
  asesoria: 'PROYECTO_BASICO',
  intermediacion: 'PROYECTO_EJECUCION',
  legal: 'PROYECTO_EJECUCION',
  otro: 'CONSULTORIA',
};

function mapStatusToDb(value: string | undefined): ProfessionalStatusDb {
  if (!value) {
    return 'PROPUESTA';
  }
  const normalized = value as ProfessionalStatusUi;
  return statusToDb[normalized] || 'PROPUESTA';
}

function mapStatusToUi(value: ProfessionalStatusDb): ProfessionalStatusUi {
  return statusToUi[value];
}

function mapServiceType(value: string | undefined): string {
  if (!value) {
    return 'CONSULTORIA';
  }
  const key = value.toLowerCase();
  return serviceTypeMap[key] || 'CONSULTORIA';
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const projects = await prisma.professionalProject.findMany({
      where: { companyId: user.companyId },
      include: { deliverables: true },
      orderBy: { createdAt: 'desc' },
    });

    const response = projects.map((project) => {
      const totalHoras = project.deliverables.length;
      return {
        id: project.id,
        name: project.titulo,
        description: project.descripcion || undefined,
        clientName: project.clienteNombre,
        clientEmail: project.clienteEmail,
        clientPhone: project.clienteTelefono || undefined,
        serviceType: project.tipo.toLowerCase(),
        status: mapStatusToUi(project.estado),
        startDate: project.fechaInicio.toISOString().split('T')[0],
        endDate: project.fechaEntrega.toISOString().split('T')[0],
        budget: project.honorarios,
        spent: project.gastos,
        hourlyRate: 0,
        estimatedHours: totalHoras,
        actualHours: project.deliverables.filter((d) => d.entregado).length,
        progress: project.porcentajeAvance,
        tasks: project.deliverables.map((task) => ({
          id: task.id,
          name: task.nombre,
          description: task.descripcion || undefined,
          startDate: project.fechaInicio.toISOString().split('T')[0],
          endDate: task.fechaLimite.toISOString().split('T')[0],
          progress: task.entregado ? 100 : 0,
          status: task.entregado ? 'completada' : 'pendiente',
          priority: 'media',
        })),
        createdAt: project.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      projects: response,
      total: response.length,
    });
  } catch (error) {
    logger.error('[Professional Projects Error]:', error);
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

    const honorarios = parsed.data.budget ?? 0;
    const gastos = 0;

    const project = await prisma.professionalProject.create({
      data: {
        companyId: user.companyId,
        clienteNombre: parsed.data.clientName || '',
        clienteEmail: parsed.data.clientEmail || '',
        clienteTelefono: parsed.data.clientPhone,
        tipo: mapServiceType(parsed.data.serviceType),
        titulo: parsed.data.name,
        descripcion: parsed.data.description || '',
        direccion: '',
        honorarios,
        gastos,
        total: honorarios + gastos,
        fechaInicio: new Date(parsed.data.startDate),
        fechaEntrega: new Date(parsed.data.endDate),
        estado: mapStatusToDb(parsed.data.status),
        porcentajeAvance: 0,
        responsable: user.id,
        colaboradores: [],
      },
    });

    return NextResponse.json(
      {
        success: true,
        project: {
          id: project.id,
          name: project.titulo,
          description: project.descripcion || undefined,
          clientName: project.clienteNombre,
          clientEmail: project.clienteEmail,
          clientPhone: project.clienteTelefono || undefined,
          serviceType: project.tipo.toLowerCase(),
          status: mapStatusToUi(project.estado),
          startDate: project.fechaInicio.toISOString().split('T')[0],
          endDate: project.fechaEntrega.toISOString().split('T')[0],
          budget: project.honorarios,
          spent: project.gastos,
          hourlyRate: 0,
          estimatedHours: parsed.data.estimatedHours ?? 0,
          actualHours: 0,
          progress: project.porcentajeAvance,
          tasks: [],
          createdAt: project.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('[Professional Create Error]:', error);
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

    const existing = await prisma.professionalProject.findFirst({
      where: { id: projectId, companyId: user.companyId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name) updateData.titulo = parsed.data.name;
    if (parsed.data.description !== undefined) updateData.descripcion = parsed.data.description;
    if (parsed.data.clientName !== undefined) updateData.clienteNombre = parsed.data.clientName;
    if (parsed.data.clientEmail !== undefined) updateData.clienteEmail = parsed.data.clientEmail;
    if (parsed.data.clientPhone !== undefined) updateData.clienteTelefono = parsed.data.clientPhone;
    if (parsed.data.serviceType) updateData.tipo = mapServiceType(parsed.data.serviceType);
    if (parsed.data.status) updateData.estado = mapStatusToDb(parsed.data.status);
    if (parsed.data.startDate) updateData.fechaInicio = new Date(parsed.data.startDate);
    if (parsed.data.endDate) updateData.fechaEntrega = new Date(parsed.data.endDate);
    if (parsed.data.budget !== undefined) updateData.honorarios = parsed.data.budget;

    await prisma.professionalProject.update({
      where: { id: existing.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Proyecto actualizado correctamente',
    });
  } catch (error) {
    logger.error('[Professional Update Error]:', error);
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

    const existing = await prisma.professionalProject.findFirst({
      where: { id: projectId, companyId: user.companyId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    await prisma.professionalProject.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Proyecto eliminado correctamente',
    });
  } catch (error) {
    logger.error('[Professional Delete Error]:', error);
    return NextResponse.json(
      { error: 'Error al eliminar proyecto' },
      { status: 500 }
    );
  }
}
