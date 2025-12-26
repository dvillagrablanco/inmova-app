import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { startOfDay, endOfDay } from 'date-fns';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tipoReporte = searchParams.get('tipoReporte');

    const where: any = {
      companyId: session?.user?.companyId,
    };

    if (tipoReporte && tipoReporte !== 'all') {
      where.tipoReporte = tipoReporte;
    }

    const reports = await prisma.auditReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(reports);
  } catch (error) {
    logger.error('Error al obtener reportes de auditoría:', error);
    return NextResponse.json({ error: 'Error al obtener reportes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { titulo, descripcion, tipoReporte, fechaInicio, fechaFin, filtros } = body;

    if (!titulo || !tipoReporte || !fechaInicio || !fechaFin) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const startDate = startOfDay(new Date(fechaInicio));
    const endDate = endOfDay(new Date(fechaFin));

    // Obtener eventos del período
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        companyId: session?.user?.companyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const securityEvents = await prisma.securityEvent.findMany({
      where: {
        companyId: session?.user?.companyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calcular estadísticas
    const totalEventos = auditLogs.length + securityEvents.length;
    const eventosError = securityEvents.filter((e) => e.severidad === 'error').length;
    const eventosCriticos = securityEvents.filter((e) => e.severidad === 'critical').length;
    const usuariosAfectados = new Set(
      [...auditLogs.map((a) => a.userId), ...securityEvents.map((s) => s.userId)].filter(Boolean)
    ).size;

    const report = await prisma.auditReport.create({
      data: {
        companyId: session?.user?.companyId,
        titulo,
        descripcion,
        tipoReporte,
        fechaInicio: startDate,
        fechaFin: endDate,
        filtros: filtros || {},
        totalEventos,
        eventosError,
        eventosCriticos,
        usuariosAfectados,
        generadoPor: session?.user?.email,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    logger.error('Error al crear reporte:', error);
    return NextResponse.json({ error: 'Error al crear reporte' }, { status: 500 });
  }
}
