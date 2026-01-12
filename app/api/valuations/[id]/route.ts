/**
 * API Endpoint: Obtener Valoración por ID
 * 
 * GET /api/valuations/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { withRateLimit } from '@/lib/rate-limiting';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

      const companyId = session.user.companyId;
      if (!companyId) {
        return NextResponse.json(
          { error: 'Company ID no encontrado' },
          { status: 400 }
        );
      }

      // 2. Validar ID
      const valuationId = params.id;
      if (!valuationId) {
        return NextResponse.json(
          { error: 'ID de valoración requerido' },
          { status: 400 }
        );
      }

      // 3. Obtener valoración
      const valuation = await prisma.propertyValuation.findFirst({
        where: {
          id: valuationId,
          companyId, // Verificar que pertenece a la empresa
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          unit: {
            select: {
              numero: true,
              tipo: true,
              superficie: true,
              habitaciones: true,
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

      if (!valuation) {
        return NextResponse.json(
          { error: 'Valoración no encontrada' },
          { status: 404 }
        );
      }

      // 4. Respuesta
      return NextResponse.json({
        success: true,
        data: valuation,
      });
    } catch (error: any) {
      logger.error('Error fetching valuation:', error);
      return NextResponse.json(
        { error: 'Error al obtener valoración' },
        { status: 500 }
      );
    }
  });
}
