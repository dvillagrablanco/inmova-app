import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { sendScheduledReport } from '@/lib/report-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/scheduled-reports/[id]/send
 * Envía un reporte programado inmediatamente
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo administradores pueden enviar reportes
    if (session.user.role !== 'administrador' && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = params;

    // Obtener el reporte
    const report = await prisma.scheduledReport.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el reporte pertenece a la empresa del usuario
    if (report.companyId !== session.user.companyId && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Enviar el reporte
    try {
      await sendScheduledReport(id);
      
      // Actualizar la fecha de último envío
      await prisma.scheduledReport.update({
        where: { id },
        data: {
          ultimoEnvio: new Date(),
        },
      });

      return NextResponse.json({
        message: 'Reporte enviado correctamente',
        success: true,
      });
    } catch (sendError: any) {
      console.error('Error al enviar reporte:', sendError);
      return NextResponse.json(
        { error: sendError.message || 'Error al enviar reporte' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error en endpoint send:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
