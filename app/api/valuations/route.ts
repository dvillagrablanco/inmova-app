/**
 * API Endpoint: Listar Valoraciones
 *
 * GET /api/valuations?unitId=xxx&page=1&limit=20
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { withRateLimit } from '@/lib/rate-limiting';
import { resolveCompanyScope } from '@/lib/company-scope';
import {
  createUnifiedValuation,
  normalizeLegacyValuation,
  normalizeModernValuation,
} from '@/lib/unified-valuation-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
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

      // 2. Parsear query parameters
      const { searchParams } = new URL(req.url);
      const unitId = searchParams.get('unitId');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const city = searchParams.get('city');

      // Validar paginación
      if (page < 1 || limit < 1 || limit > 100) {
        return NextResponse.json({ error: 'Parámetros de paginación inválidos' }, { status: 400 });
      }

      const skip = (page - 1) * limit;

      // 3. Construir filtros
      const where: any = {
        companyId: { in: scope.scopeCompanyIds },
      };

      if (unitId) {
        where.unitId = unitId;
      }

      if (city) {
        where.city = {
          contains: city,
          mode: 'insensitive',
        };
      }

      const legacyWhere: any = {
        companyId: { in: scope.scopeCompanyIds },
      };

      if (unitId) {
        legacyWhere.unitId = unitId;
      }

      if (city) {
        legacyWhere.municipio = {
          contains: city,
          mode: 'insensitive',
        };
      }

      // 4. Obtener valoraciones
      const [valuations, legacyValuations] = await Promise.all([
        prisma.propertyValuation.findMany({
          where,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            address: true,
            city: true,
            postalCode: true,
            squareMeters: true,
            rooms: true,
            bathrooms: true,
            condition: true,
            estimatedValue: true,
            confidenceScore: true,
            minValue: true,
            maxValue: true,
            pricePerM2: true,
            estimatedRent: true,
            estimatedROI: true,
            capRate: true,
            model: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            unit: {
              select: {
                numero: true,
                building: {
                  select: {
                    nombre: true,
                  },
                },
              },
            },
          },
        }),
        prisma.valoracionPropiedad.findMany({
          where: legacyWhere,
          orderBy: { fechaValoracion: 'desc' },
          include: {
            unit: {
              select: {
                numero: true,
              },
            },
            building: {
              select: {
                nombre: true,
              },
            },
          },
        }),
      ]);

      const mergedValuations = [
        ...valuations.map(normalizeModernValuation),
        ...legacyValuations.map(normalizeLegacyValuation),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const total = mergedValuations.length;
      const paginated = mergedValuations.slice(skip, skip + limit);

      // 5. Respuesta
      return NextResponse.json({
        success: true,
        data: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + limit < total,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching valuations:', error);
      return NextResponse.json({ error: 'Error al obtener valoraciones' }, { status: 500 });
    }
  });
}

export async function POST(req: NextRequest) {
  const prisma = await getPrisma();

  return withRateLimit(req, async () => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id || !session.user.companyId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }

      const body = await req.json();
      const resultado = body.resultado || body;

      const saved = await createUnifiedValuation(prisma as any, {
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
        model: resultado.model || 'valoracion_ia_page',
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

      return NextResponse.json({ success: true, data: saved }, { status: 201 });
    } catch (error: any) {
      logger.error('Error creating unified valuation:', error);
      return NextResponse.json({ error: 'Error al guardar la valoración' }, { status: 500 });
    }
  });
}
