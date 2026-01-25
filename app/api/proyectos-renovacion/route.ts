/**
 * API Endpoint: Proyectos de Renovación
 * 
 * GET /api/proyectos-renovacion - Listar proyectos
 * POST /api/proyectos-renovacion - Crear proyecto
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================================
// VALIDACIÓN
// ============================================================================

// Mapeo entre valores del frontend y enum de Prisma
const ESTADO_TO_PRISMA: Record<string, string> = {
  'planificacion': 'PROSPECTO',
  'en_renovacion': 'RENOVACION',
  'en_venta': 'COMERCIALIZACION',
  'vendido': 'VENDIDO',
  'cancelado': 'CANCELADO',
};

const PRISMA_TO_ESTADO: Record<string, string> = {
  'PROSPECTO': 'planificacion',
  'ANALISIS': 'planificacion',
  'ADQUISICION': 'planificacion',
  'RENOVACION': 'en_renovacion',
  'COMERCIALIZACION': 'en_venta',
  'VENDIDO': 'vendido',
  'CANCELADO': 'cancelado',
};

const createProjectSchema = z.object({
  nombre: z.string().min(2),
  direccion: z.string().min(5),
  descripcion: z.string().optional(),
  unitId: z.string().optional(),
  buildingId: z.string().optional(),
  
  // Compra
  precioCompra: z.number().positive(),
  gastosCompra: z.number().default(0),
  fechaCompra: z.string().optional(),
  
  // Renovación
  presupuestoRenovacion: z.number().positive(),
  
  // Venta estimada
  precioVentaEstimado: z.number().positive(),
  
  // Estado - acepta valores del frontend y se mapean a Prisma
  estado: z.string().default('planificacion'),
  prioridad: z.enum(['baja', 'media', 'alta']).default('media'),
});

// ============================================================================
// GET - Listar proyectos
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');

    const { prisma } = await import('@/lib/db');

    const where: any = { companyId };
    if (estado) {
      // Mapear el estado del frontend al enum de Prisma
      const estadoPrisma = ESTADO_TO_PRISMA[estado];
      if (estadoPrisma) {
        where.estado = estadoPrisma;
      } else if (estado === 'planificacion') {
        // Planificación incluye varios estados
        where.estado = { in: ['PROSPECTO', 'ANALISIS', 'ADQUISICION'] };
      }
    }

    const projects = await prisma.flippingProject.findMany({
      where,
      include: {
        renovations: true,
        unit: {
          select: { id: true, numero: true },
        },
        building: {
          select: { id: true, nombre: true, direccion: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calcular métricas de cada proyecto y mapear estado al frontend
    const projectsWithMetrics = projects.map(project => {
      const inversionTotal = project.precioCompra + project.gastosCompra + project.gastosRealesRenovacion;
      const beneficioEstimado = project.precioVentaEstimado - inversionTotal - project.gastosVenta;
      const roiEstimado = inversionTotal > 0 ? (beneficioEstimado / inversionTotal) * 100 : 0;
      
      const beneficioReal = project.precioVentaReal 
        ? project.precioVentaReal - inversionTotal - project.gastosVenta 
        : null;
      const roiReal = beneficioReal && inversionTotal > 0 
        ? (beneficioReal / inversionTotal) * 100 
        : null;

      // Mapear estado de Prisma al frontend
      const estadoFrontend = PRISMA_TO_ESTADO[project.estado] || 'planificacion';

      return {
        ...project,
        estado: estadoFrontend, // Sobreescribir con valor del frontend
        estadoPrisma: project.estado, // Incluir valor original por si se necesita
        inversionTotal,
        beneficioEstimado,
        roiEstimado: Math.round(roiEstimado * 100) / 100,
        beneficioReal,
        roiReal: roiReal ? Math.round(roiReal * 100) / 100 : null,
        avanceRenovacion: project.renovations.length > 0
          ? Math.round(
              project.renovations.reduce((sum, r) => sum + r.porcentajeAvance, 0) / project.renovations.length
            )
          : 0,
      };
    });

    // Estadísticas - mantener compatibilidad con nombres del frontend
    const stats = {
      total: projects.length,
      // Nombres originales del frontend
      enPlanificacion: projects.filter(p => ['PROSPECTO', 'ANALISIS', 'ADQUISICION'].includes(p.estado)).length,
      enRenovacion: projects.filter(p => p.estado === 'RENOVACION').length,
      enVenta: projects.filter(p => p.estado === 'COMERCIALIZACION').length,
      vendidos: projects.filter(p => p.estado === 'VENDIDO').length,
      // Stats adicionales del enum
      prospectos: projects.filter(p => p.estado === 'PROSPECTO').length,
      enAnalisis: projects.filter(p => p.estado === 'ANALISIS').length,
      enAdquisicion: projects.filter(p => p.estado === 'ADQUISICION').length,
      enComercializacion: projects.filter(p => p.estado === 'COMERCIALIZACION').length,
      cancelados: projects.filter(p => p.estado === 'CANCELADO').length,
      inversionTotal: projects.reduce((sum, p) => 
        sum + p.precioCompra + p.gastosCompra + p.gastosRealesRenovacion, 0
      ),
      beneficioTotalReal: projects
        .filter(p => p.precioVentaReal)
        .reduce((sum, p) => {
          const inv = p.precioCompra + p.gastosCompra + p.gastosRealesRenovacion;
          return sum + ((p.precioVentaReal || 0) - inv - p.gastosVenta);
        }, 0),
    };

    return NextResponse.json({
      success: true,
      data: projectsWithMetrics,
      stats,
    });
  } catch (error: any) {
    logger.error('Error fetching renovation projects:', error);
    return NextResponse.json({ error: 'Error al obtener proyectos' }, { status: 500 });
  }
}

// ============================================================================
// POST - Crear proyecto
// ============================================================================

export async function POST(req: NextRequest) {
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
    const validationResult = createProjectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const data = validationResult.data;
    const { prisma } = await import('@/lib/db');

    // Mapear estado del frontend al enum de Prisma
    const estadoPrisma = ESTADO_TO_PRISMA[data.estado] || 'PROSPECTO';

    const project = await prisma.flippingProject.create({
      data: {
        companyId,
        nombre: data.nombre,
        direccion: data.direccion,
        descripcion: data.descripcion,
        unitId: data.unitId,
        buildingId: data.buildingId,
        precioCompra: data.precioCompra,
        gastosCompra: data.gastosCompra,
        fechaCompra: data.fechaCompra ? new Date(data.fechaCompra) : null,
        presupuestoRenovacion: data.presupuestoRenovacion,
        precioVentaEstimado: data.precioVentaEstimado,
        estado: estadoPrisma as any, // Usar valor del enum
        prioridad: data.prioridad,
      },
    });

    logger.info('Renovation project created', { projectId: project.id, companyId });

    // Devolver con estado en formato del frontend
    const projectResponse = {
      ...project,
      estado: data.estado, // Devolver el estado original del frontend
      estadoPrisma: estadoPrisma,
    };

    return NextResponse.json({
      success: true,
      data: projectResponse,
      message: 'Proyecto de renovación creado',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating renovation project:', error);
    return NextResponse.json({ error: 'Error al crear proyecto' }, { status: 500 });
  }
}
