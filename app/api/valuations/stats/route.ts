/**
 * API Endpoint: Estadísticas de Valoraciones
 *
 * GET /api/valuations/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import { withRateLimit } from '@/lib/rate-limiting';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  return withRateLimit(req, async () => {
    try {
      // 1. Autenticación
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }

      const companyId = session.user.companyId;
      if (!companyId) {
        return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
      }

      const scope = await resolveCompanyScope({
        userId: session.user.id as string,
        role: session.user.role as any,
        primaryCompanyId: session.user.companyId,
        request: req,
      });

      const [modernValuations, legacyValuations] = await Promise.all([
        prisma.propertyValuation.findMany({
          where: { companyId: { in: scope.scopeCompanyIds } },
          select: {
            estimatedValue: true,
            confidenceScore: true,
            city: true,
          },
        }),
        prisma.valoracionPropiedad.findMany({
          where: { companyId: { in: scope.scopeCompanyIds } },
          select: {
            valorEstimado: true,
            confianzaValoracion: true,
            municipio: true,
          },
        }),
      ]);

      const merged = [
        ...modernValuations.map((valuation) => ({
          estimatedValue: valuation.estimatedValue,
          confidenceScore: valuation.confidenceScore,
          city: valuation.city,
        })),
        ...legacyValuations.map((valuation) => ({
          estimatedValue: valuation.valorEstimado,
          confidenceScore: valuation.confianzaValoracion,
          city: valuation.municipio,
        })),
      ];

      const totalValuations = merged.length;
      const avgEstimatedValue =
        merged.reduce((sum, valuation) => sum + valuation.estimatedValue, 0) / totalValuations || 0;
      const avgConfidenceScore =
        merged.reduce((sum, valuation) => sum + valuation.confidenceScore, 0) / totalValuations ||
        0;

      const citiesMap = new Map<string, { count: number; totalValue: number }>();
      merged.forEach((valuation) => {
        const cityKey = valuation.city || 'Sin ciudad';
        const current = citiesMap.get(cityKey) || { count: 0, totalValue: 0 };
        citiesMap.set(cityKey, {
          count: current.count + 1,
          totalValue: current.totalValue + valuation.estimatedValue,
        });
      });

      const topCities = Array.from(citiesMap.entries())
        .map(([city, data]) => ({
          city,
          count: data.count,
          avgValue: Math.round(data.totalValue / data.count),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const stats = {
        totalValuations,
        avgEstimatedValue: Math.round(avgEstimatedValue),
        avgConfidenceScore: Math.round(avgConfidenceScore * 100) / 100,
        topCities,
      };

      // 3. Respuesta
      return NextResponse.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Error fetching valuation stats:', error);
      return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
    }
  });
}
