import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const companyId = session?.user?.companyId;
    // Obtener proyectos vendidos
    const projects = await prisma.flippingProject.findMany({
      where: { 
        companyId,
        estado: 'VENDIDO',
      },
      take: 10, // Top 10 proyectos
      orderBy: {
        completadoEn: 'desc',
      },
    });
    // Calcular ROI para cada proyecto
    const roiData = projects.map((project: any) => {
      const investment = (project.precioCompra || 0) + (project.gastosRealesRenovacion || 0);
      const revenue = project.precioVentaReal || 0;
      const profit = revenue - investment;
      const roi = investment > 0 ? Math.round((profit / investment) * 100) : 0;
      return {
        project: project.nombre || `Proyecto ${project.id}`,
        investment: Math.round(investment),
        revenue: Math.round(revenue),
        profit: Math.round(profit),
        roi,
      };
    });
    // Ordenar por ROI descendente
    roiData.sort((a, b) => b.roi - a.roi);
    return NextResponse.json(roiData);
  } catch (error) {
    logger.error('Error fetching ROI analysis:', error);
    return NextResponse.json({ error: 'Error al obtener análisis de ROI' }, { status: 500 });
  }
}
