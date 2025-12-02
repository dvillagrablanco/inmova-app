import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/scheduled-reports/[id]/history
 * Obtiene el historial de envíos de un reporte programado
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = params;

    // Verificar que el reporte existe y pertenece a la empresa del usuario
    const report = await prisma.scheduledReport.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    if (report.companyId !== session.user.companyId && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // TODO: Implementar modelo ReportHistory en el schema de Prisma
    // Por ahora, devolvemos un historial simulado basado en ultimoEnvio
    const history = [];

    if (report.ultimoEnvio) {
      history.push({
        id: `${report.id}-${report.ultimoEnvio}`,
        reportId: report.id,
        fechaEnvio: report.ultimoEnvio,
        destinatarios: report.destinatarios,
        estado: 'exitoso',
      });
    }

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
