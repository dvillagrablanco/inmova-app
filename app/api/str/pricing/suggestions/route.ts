export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;

    // Obtener listings STR de la empresa
    const listings = await prisma.sTRListing.findMany({
      where: {
        companyId,
        activo: true,
      },
      select: {
        id: true,
        titulo: true,
        precioBase: true,
        precioActual: true,
        unit: {
          select: {
            numero: true,
            building: {
              select: {
                nombre: true,
                direccion: true,
              },
            },
          },
        },
      },
    });

    // Obtener reglas de pricing dinámico
    const pricingRules = await prisma.sTRDynamicPricingRule.findMany({
      where: {
        companyId,
        activo: true,
      },
    });

    // Generar sugerencias basadas en datos reales
    const suggestions = listings.map((listing) => {
      const currentPrice = listing.precioActual || listing.precioBase;
      
      // Calcular sugerencia basada en reglas activas
      let suggestedPrice = currentPrice;
      const factors: Array<{
        name: string;
        impact: 'high' | 'medium' | 'low';
        description: string;
      }> = [];

      // Aplicar reglas de pricing si existen
      for (const rule of pricingRules) {
        if (rule.tipo === 'estacionalidad') {
          const config = rule.configuracion as any;
          if (config?.multiplicador) {
            suggestedPrice *= config.multiplicador;
            factors.push({
              name: 'Estacionalidad',
              impact: config.multiplicador > 1.2 ? 'high' : 'medium',
              description: `Ajuste estacional: ${((config.multiplicador - 1) * 100).toFixed(0)}%`,
            });
          }
        }
        if (rule.tipo === 'demanda') {
          const config = rule.configuracion as any;
          if (config?.ajuste) {
            suggestedPrice += config.ajuste;
            factors.push({
              name: 'Demanda',
              impact: Math.abs(config.ajuste) > 20 ? 'high' : 'medium',
              description: `Ajuste por demanda: ${config.ajuste > 0 ? '+' : ''}€${config.ajuste}`,
            });
          }
        }
      }

      const change = suggestedPrice - currentPrice;
      const changePercent = currentPrice > 0 ? (change / currentPrice) * 100 : 0;

      // Generar razón basada en los factores
      let reason = 'Sin cambios sugeridos';
      if (factors.length > 0) {
        const mainFactor = factors[0];
        reason = mainFactor.description;
      }

      // Calcular confianza basada en cantidad de datos
      const confidence = Math.min(50 + factors.length * 15, 95);

      return {
        listingId: listing.id,
        listingName: `${listing.titulo} - ${listing.unit?.building?.nombre || ''} ${listing.unit?.numero || ''}`.trim(),
        currentPrice,
        suggestedPrice: Math.round(suggestedPrice * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 10) / 10,
        reason,
        confidence,
        factors,
      };
    });

    return NextResponse.json(suggestions);
  } catch (error) {
    logger.error('Error fetching pricing suggestions:', error);
    return NextResponse.json(
      { error: 'Error al obtener sugerencias' },
      { status: 500 }
    );
  }
}
