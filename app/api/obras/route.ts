/**
 * API Endpoint: Gestión de Obras
 * 
 * GET /api/obras - Listar obras/proyectos de construcción
 * POST /api/obras - Crear obra
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// ============================================================================
// VALIDACIÓN
// ============================================================================

// Fases del enum ConstructionPhase en Prisma
const CONSTRUCTION_PHASES = ['PLANIFICACION', 'PERMISOS', 'CIMENTACION', 'ESTRUCTURA', 'CERRAMIENTOS', 'INSTALACIONES', 'ACABADOS', 'ENTREGA', 'GARANTIA'] as const;

const createProjectSchema = z.object({
  nombre: z.string().min(3),
  descripcion: z.string().min(10),
  tipoProyecto: z.string(),
  direccion: z.string().min(5),
  parcela: z.string().optional(),
  referenciaCatastral: z.string().optional(),
  buildingId: z.string().optional(),
  
  // Dimensiones
  numViviendas: z.number().int().positive().optional(),
  metrosConstruidos: z.number().positive().optional(),
  numPlantas: z.number().int().positive().optional(),
  
  // Presupuesto
  presupuestoTotal: z.number().positive(),
  
  // Fechas
  fechaInicio: z.string(),
  fechaFinPrevista: z.string(),
  duracionMeses: z.number().int().positive().optional(),
  
  // Responsables
  arquitecto: z.string().optional(),
  aparejador: z.string().optional(),
  constructor: z.string().optional(),
  
  // Fase actual - usa valores del enum Prisma
  faseActual: z.enum(CONSTRUCTION_PHASES).default('PLANIFICACION'),
});

// ============================================================================
// GET - Listar obras
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
    const fase = searchParams.get('fase') || searchParams.get('estado'); // Soportar ambos parámetros

    const prisma = await getPrisma();

    const where: any = { companyId };
    if (fase) {
      where.faseActual = fase;
    }

    const projects = await prisma.constructionProject.findMany({
      where,
      include: {
        workOrders: {
          orderBy: { fechaInicio: 'asc' },
        },
        building: {
          select: { id: true, nombre: true, direccion: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Mapeo de faseActual a estado compatible con frontend
    const FASE_TO_ESTADO: Record<string, string> = {
      'PLANIFICACION': 'planificacion',
      'PERMISOS': 'licencias',
      'CIMENTACION': 'ejecucion',
      'ESTRUCTURA': 'ejecucion',
      'CERRAMIENTOS': 'ejecucion',
      'INSTALACIONES': 'ejecucion',
      'ACABADOS': 'ejecucion',
      'ENTREGA': 'finalizada',
      'GARANTIA': 'finalizada',
    };

    // Calcular métricas de cada proyecto
    const projectsWithMetrics = projects.map(project => {
      // Avance general basado en órdenes de trabajo
      const totalOrders = project.workOrders.length;
      const completedOrders = project.workOrders.filter(o => o.estado === 'completada').length;
      const avanceGeneral = totalOrders > 0 
        ? Math.round((completedOrders / totalOrders) * 100)
        : project.workOrders.reduce((sum, o) => sum + o.porcentajeAvance, 0) / Math.max(totalOrders, 1);

      // Desviación de presupuesto
      const desviacionPorcentaje = project.presupuestoTotal > 0
        ? ((project.gastosReales - project.presupuestoTotal) / project.presupuestoTotal) * 100
        : 0;

      // Días restantes
      const hoy = new Date();
      const fechaFin = project.fechaFinPrevista;
      const diasRestantes = fechaFin 
        ? Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Mapear faseActual a estado para compatibilidad con frontend
      const estado = FASE_TO_ESTADO[project.faseActual] || 'planificacion';

      return {
        ...project,
        estado, // Estado compatible con frontend
        faseActualPrisma: project.faseActual, // Valor original
        avanceGeneral: Math.round(avanceGeneral),
        desviacionPorcentaje: Math.round(desviacionPorcentaje * 100) / 100,
        diasRestantes,
        enRiesgo: (desviacionPorcentaje > 10) || (diasRestantes !== null && diasRestantes < 0),
        numOrdenesTrabajo: totalOrders,
        ordenesCompletadas: completedOrders,
      };
    });

    // Estadísticas - mantener compatibilidad con frontend
    const stats = {
      total: projects.length,
      // Campos que espera el frontend
      enPlanificacion: projects.filter(p => p.faseActual === 'PLANIFICACION').length,
      enEjecucion: projects.filter(p => ['CIMENTACION', 'ESTRUCTURA', 'CERRAMIENTOS', 'INSTALACIONES', 'ACABADOS'].includes(p.faseActual)).length,
      finalizadas: projects.filter(p => ['ENTREGA', 'GARANTIA'].includes(p.faseActual)).length,
      // Campos adicionales detallados
      enPermisos: projects.filter(p => p.faseActual === 'PERMISOS').length,
      entregadas: projects.filter(p => p.faseActual === 'ENTREGA').length,
      enGarantia: projects.filter(p => p.faseActual === 'GARANTIA').length,
      presupuestoTotal: projects.reduce((sum, p) => sum + p.presupuestoTotal, 0),
      gastosReales: projects.reduce((sum, p) => sum + p.gastosReales, 0),
      metrosTotales: projects.reduce((sum, p) => sum + (p.metrosConstruidos || 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: projectsWithMetrics,
      stats,
    });
  } catch (error: any) {
    logger.error('Error fetching construction projects:', error);
    return NextResponse.json({ error: 'Error al obtener obras' }, { status: 500 });
  }
}

// ============================================================================
// POST - Crear obra
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
    const prisma = await getPrisma();

    // Calcular duración en meses si no se proporciona
    const fechaIni = new Date(data.fechaInicio);
    const fechaFin = new Date(data.fechaFinPrevista);
    const duracionMeses = data.duracionMeses || Math.max(1, Math.round(
      (fechaFin.getTime() - fechaIni.getTime()) / (1000 * 60 * 60 * 24 * 30)
    ));

    const project = await prisma.constructionProject.create({
      data: {
        companyId,
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipoProyecto: data.tipoProyecto,
        direccion: data.direccion,
        parcela: data.parcela,
        referenciaCatastral: data.referenciaCatastral,
        buildingId: data.buildingId,
        numViviendas: data.numViviendas,
        metrosConstruidos: data.metrosConstruidos,
        numPlantas: data.numPlantas,
        presupuestoTotal: data.presupuestoTotal,
        fechaInicio: fechaIni,
        fechaFinPrevista: fechaFin,
        duracionMeses,
        arquitecto: data.arquitecto,
        aparejador: data.aparejador,
        faseActual: data.faseActual,
      },
    });

    logger.info('Construction project created', { projectId: project.id, companyId });

    return NextResponse.json({
      success: true,
      data: project,
      message: 'Obra creada exitosamente',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating construction project:', error);
    return NextResponse.json({ error: 'Error al crear obra' }, { status: 500 });
  }
}
