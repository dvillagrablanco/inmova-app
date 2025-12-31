import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { AIValuationService } from '@/lib/ai-valuation-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/properties/[id]/valuation
 * Obtiene valoración con IA de una propiedad
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const propertyId = params.id;

    // Obtener propiedad con datos completos
    const property = await prisma.unit.findUnique({
      where: { id: propertyId },
      include: {
        building: {
          select: {
            nombre: true,
            direccion: true,
            ciudad: true,
            codigoPostal: true,
            barrio: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      );
    }

    // Verificar acceso (ownership)
    if (property.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    // Preparar datos para valoración
    const propertyData = {
      address: property.building.direccion,
      city: property.building.ciudad,
      neighborhood: property.building.barrio || undefined,
      postalCode: property.building.codigoPostal || undefined,
      squareMeters: property.superficie,
      rooms: property.habitaciones || undefined,
      bathrooms: property.banos || undefined,
      floor: property.planta || undefined,
      aireAcondicionado: property.aireAcondicionado,
      calefaccion: property.calefaccion,
      terraza: property.terraza,
      balcon: property.balcon,
      orientacion: property.orientacion || undefined,
    };

    // Obtener datos del mercado
    const marketData = await AIValuationService.getMarketData(
      property.building.ciudad,
      property.building.barrio || undefined,
      property.building.codigoPostal || undefined
    );

    // Buscar propiedades similares en la BD
    const similarProperties = await prisma.unit.findMany({
      where: {
        companyId: session.user.companyId,
        id: { not: propertyId },
        building: {
          ciudad: property.building.ciudad,
        },
        superficie: {
          gte: property.superficie * 0.8,
          lte: property.superficie * 1.2,
        },
        habitaciones: property.habitaciones,
      },
      select: {
        id: true,
        numero: true,
        superficie: true,
        rentaMensual: true,
        building: {
          select: {
            direccion: true,
          },
        },
      },
      take: 5,
    });

    // Agregar comparables al marketData
    marketData.similarProperties = similarProperties.map((prop) => ({
      address: `${prop.building.direccion}, Unidad ${prop.numero}`,
      price: prop.rentaMensual * 12 * 15, // Estimación valor = renta anual * 15
      squareMeters: prop.superficie,
    }));

    // Realizar valoración con IA
    const valuation = await AIValuationService.valuateProperty(
      propertyData,
      marketData
    );

    // Guardar valoración en BD (opcional)
    try {
      await prisma.propertyValuation.create({
        data: {
          unitId: propertyId,
          estimatedValue: valuation.estimatedValue,
          minValue: valuation.minValue,
          maxValue: valuation.maxValue,
          confidenceScore: valuation.confidenceScore,
          pricePerM2: valuation.pricePerM2,
          reasoning: valuation.reasoning,
          keyFactors: valuation.keyFactors,
          marketComparison: valuation.marketComparison,
          investmentPotential: valuation.investmentPotential,
          recommendations: valuation.recommendations,
          model: 'claude-3.5-sonnet',
          companyId: session.user.companyId,
        },
      });
    } catch (dbError) {
      console.error('Error saving valuation:', dbError);
      // No fallar si no se puede guardar
    }

    return NextResponse.json({
      success: true,
      data: valuation,
      metadata: {
        propertyId,
        address: `${property.building.direccion}, ${property.building.ciudad}`,
        squareMeters: property.superficie,
        marketData: {
          avgPricePerM2: marketData.avgPricePerM2,
          trend: marketData.marketTrend,
          comparablesCount: marketData.similarProperties?.length || 0,
        },
      },
    });
  } catch (error: any) {
    console.error('[Valuation API Error]:', error);

    if (error.message.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json(
        {
          error: 'Servicio de valoración no configurado',
          details: 'Contacta al administrador',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Error al generar valoración',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
