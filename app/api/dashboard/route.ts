import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import { cachedDashboardStats } from '@/lib/api-cache-helpers';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    // Obtener información de la empresa (si es de prueba)
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { esEmpresaPrueba: true }
    });

    // Usar datos cacheados para los KPIs principales y monthly income
    const cachedData = await cachedDashboardStats(companyId);

    // El resto de los datos se mantienen sin caché por ahora (son menos críticos)
    // En el futuro se pueden optimizar también
    
    return NextResponse.json({
      ...cachedData,
      // Incluir flag de empresa de prueba para controlar visibilidad del DemoDataGenerator
      esEmpresaPrueba: company?.esEmpresaPrueba || false
    });
  } catch (error: any) {
    // No loggear errores de auth (son normales en prefetch)
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    logger.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Error al obtener datos del dashboard' }, { status: 500 });
  }
}
