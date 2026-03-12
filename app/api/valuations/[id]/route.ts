/**
 * API Endpoint: Obtener Valoración por ID
 *
 * GET /api/valuations/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { withRateLimit } from '@/lib/rate-limiting';
import { resolveCompanyScope } from '@/lib/company-scope';
import {
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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

      // 2. Validar ID
      const valuationId = params.id;
      if (!valuationId) {
        return NextResponse.json({ error: 'ID de valoración requerido' }, { status: 400 });
      }

      // 3. Obtener valoración
      const valuation = await prisma.propertyValuation.findFirst({
        where: {
          id: valuationId,
          companyId: { in: scope.scopeCompanyIds },
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

      if (valuation) {
        return NextResponse.json({
          success: true,
          data: normalizeModernValuation(valuation),
        });
      }

      const legacyValuation = await prisma.valoracionPropiedad.findFirst({
        where: {
          id: valuationId,
          companyId: { in: scope.scopeCompanyIds },
        },
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
      });

      if (!legacyValuation) {
        return NextResponse.json({ error: 'Valoración no encontrada' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: normalizeLegacyValuation(legacyValuation),
      });
    } catch (error: any) {
      logger.error('Error fetching valuation:', error);
      return NextResponse.json({ error: 'Error al obtener valoración' }, { status: 500 });
    }
  });
}
