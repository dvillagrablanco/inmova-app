/**
 * API Endpoint: Órdenes de Trabajo de Obra
 * 
 * GET /api/obras/[id]/ordenes - Listar órdenes de una obra
 * POST /api/obras/[id]/ordenes - Crear orden de trabajo
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createWorkOrderSchema = z.object({
  fase: z.enum(['demolicion', 'cimentacion', 'estructura', 'cerramientos', 'instalaciones', 'acabados', 'entrega']),
  titulo: z.string().min(3),
  descripcion: z.string().min(10),
  subcontratista: z.string(),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
  presupuesto: z.number().positive(),
  fechaInicio: z.string(),
  fechaFin: z.string(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const { prisma } = await import('@/lib/db');

    // Verificar que el proyecto existe
    const project = await prisma.constructionProject.findFirst({
      where: { id: params.id, companyId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Obra no encontrada' }, { status: 404 });
    }

    const workOrders = await prisma.constructionWorkOrder.findMany({
      where: { projectId: params.id },
      orderBy: [
        { fase: 'asc' },
        { orden: 'asc' },
      ],
    });

    // Agrupar por fase
    const porFase = workOrders.reduce((acc, wo) => {
      const fase = wo.fase;
      if (!acc[fase]) {
        acc[fase] = [];
      }
      acc[fase].push(wo);
      return acc;
    }, {} as Record<string, typeof workOrders>);

    return NextResponse.json({
      success: true,
      data: workOrders,
      porFase,
      projectId: params.id,
      projectNombre: project.nombre,
    });
  } catch (error: any) {
    logger.error('Error fetching work orders:', error);
    return NextResponse.json({ error: 'Error al obtener órdenes' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const body = await req.json();
    const validationResult = createWorkOrderSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const data = validationResult.data;
    const { prisma } = await import('@/lib/db');

    // Verificar que el proyecto existe
    const project = await prisma.constructionProject.findFirst({
      where: { id: params.id, companyId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Obra no encontrada' }, { status: 404 });
    }

    // Obtener el siguiente orden para esta fase
    const lastOrder = await prisma.constructionWorkOrder.findFirst({
      where: { projectId: params.id, fase: data.fase as any },
      orderBy: { orden: 'desc' },
      select: { orden: true },
    });

    const workOrder = await prisma.constructionWorkOrder.create({
      data: {
        projectId: params.id,
        fase: data.fase as any,
        titulo: data.titulo,
        descripcion: data.descripcion,
        subcontratista: data.subcontratista,
        telefono: data.telefono,
        email: data.email,
        presupuesto: data.presupuesto,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        estado: 'pendiente',
        orden: (lastOrder?.orden || 0) + 1,
      },
    });

    logger.info('Work order created', { workOrderId: workOrder.id, projectId: params.id });

    return NextResponse.json({
      success: true,
      data: workOrder,
      message: 'Orden de trabajo creada',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating work order:', error);
    return NextResponse.json({ error: 'Error al crear orden' }, { status: 500 });
  }
}
