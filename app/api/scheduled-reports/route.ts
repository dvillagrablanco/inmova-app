import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requirePermission } from '@/lib/permissions';
import { sendScheduledReport } from '@/lib/report-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/scheduled-reports
 * Obtiene todos los reportes programados de la empresa
 */
export async function GET(request: Request) {
  try {
    const user = await requireAuth();

    // Solo administradores y gestores pueden ver reportes programados
    if (user.role === 'operador') {
      return NextResponse.json(
        { error: 'No tienes permiso para ver reportes programados' },
        { status: 403 }
      );
    }

    const reports = await prisma.scheduledReport.findMany({
      where: {
        companyId: user.companyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(reports);
  } catch (error: any) {
    logger.error('Error al obtener reportes programados:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al obtener reportes programados' }, { status: 500 });
  }
}

/**
 * POST /api/scheduled-reports
 * Crea un nuevo reporte programado
 */
export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    // Solo administradores pueden crear reportes programados
    if (user.role !== 'administrador') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden crear reportes programados' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nombre, tipo, frecuencia, destinatarios, incluirPdf, incluirCsv, activo } = body;

    // Validaciones
    if (!nombre || !tipo || !frecuencia || !destinatarios || destinatarios.length === 0) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Calcular la fecha del próximo envío
    const now = new Date();
    let proximoEnvio = new Date(now);

    switch (frecuencia) {
      case 'diario':
        proximoEnvio.setDate(proximoEnvio.getDate() + 1);
        break;
      case 'semanal':
        proximoEnvio.setDate(proximoEnvio.getDate() + 7);
        break;
      case 'quincenal':
        proximoEnvio.setDate(proximoEnvio.getDate() + 15);
        break;
      case 'mensual':
        proximoEnvio.setMonth(proximoEnvio.getMonth() + 1);
        break;
      default:
        proximoEnvio.setDate(proximoEnvio.getDate() + 7);
    }

    const report = await prisma.scheduledReport.create({
      data: {
        companyId: user.companyId,
        nombre,
        tipo,
        frecuencia,
        destinatarios,
        incluirPdf: incluirPdf ?? true,
        incluirCsv: incluirCsv ?? true,
        activo: activo ?? true,
        proximoEnvio,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error: any) {
    logger.error('Error al crear reporte programado:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al crear reporte programado' }, { status: 500 });
  }
}
