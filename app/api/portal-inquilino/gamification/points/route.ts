/**
 * API para añadir puntos a inquilinos
 * POST: Añadir puntos por acción
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  tenantGamification,
  TenantPointAction,
  TENANT_POINTS,
} from '@/lib/tenant-gamification-service';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const addPointsSchema = z.object({
  tenantId: z.string().min(1),
  action: z.enum(Object.keys(TENANT_POINTS) as [TenantPointAction, ...TenantPointAction[]]),
  metadata: z.record(z.any()).optional(),
});

// POST: Añadir puntos por acción (usado internamente por otros módulos)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Solo administradores o el sistema pueden añadir puntos
    if (!session?.user || !['super_admin', 'administrador'].includes(session.user.role)) {
      // Verificar si es una llamada interna (API key)
      const apiKey = request.headers.get('x-internal-api-key');
      if (apiKey !== process.env.INTERNAL_API_KEY) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
    }

    const body = await request.json();
    const validated = addPointsSchema.parse(body);

    const result = await tenantGamification.addPoints(
      validated.tenantId,
      validated.action,
      validated.metadata || {}
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: result.levelUp
        ? `¡Subiste a nivel ${result.newLevel?.name}!`
        : `+${result.pointsAdded} puntos`,
    });
  } catch (error: any) {
    logger.error('[Tenant Add Points Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: error.message || 'Error añadiendo puntos' }, { status: 500 });
  }
}
