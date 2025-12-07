import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
const STATUS_LABELS: Record<string, string> = {
  PROSPECTO: 'Prospecto',
  EN_ANALISIS: 'En Análisis',
  EN_NEGOCIACION: 'En Negociación',
  ADQUIRIDO: 'Adquirido',
  EN_RENOVACION: 'En Renovación',
  EN_PROGRESO: 'En Progreso',
  LISTO_VENTA: 'Listo para Venta',
  EN_VENTA: 'En Venta',
  VENDIDO: 'Vendido',
  CANCELADO: 'Cancelado',
  SUSPENDIDO: 'Suspendido',
};
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    // Obtener proyectos agrupados por estado
    const projects = await prisma.flippingProject.findMany({
      where: { companyId },
    });
    // Agrupar por estado
    const statusMap = new Map<string, { count: number; value: number }>();
    for (const project of projects) {
      const status = project.estado || 'PROSPECTO';
      const investment = (project.precioCompra || 0) + (project.gastosRealesRenovacion || 0);
      if (statusMap.has(status)) {
        const existing = statusMap.get(status)!;
        statusMap.set(status, {
          count: existing.count + 1,
          value: existing.value + investment,
        });
      } else {
        statusMap.set(status, {
          count: 1,
          value: investment,
        });
      }
    }
    // Convertir a array
    const statusData = Array.from(statusMap.entries()).map(([status, data]) => ({
      status: STATUS_LABELS[status] || status,
      count: data.count,
      value: Math.round(data.value),
    }));
    // Ordenar por cantidad
    statusData.sort((a, b) => b.count - a.count);
    return NextResponse.json(statusData);
  } catch (error) {
    logger.error('Error fetching project status:', error);
    return NextResponse.json({ error: 'Error al obtener estado de proyectos' }, { status: 500 });
  }
}
