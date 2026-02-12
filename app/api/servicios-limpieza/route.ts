/**
 * API Endpoint: Gestión de Servicios de Limpieza
 * 
 * GET /api/servicios-limpieza - Listar tareas de limpieza
 * POST /api/servicios-limpieza - Crear nueva tarea de limpieza
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

const createTaskSchema = z.object({
  listingId: z.string().optional(),
  buildingId: z.string().optional(),
  unitId: z.string().optional(),
  tipo: z.enum(['check_out', 'check_in', 'profunda', 'mantenimiento', 'rapida']).default('check_out'),
  fechaProgramada: z.string(),
  asignadoA: z.string().optional(),
  prioridad: z.number().int().min(0).max(2).default(0),
  notas: z.string().optional(),
  instruccionesEspeciales: z.string().optional(),
  tiempoEstimadoMin: z.number().int().positive().optional(),
});

// ============================================================================
// GET - Listar tareas de limpieza
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const companyId = cookieCompanyId || session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const staffId = searchParams.get('staffId');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');

    const { prisma } = await import('@/lib/db');

    // Construir filtros
    const where: any = { companyId };
    
    if (status) {
      where.status = status;
    }
    if (staffId) {
      where.asignadoA = staffId;
    }
    if (fechaDesde || fechaHasta) {
      where.fechaProgramada = {};
      if (fechaDesde) where.fechaProgramada.gte = new Date(fechaDesde);
      if (fechaHasta) where.fechaProgramada.lte = new Date(fechaHasta);
    }

    const tasks = await prisma.sTRHousekeepingTask.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            titulo: true,
            unit: {
              select: {
                building: {
                  select: { direccion: true },
                },
              },
            },
          },
        },
        staff: {
          select: { id: true, nombre: true, telefono: true, foto: true },
        },
        booking: {
          select: { id: true, guestNombre: true, checkInDate: true, checkOutDate: true },
        },
      },
      orderBy: { fechaProgramada: 'asc' },
    });

    // Obtener estadísticas
    const stats = await prisma.sTRHousekeepingTask.groupBy({
      by: ['status'],
      where: { companyId },
      _count: true,
    });

    const statsMap = stats.reduce((acc, s) => {
      acc[s.status] = s._count;
      return acc;
    }, {} as Record<string, number>);

    const formattedTasks = tasks.map((task) => ({
      ...task,
      listing: task.listing
        ? {
            id: task.listing.id,
            titulo: task.listing.titulo,
            direccion: task.listing.unit?.building?.direccion || '',
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedTasks,
      stats: {
        total: tasks.length,
        pendientes: statsMap['pendiente'] || 0,
        enProgreso: statsMap['en_progreso'] || 0,
        completadas: statsMap['completada'] || 0,
        canceladas: statsMap['cancelada'] || 0,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching cleaning tasks:', error);
    return NextResponse.json({ error: 'Error al obtener tareas de limpieza' }, { status: 500 });
  }
}

// ============================================================================
// POST - Crear tarea de limpieza
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
    const validationResult = createTaskSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const data = validationResult.data;
    const { prisma } = await import('@/lib/db');

    // Si no hay listingId pero hay unitId, buscar o crear un listing temporal
    let listingId = data.listingId;
    
    if (!listingId && data.unitId) {
      // Buscar si existe un listing para esta unidad
      const existingListing = await prisma.sTRListing.findFirst({
        where: { unitId: data.unitId, companyId },
      });
      
      if (existingListing) {
        listingId = existingListing.id;
      }
    }

    // Crear la tarea
    const task = await prisma.sTRHousekeepingTask.create({
      data: {
        companyId,
        listingId: listingId || '',
        tipo: data.tipo as any,
        status: 'pendiente',
        fechaProgramada: new Date(data.fechaProgramada),
        asignadoA: data.asignadoA || null,
        prioridad: data.prioridad,
        notas: data.notas,
        instruccionesEspeciales: data.instruccionesEspeciales,
        tiempoEstimadoMin: data.tiempoEstimadoMin,
      },
      include: {
        staff: {
          select: { id: true, nombre: true, telefono: true },
        },
      },
    });

    logger.info('Cleaning task created', { taskId: task.id, companyId });

    return NextResponse.json({
      success: true,
      data: task,
      message: 'Tarea de limpieza creada',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating cleaning task:', error);
    return NextResponse.json({ error: 'Error al crear tarea de limpieza' }, { status: 500 });
  }
}
