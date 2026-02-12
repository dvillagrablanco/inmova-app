/**
 * API Endpoint: Listar Valoraciones
 * 
 * GET /api/valuations?unitId=xxx&page=1&limit=20
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { withRateLimit } from '@/lib/rate-limiting';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  return withRateLimit(req, async () => {
    try {
      // 1. Autenticación
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        );
      }

      const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const companyId = cookieCompanyId || session.user.companyId;
      if (!companyId) {
        return NextResponse.json(
          { error: 'Company ID no encontrado' },
          { status: 400 }
        );
      }

      // 2. Parsear query parameters
      const { searchParams } = new URL(req.url);
      const unitId = searchParams.get('unitId');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const city = searchParams.get('city');

      // Validar paginación
      if (page < 1 || limit < 1 || limit > 100) {
        return NextResponse.json(
          { error: 'Parámetros de paginación inválidos' },
          { status: 400 }
        );
      }

      const skip = (page - 1) * limit;

      // 3. Construir filtros
      const where: any = {
        companyId,
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

      // 4. Obtener valoraciones
      const [valuations, total] = await Promise.all([
        prisma.propertyValuation.findMany({
          where,
          skip,
          take: limit,
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
        prisma.propertyValuation.count({ where }),
      ]);

      // 5. Respuesta
      return NextResponse.json({
        success: true,
        data: valuations,
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
      return NextResponse.json(
        { error: 'Error al obtener valoraciones' },
        { status: 500 }
      );
    }
  });
}
