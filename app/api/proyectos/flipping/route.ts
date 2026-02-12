import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

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

type ProjectStatusDb =
  | 'PROSPECTO'
  | 'ANALISIS'
  | 'ADQUISICION'
  | 'RENOVACION'
  | 'COMERCIALIZACION'
  | 'VENDIDO'
  | 'CANCELADO';

type ProjectStatusUi =
  | 'busqueda'
  | 'negociacion'
  | 'comprado'
  | 'reforma'
  | 'venta'
  | 'vendido'
  | 'cancelado';

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  address: z.string().min(1),
  status: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  purchasePrice: z.coerce.number().optional(),
  renovationBudget: z.coerce.number().optional(),
  targetSalePrice: z.coerce.number().optional(),
  currentValue: z.coerce.number().optional(),
  squareMeters: z.coerce.number().optional(),
});

const updateProjectSchema = createProjectSchema.partial();

const statusToDb: Record<ProjectStatusUi, ProjectStatusDb> = {
  busqueda: 'PROSPECTO',
  negociacion: 'ANALISIS',
  comprado: 'ADQUISICION',
  reforma: 'RENOVACION',
  venta: 'COMERCIALIZACION',
  vendido: 'VENDIDO',
  cancelado: 'CANCELADO',
};

const statusToUi: Record<ProjectStatusDb, ProjectStatusUi> = {
  PROSPECTO: 'busqueda',
  ANALISIS: 'negociacion',
  ADQUISICION: 'comprado',
  RENOVACION: 'reforma',
  COMERCIALIZACION: 'venta',
  VENDIDO: 'vendido',
  CANCELADO: 'cancelado',
};

async function mapStatusToDb(value: string | undefined): ProjectStatusDb {
  const prisma = await getPrisma();
  if (!value) {
    return 'PROSPECTO';
  }
  const normalized = value as ProjectStatusUi;
  return statusToDb[normalized] || 'PROSPECTO';
}

async function mapStatusToUi(value: ProjectStatusDb): ProjectStatusUi {
  const prisma = await getPrisma();
  return statusToUi[value];
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const projects = await prisma.flippingProject.findMany({
      where: { companyId: user.companyId },
      include: {
        renovations: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const response = projects.map((project) => {
      const startDate =
        project.fechaInicioObra || project.fechaCompra || project.createdAt;
      const endDate =
        project.fechaFinObra || project.fechaVenta || project.updatedAt;
      const progress =
        project.presupuestoRenovacion > 0
          ? Math.round(
              (project.gastosRealesRenovacion / project.presupuestoRenovacion) * 100
            )
          : 0;

      return {
        id: project.id,
        name: project.nombre,
        description: project.descripcion || undefined,
        address: project.direccion,
        status: mapStatusToUi(project.estado),
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        purchasePrice: project.precioCompra,
        renovationBudget: project.presupuestoRenovacion,
        renovationSpent: project.gastosRealesRenovacion,
        targetSalePrice: project.precioVentaEstimado,
        actualSalePrice: project.precioVentaReal || undefined,
        currentValue: project.precioVentaReal ?? project.precioVentaEstimado,
        squareMeters: 0,
        progress,
        tasks: project.renovations.map((task) => ({
          id: task.id,
          name: task.descripcion,
          description: task.notas || undefined,
          startDate: (task.fechaInicio || startDate).toISOString().split('T')[0],
          endDate: (task.fechaFin || endDate).toISOString().split('T')[0],
          progress: task.porcentajeAvance,
          status: task.completado
            ? 'completada'
            : task.porcentajeAvance > 0
              ? 'en_progreso'
              : 'pendiente',
          priority: 'media',
          assignee: task.proveedorNombre || undefined,
          estimatedCost: task.presupuestado,
          actualCost: task.costoReal || undefined,
          category: task.categoria,
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
    logger.error('[Flipping Projects Error]:', error);
    return NextResponse.json(
      { error: 'Error al obtener proyectos' },
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
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    const project = await prisma.flippingProject.create({
      data: {
        companyId: user.companyId,
        nombre: parsed.data.name,
        direccion: parsed.data.address,
        descripcion: parsed.data.description,
        estado: mapStatusToDb(parsed.data.status),
        fechaInicioObra: new Date(parsed.data.startDate),
        fechaFinObra: new Date(parsed.data.endDate),
        precioCompra: parsed.data.purchasePrice ?? 0,
        presupuestoRenovacion: parsed.data.renovationBudget ?? 0,
        precioVentaEstimado: parsed.data.targetSalePrice ?? 0,
      },
    });

    return NextResponse.json(
      {
        success: true,
        project: {
          id: project.id,
          name: project.nombre,
          description: project.descripcion || undefined,
          address: project.direccion,
          status: mapStatusToUi(project.estado),
          startDate: project.fechaInicioObra?.toISOString().split('T')[0],
          endDate: project.fechaFinObra?.toISOString().split('T')[0],
          purchasePrice: project.precioCompra,
          renovationBudget: project.presupuestoRenovacion,
          renovationSpent: project.gastosRealesRenovacion,
          targetSalePrice: project.precioVentaEstimado,
          actualSalePrice: project.precioVentaReal || undefined,
          currentValue: project.precioVentaReal ?? project.precioVentaEstimado,
          squareMeters: 0,
          progress: 0,
          tasks: [],
          createdAt: project.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('[Flipping Create Error]:', error);
    return NextResponse.json(
      { error: 'Error al crear proyecto' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const prisma = await getPrisma();
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
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    const existing = await prisma.flippingProject.findFirst({
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
    if (parsed.data.description !== undefined) {
      updateData.descripcion = parsed.data.description;
    }
    if (parsed.data.address) updateData.direccion = parsed.data.address;
    if (parsed.data.status) updateData.estado = mapStatusToDb(parsed.data.status);
    if (parsed.data.startDate) updateData.fechaInicioObra = new Date(parsed.data.startDate);
    if (parsed.data.endDate) updateData.fechaFinObra = new Date(parsed.data.endDate);
    if (parsed.data.purchasePrice !== undefined) {
      updateData.precioCompra = parsed.data.purchasePrice;
    }
    if (parsed.data.renovationBudget !== undefined) {
      updateData.presupuestoRenovacion = parsed.data.renovationBudget;
    }
    if (parsed.data.targetSalePrice !== undefined) {
      updateData.precioVentaEstimado = parsed.data.targetSalePrice;
    }

    await prisma.flippingProject.update({
      where: { id: existing.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Proyecto actualizado correctamente',
    });
  } catch (error) {
    logger.error('[Flipping Update Error]:', error);
    return NextResponse.json(
      { error: 'Error al actualizar proyecto' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const prisma = await getPrisma();
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

    const existing = await prisma.flippingProject.findFirst({
      where: { id: projectId, companyId: user.companyId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    await prisma.flippingProject.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Proyecto eliminado correctamente',
    });
  } catch (error) {
    logger.error('[Flipping Delete Error]:', error);
    return NextResponse.json(
      { error: 'Error al eliminar proyecto' },
      { status: 500 }
    );
  }
}
