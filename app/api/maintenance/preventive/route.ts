import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { differenceInDays } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/maintenance/preventive
 * Calendario de mantenimiento preventivo:
 * - ITEs pendientes/vencidas (BuildingInspection)
 * - Schedules programados (MaintenanceSchedule)
 * - Seguros próximos a vencer
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as any).role as any,
      primaryCompanyId: session.user?.companyId,
      request,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }

    const companyId = scope.activeCompanyId;
    const today = new Date();
    const items: any[] = [];

    // 1. ITEs y inspecciones de edificios
    try {
      const inspections = await prisma.buildingInspection.findMany({
        where: { companyId },
        include: {
          building: { select: { nombre: true, direccion: true } },
        },
        orderBy: { fechaVencimiento: 'asc' },
      });

      for (const insp of inspections) {
        const diasRestantes = differenceInDays(insp.fechaVencimiento, today);
        const vencida = diasRestantes < 0;

        items.push({
          id: `ite-${insp.id}`,
          tipo: 'inspeccion',
          subtipo: insp.tipo, // ITE, IEE, ITEEVA
          titulo: `${insp.tipo} - ${insp.building?.nombre || 'Sin edificio'}`,
          descripcion: `${insp.resultado} | Técnico: ${insp.tecnicoNombre}`,
          edificio: insp.building?.nombre || '',
          direccion: insp.building?.direccion || '',
          estado: vencida ? 'vencida' : insp.estado,
          fechaVencimiento: insp.fechaVencimiento,
          proximaFecha: insp.proximaInspeccion,
          diasRestantes,
          prioridad: vencida ? 'alta' : diasRestantes <= 90 ? 'media' : 'baja',
          entityId: insp.id,
        });
      }
    } catch {
      // BuildingInspection model may not be migrated yet
    }

    // 2. Schedules de mantenimiento programado
    try {
      const schedules = await prisma.maintenanceSchedule.findMany({
        where: {
          OR: [{ building: { companyId } }, { unit: { building: { companyId } } }],
          activo: true,
        },
        include: {
          building: { select: { nombre: true } },
          unit: { select: { numero: true, building: { select: { nombre: true } } } },
        },
        orderBy: { proximaFecha: 'asc' },
      });

      for (const sch of schedules) {
        const diasRestantes = sch.proximaFecha ? differenceInDays(sch.proximaFecha, today) : 999;
        const edificio = sch.building?.nombre || sch.unit?.building?.nombre || 'Sin edificio';

        items.push({
          id: `schedule-${sch.id}`,
          tipo: 'mantenimiento_programado',
          subtipo: sch.tipo || 'general',
          titulo: `${sch.titulo || sch.tipo} - ${edificio}`,
          descripcion: sch.descripcion || `Frecuencia: ${sch.frecuencia}`,
          edificio,
          estado: diasRestantes < 0 ? 'vencido' : 'programado',
          fechaVencimiento: sch.proximaFecha,
          diasRestantes,
          prioridad: diasRestantes < 0 ? 'alta' : diasRestantes <= 30 ? 'media' : 'baja',
          entityId: sch.id,
        });
      }
    } catch {
      // MaintenanceSchedule may not be migrated
    }

    // 3. Seguros próximos a vencer
    try {
      const seguros = await prisma.insurance.findMany({
        where: {
          companyId,
          estado: 'activa',
          fechaVencimiento: {
            lte: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          building: { select: { nombre: true } },
        },
        orderBy: { fechaVencimiento: 'asc' },
      });

      for (const seg of seguros) {
        const diasRestantes = differenceInDays(seg.fechaVencimiento, today);
        items.push({
          id: `seguro-${seg.id}`,
          tipo: 'seguro',
          subtipo: seg.tipo,
          titulo: `Seguro ${seg.tipo} - ${seg.building?.nombre || 'General'}`,
          descripcion: `${seg.aseguradora} | Póliza: ${seg.numeroPoliza || 'N/A'}`,
          edificio: seg.building?.nombre || '',
          estado: diasRestantes < 0 ? 'vencido' : 'vigente',
          fechaVencimiento: seg.fechaVencimiento,
          diasRestantes,
          prioridad: diasRestantes <= 0 ? 'alta' : diasRestantes <= 30 ? 'media' : 'baja',
          entityId: seg.id,
        });
      }
    } catch {
      // Insurance model may not be migrated
    }

    // Ordenar por prioridad y fecha
    const prioridadOrden: Record<string, number> = { alta: 0, media: 1, baja: 2 };
    items.sort((a, b) => {
      if (a.prioridad !== b.prioridad) {
        return (prioridadOrden[a.prioridad] || 2) - (prioridadOrden[b.prioridad] || 2);
      }
      return (a.diasRestantes || 0) - (b.diasRestantes || 0);
    });

    // Resumen
    const resumen = {
      total: items.length,
      vencidos: items.filter((i) => i.diasRestantes < 0).length,
      proximos30d: items.filter((i) => i.diasRestantes >= 0 && i.diasRestantes <= 30).length,
      proximos90d: items.filter((i) => i.diasRestantes >= 0 && i.diasRestantes <= 90).length,
      porTipo: {
        inspecciones: items.filter((i) => i.tipo === 'inspeccion').length,
        mantenimiento: items.filter((i) => i.tipo === 'mantenimiento_programado').length,
        seguros: items.filter((i) => i.tipo === 'seguro').length,
      },
    };

    return NextResponse.json({
      success: true,
      resumen,
      items,
    });
  } catch (error: any) {
    logger.error('[Preventive Maintenance]:', error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Error obteniendo mantenimiento preventivo' },
      { status: 500 }
    );
  }
}
