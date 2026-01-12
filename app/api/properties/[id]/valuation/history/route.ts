import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/properties/[id]/valuation/history
 * Obtiene el histórico de valoraciones de una propiedad
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const propertyId = params.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Verificar que la propiedad existe y el usuario tiene acceso
    const property = await prisma.unit.findUnique({
      where: { id: propertyId },
      select: { companyId: true },
    });

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    if (property.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener histórico de valoraciones
    const valuations = await prisma.propertyValuation.findMany({
      where: { unitId: propertyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        estimatedValue: true,
        minValue: true,
        maxValue: true,
        confidenceScore: true,
        pricePerM2: true,
        investmentPotential: true,
        reasoning: true,
        keyFactors: true,
        marketComparison: true,
        recommendations: true,
        model: true,
        createdAt: true,
      },
    });

    // Calcular tendencia (si hay múltiples valoraciones)
    let trend = 'stable';
    if (valuations.length >= 2) {
      const latest = valuations[0].estimatedValue;
      const previous = valuations[1].estimatedValue;
      const change = ((latest - previous) / previous) * 100;

      if (change > 5) trend = 'up';
      else if (change < -5) trend = 'down';
    }

    return NextResponse.json({
      success: true,
      data: valuations,
      metadata: {
        count: valuations.length,
        trend,
        propertyId,
      },
    });
  } catch (error: any) {
    console.error('[Valuation History API Error]:', error);
    return NextResponse.json(
      { error: 'Error al obtener histórico de valoraciones' },
      { status: 500 }
    );
  }
}
