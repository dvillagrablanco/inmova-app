/**
 * API de gestión de campañas outbound
 * 
 * GET /api/admin/outbound - Estadísticas y estado del scheduler
 * POST /api/admin/outbound - Acciones: start, stop, schedule-lead
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPERADMIN', 'ADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { getSchedulerStats } = await import('@/lib/retell/outbound-scheduler');
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Obtener estadísticas del scheduler
    const schedulerStats = await getSchedulerStats();

    // Obtener leads recientes con llamadas outbound
    const recentCalls = await prisma.retellCall.findMany({
      where: {
        direction: 'outbound',
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        lead: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            empresa: true,
            cargo: true,
            outboundStatus: true,
          },
        },
      },
    });

    // Estadísticas de hoy
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayStats = await prisma.retellCall.aggregate({
      where: {
        direction: 'outbound',
        createdAt: { gte: todayStart },
      },
      _count: true,
      _avg: { duracionSegundos: true },
    });

    // Leads pendientes de llamar (próximas 2 horas)
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const upcomingLeads = await prisma.lead.findMany({
      where: {
        outboundStatus: 'NEW',
        outboundCallScheduledAt: {
          gte: new Date(),
          lte: twoHoursFromNow,
        },
      },
      orderBy: { outboundCallScheduledAt: 'asc' },
      take: 10,
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        empresa: true,
        cargo: true,
        telefono: true,
        outboundCallScheduledAt: true,
        outboundCallAttempts: true,
      },
    });

    return NextResponse.json({
      scheduler: schedulerStats,
      todayStats: {
        callsMade: todayStats._count,
        avgDuration: Math.round(todayStats._avg?.duracionSegundos || 0),
      },
      recentCalls: recentCalls.map(call => ({
        id: call.id,
        callId: call.retellCallId,
        status: call.status,
        resultado: call.resultado,
        duration: call.duracionSegundos,
        lead: call.lead,
        createdAt: call.createdAt,
      })),
      upcomingLeads: upcomingLeads.map(lead => ({
        id: lead.id,
        name: `${lead.nombre} ${lead.apellidos || ''}`.trim(),
        empresa: lead.empresa,
        cargo: lead.cargo,
        phone: lead.telefono?.replace(/\d{4}$/, '****'), // Ocultar parte del teléfono
        scheduledAt: lead.outboundCallScheduledAt,
        attempts: lead.outboundCallAttempts,
      })),
    });

  } catch (error: any) {
    console.error('[Admin Outbound API] Error:', error);
    return NextResponse.json(
      { error: 'Error obteniendo datos', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPERADMIN', 'ADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action, leadId, delayMinutes } = body;

    switch (action) {
      case 'start': {
        const { scheduleOutboundCalls } = await import('@/lib/retell/outbound-scheduler');
        // No await - ejecutar en background
        scheduleOutboundCalls().catch(err => 
          console.error('[Admin Outbound] Error starting scheduler:', err)
        );
        return NextResponse.json({ 
          success: true, 
          message: 'Scheduler iniciado' 
        });
      }

      case 'schedule-lead': {
        if (!leadId) {
          return NextResponse.json(
            { error: 'leadId es requerido' },
            { status: 400 }
          );
        }

        const { scheduleLeadCall } = await import('@/lib/retell/outbound-scheduler');
        const scheduledAt = await scheduleLeadCall(leadId, delayMinutes);

        return NextResponse.json({
          success: true,
          message: 'Lead programado para llamada',
          scheduledAt,
        });
      }

      case 'cancel-lead': {
        if (!leadId) {
          return NextResponse.json(
            { error: 'leadId es requerido' },
            { status: 400 }
          );
        }

        const { cancelScheduledCall } = await import('@/lib/retell/outbound-scheduler');
        await cancelScheduledCall(leadId);

        return NextResponse.json({
          success: true,
          message: 'Llamada cancelada',
        });
      }

      case 'call-now': {
        if (!leadId) {
          return NextResponse.json(
            { error: 'leadId es requerido' },
            { status: 400 }
          );
        }

        const { getPrismaClient } = await import('@/lib/db');
        const prisma = getPrismaClient();

        const lead = await prisma.lead.findUnique({
          where: { id: leadId },
        });

        if (!lead) {
          return NextResponse.json(
            { error: 'Lead no encontrado' },
            { status: 404 }
          );
        }

        if (!lead.telefono) {
          return NextResponse.json(
            { error: 'Lead sin teléfono' },
            { status: 400 }
          );
        }

        const { triggerOutboundCall } = await import('@/lib/retell/outbound-caller');
        const result = await triggerOutboundCall(lead as any);

        if (result.success) {
          return NextResponse.json({
            success: true,
            message: 'Llamada iniciada',
            callId: result.callId,
          });
        } else {
          return NextResponse.json(
            { error: 'Error iniciando llamada', details: result.error },
            { status: 500 }
          );
        }
      }

      default:
        return NextResponse.json(
          { error: `Acción no válida: ${action}` },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('[Admin Outbound API] Error:', error);
    return NextResponse.json(
      { error: 'Error procesando acción', message: error.message },
      { status: 500 }
    );
  }
}
