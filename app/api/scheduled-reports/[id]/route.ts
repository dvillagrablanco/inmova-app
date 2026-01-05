import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import { sendScheduledReport } from '@/lib/report-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/scheduled-reports/[id]
 * Actualiza un reporte programado
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();

    // Solo administradores y super_admin pueden modificar reportes programados
    if (user.role !== 'administrador' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden modificar reportes programados' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Verificar que el reporte pertenece a la empresa del usuario
    const existingReport = await prisma.scheduledReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });
    }

    if (existingReport.companyId !== user.companyId) {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar este reporte' },
        { status: 403 }
      );
    }

    const report = await prisma.scheduledReport.update({
      where: { id },
      data: {
        nombre: body.nombre,
        tipo: body.tipo,
        frecuencia: body.frecuencia,
        destinatarios: body.destinatarios,
        incluirPdf: body.incluirPdf,
        incluirCsv: body.incluirCsv,
        activo: body.activo,
      },
    });

    return NextResponse.json(report);
  } catch (error: any) {
    logger.error('Error al actualizar reporte programado:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al actualizar reporte programado' }, { status: 500 });
  }
}

/**
 * DELETE /api/scheduled-reports/[id]
 * Elimina un reporte programado
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();

    // Solo administradores y super_admin pueden eliminar reportes programados
    if (user.role !== 'administrador' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden eliminar reportes programados' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Verificar que el reporte pertenece a la empresa del usuario
    const existingReport = await prisma.scheduledReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });
    }

    if (existingReport.companyId !== user.companyId) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar este reporte' },
        { status: 403 }
      );
    }

    await prisma.scheduledReport.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Reporte eliminado correctamente' });
  } catch (error: any) {
    logger.error('Error al eliminar reporte programado:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al eliminar reporte programado' }, { status: 500 });
  }
}

/**
 * POST /api/scheduled-reports/[id]/send
 * Envía un reporte programado inmediatamente (para pruebas)
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();

    // Solo administradores y super_admin pueden enviar reportes manualmente
    if (user.role !== 'administrador' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden enviar reportes manualmente' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Verificar que el reporte pertenece a la empresa del usuario
    const existingReport = await prisma.scheduledReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });
    }

    if (existingReport.companyId !== user.companyId) {
      return NextResponse.json(
        { error: 'No tienes permiso para enviar este reporte' },
        { status: 403 }
      );
    }

    // Enviar el reporte
    await sendScheduledReport(id);

    return NextResponse.json({ message: 'Reporte enviado correctamente' });
  } catch (error: any) {
    logger.error('Error al enviar reporte programado:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al enviar reporte programado' }, { status: 500 });
  }
}
