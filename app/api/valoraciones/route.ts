import { NextRequest, NextResponse } from 'next/server';
import { createUnifiedValuation } from '@/lib/unified-valuation-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/valoraciones
 * Guardar una valoración de IA en la base de datos
 */
export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/lib/auth-options');
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const resultado = body.resultado || body;

    const valoracion = await createUnifiedValuation(prisma as any, {
      companyId: session.user.companyId,
      requestedBy: session.user.id as string,
      unitId: body.unitId || null,
      buildingId: body.buildingId || null,
      address: body.direccion || body.address || 'Sin dirección',
      city: body.ciudad || body.city || body.municipio || '',
      postalCode: body.codigoPostal || body.postalCode || '',
      province: body.provincia || body.province || '',
      neighborhood: body.neighborhood || '',
      squareMeters: Number(body.superficie || body.squareMeters || 0),
      rooms: Number(body.habitaciones || body.rooms || 0),
      bathrooms: Number(body.banos || body.bathrooms || 0),
      floor: Number(body.planta || body.floor || 0),
      hasElevator: body.caracteristicas?.includes('ascensor') || body.hasElevator,
      hasParking: body.caracteristicas?.includes('garaje') || body.hasParking,
      hasGarden: body.caracteristicas?.includes('jardin') || body.hasGarden,
      hasPool: body.caracteristicas?.includes('piscina') || body.hasPool,
      hasTerrace: body.caracteristicas?.includes('terraza') || body.hasTerrace,
      hasGarage: body.caracteristicas?.includes('garaje') || body.hasGarage,
      condition: body.estadoConservacion || body.condition,
      yearBuilt: body.yearBuilt || null,
      estimatedValue: Number(resultado.valorEstimado || resultado.estimatedValue || 0),
      minValue: Number(resultado.valorMinimo || resultado.minValue || 0),
      maxValue: Number(resultado.valorMaximo || resultado.maxValue || 0),
      pricePerM2: Number(resultado.precioM2 || resultado.pricePerM2 || 0),
      confidenceScore: Number(resultado.confianza || resultado.confidenceScore || 70),
      model: resultado.model || 'valoraciones_legacy_proxy',
      reasoning: resultado.reasoning || resultado.analisisMercado || '',
      keyFactors: resultado.keyFactors || resultado.factoresPositivos || [],
      recommendations: resultado.recommendations || resultado.recomendaciones || [],
      estimatedRent: Number(resultado.alquilerEstimado || resultado.estimatedRent || 0),
      estimatedROI: Number(resultado.rentabilidadAlquiler || resultado.estimatedROI || 0),
      capRate: Number(resultado.capRate || 0),
      avgPricePerM2: Number(
        resultado.platformSources?.weightedSalePricePerM2 || resultado.precioM2 || 0
      ),
      marketTrend: resultado.tendenciaMercado || resultado.marketTrend || '',
      comparables: resultado.comparables || [],
      ipAddress: req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent'),
    });

    logger.info(`Valoración guardada: ${valoracion.id}`, { userId: session.user.id });
    return NextResponse.json({ success: true, id: valoracion.id }, { status: 201 });
  } catch (error: any) {
    logger.error('Error guardando valoración:', error);
    return NextResponse.json(
      { error: 'Error al guardar la valoración', message: error.message },
      { status: 500 }
    );
  }
}
