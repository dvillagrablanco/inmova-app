import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { obtenerEventosCalendario } from '@/lib/calendar-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/calendar
 * Obtiene eventos del calendario con filtros opcionales
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fechaInicio = searchParams.get('start');
    const fechaFin = searchParams.get('end');
    const tipo = searchParams.get('tipo');
    const buildingId = searchParams.get('buildingId');
    const unitId = searchParams.get('unitId');
    const tenantId = searchParams.get('tenantId');

    if (!fechaInicio || !fechaFin) {
      return NextResponse.json(
        { error: 'Debe proporcionar fechas de inicio y fin' },
        { status: 400 }
      );
    }

    const filtros: any = {};

    if (tipo) {
      filtros.tipo = tipo.split(',') as any[];
    }

    if (buildingId) {
      filtros.buildingId = buildingId;
    }

    if (unitId) {
      filtros.unitId = unitId;
    }

    if (tenantId) {
      filtros.tenantId = tenantId;
    }

    const eventos = await obtenerEventosCalendario(
      session.user.companyId,
      new Date(fechaInicio),
      new Date(fechaFin),
      filtros
    );

    return NextResponse.json(eventos);
  } catch (error) {
    logger.error('Error obteniendo eventos del calendario:', error);
    return NextResponse.json(
      { error: 'Error obteniendo eventos del calendario' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calendar
 * Crea un nuevo evento en el calendario
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      titulo,
      descripcion,
      tipo,
      prioridad = 'media',
      fechaInicio,
      fechaFin,
      todoElDia = false,
      ubicacion,
      color,
      buildingId,
      unitId,
      tenantId,
      contractId,
      recordatorioActivo = false,
      recordatorioMinutos,
      notas
    } = body;

    if (!titulo || !tipo || !fechaInicio) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: titulo, tipo, fechaInicio' },
        { status: 400 }
      );
    }

    const evento = await prisma.calendarEvent.create({
      data: {
        companyId: session.user.companyId,
        titulo,
        descripcion,
        tipo,
        prioridad,
        fechaInicio: new Date(fechaInicio),
        fechaFin: fechaFin ? new Date(fechaFin) : undefined,
        todoElDia,
        ubicacion,
        color,
        buildingId,
        unitId,
        tenantId,
        contractId,
        recordatorioActivo,
        recordatorioMinutos,
        notas,
        creadoPor: session.user.id
      },
      include: {
        building: true,
        unit: true,
        tenant: true,
        contract: true
      }
    });

    return NextResponse.json(evento, { status: 201 });
  } catch (error) {
    logger.error('Error creando evento:', error);
    return NextResponse.json(
      { error: 'Error creando evento' },
      { status: 500 }
    );
  }
}
