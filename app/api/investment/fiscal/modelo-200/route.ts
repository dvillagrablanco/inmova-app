import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const querySchema = z.object({
  ejercicio: z.coerce.number().int().min(2020).max(2050),
  companyId: z.string().min(1).optional(),
});

/**
 * GET /api/investment/fiscal/modelo-200?ejercicio=2025
 * Genera borrador del Modelo 200 (Declaración anual IS)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      ejercicio: searchParams.get('ejercicio'),
      companyId: searchParams.get('companyId'),
    });

    if (!parsed.success) {
      return NextResponse.json({
        error: 'Parámetros inválidos',
        details: parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const companyId = parsed.data.companyId || session.user.companyId;
    const { generateModelo200 } = await import('@/lib/fiscal-models-service');
    const modelo = await generateModelo200(companyId, parsed.data.ejercicio);

    return NextResponse.json({ success: true, data: modelo });
  } catch (error: any) {
    logger.error('[Modelo 200 API]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
