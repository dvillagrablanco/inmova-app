import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { differenceInDays } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const companyId = session?.user?.companyId;
    // Obtener todos los proyectos de flipping
    const projects = await prisma.flippingProject.findMany({
      where: { companyId },
    });
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p: any) => ['EN_PROGRESO', 'EN_RENOVACION'].includes(p.estado || '')).length;
    const completedProjects = projects.filter((p: any) => p.estado === 'VENDIDO').length;
    // Calcular inversiones y beneficios
    const totalInvestment = projects.reduce((sum: number, p: any) => sum + (p.precioCompra || 0) + (p.gastosRealesRenovacion || 0), 0);
    const totalRevenue = projects
      .filter((p: any) => p.estado === 'VENDIDO')
      .reduce((sum: number, p: any) => sum + (p.precioVentaReal || 0), 0);
    // Calcular ROI promedio
    const completedProjectsWithROI = projects.filter((p: any) => p.estado === 'VENDIDO' && p.precioVentaReal && p.precioCompra);
    const avgROI = completedProjectsWithROI.length > 0
      ? Math.round(
          completedProjectsWithROI.reduce((sum: number, p: any) => {
            const investment = (p.precioCompra || 0) + (p.gastosRealesRenovacion || 0);
            const profit = (p.precioVentaReal || 0) - investment;
            return sum + (investment > 0 ? (profit / investment) * 100 : 0);
          }, 0) / completedProjectsWithROI.length
        )
      : 0;
    // Calcular duración promedio de proyectos completados
    const projectsWithDates = projects.filter((p: any) => p.fechaInicioObra && p.fechaFinObra);
    const avgProjectDuration = projectsWithDates.length > 0
      ? projectsWithDates.reduce((sum: number, p: any) => {
            return sum + differenceInDays(p.fechaFinObra!, p.fechaInicioObra!);
          }, 0) / projectsWithDates.length
      : 0;
    // Calcular margen de beneficio
    const profitMargin = totalInvestment > 0
      ? Math.round(((totalRevenue - totalInvestment) / totalInvestment) * 100)
      : 0;
    const metrics = {
      totalProjects,
      activeProjects,
      completedProjects,
      totalInvestment: Math.round(totalInvestment),
      totalRevenue: Math.round(totalRevenue),
      avgROI,
      avgProjectDuration,
      profitMargin,
    };
    return NextResponse.json(metrics);
  } catch (error) {
    logger.error('Error fetching flipping metrics:', error);
    return NextResponse.json({ error: 'Error al obtener métricas de flipping' }, { status: 500 });
  }
}
