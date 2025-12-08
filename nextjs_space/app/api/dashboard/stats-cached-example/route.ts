/**
 * EJEMPLO: Dashboard con Caché Redis y Rate Limiting
 * 
 * Este archivo es un EJEMPLO completo de cómo:
 * 1. Aplicar rate limiting
 * 2. Usar caché Redis
 * 3. Logging estructurado
 * 4. Manejo de errores
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { applyRateLimit } from '@/lib/rate-limit';
import { getCached, CACHE_TTL, invalidateCache, companyKey } from '@/lib/redis';
import { prisma } from '@/lib/db';
import logger, { logError, logPerformance } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // ✅ 1. Rate limiting
  const rateLimitResponse = await applyRateLimit(request, 'read');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // ✅ 2. Autenticación
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    );
  }

  const companyId = session.user.companyId;
  const userId = session.user.id;

  try {
    // ✅ 3. Caché con Redis
    const cacheKey = companyKey(companyId, 'dashboard:stats');
    const stats = await getCached(
      cacheKey,
      async () => {
        logger.info('Fetching dashboard stats from database', { companyId, userId });

        // Consultas paralelas para mejor performance
        const [buildings, units, tenants, activeContracts, pendingPayments] = await Promise.all([
          // Edificios
          prisma.building.count({
            where: { companyId },
          }),
          
          // Unidades
          prisma.unit.count({
            where: {
              building: { companyId },
            },
          }),
          
          // Inquilinos
          prisma.tenant.count({
            where: {
              companyId,
            },
          }),
          
          // Contratos activos
          prisma.contract.count({
            where: {
              tenant: { companyId },
              estado: 'activo',
            },
          }),
          
          // Pagos pendientes
          prisma.payment.count({
            where: {
              contract: {
                tenant: { companyId },
              },
              estado: 'pendiente',
            },
          }),
        ]);

        // Unidades disponibles
        const availableUnits = await prisma.unit.count({
          where: {
            building: { companyId },
            estado: 'disponible',
          },
        });

        // Tasa de ocupación
        const occupancyRate = units > 0 ? ((units - availableUnits) / units) * 100 : 0;

        return {
          buildings,
          units,
          availableUnits,
          tenants,
          activeContracts,
          pendingPayments,
          occupancyRate: Math.round(occupancyRate * 100) / 100,
        };
      },
      CACHE_TTL.MEDIUM // 5 minutos
    );

    // ✅ 4. Log de performance
    const duration = Date.now() - startTime;
    logPerformance('dashboard-stats', duration, {
      companyId,
      cached: duration < 100, // Si es muy rápido, probablemente fue cacheado
    });

    return NextResponse.json(stats);
  } catch (error) {
    // ✅ 5. Manejo de errores con logging
    logError(error as Error, {
      endpoint: '/api/dashboard/stats',
      companyId,
      userId,
    });

    return NextResponse.json(
      { error: 'Error al obtener estadísticas del dashboard' },
      { status: 500 }
    );
  }
}

// Endpoint para invalidar caché (llamar cuando se actualicen datos)
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    );
  }

  const companyId = session.user.companyId;

  try {
    // Invalidar caché
    const cacheKey = companyKey(companyId, 'dashboard:stats');
    await invalidateCache(cacheKey);
    
    logger.info('Dashboard cache invalidated', { companyId });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error as Error, {
      endpoint: '/api/dashboard/stats (DELETE)',
      companyId,
    });

    return NextResponse.json(
      { error: 'Error al invalidar caché' },
      { status: 500 }
    );
  }
}
