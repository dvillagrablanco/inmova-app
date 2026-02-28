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
  trimestre: z.coerce.number().int().min(1).max(4),
  companyId: z.string().min(1).optional(),
});

/**
 * GET /api/investment/fiscal/modelo-303?ejercicio=2026&trimestre=1
 * Genera borrador del Modelo 303 (IVA trimestral - locales comerciales)
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
      trimestre: searchParams.get('trimestre'),
      companyId: searchParams.get('companyId'),
    });

    if (!parsed.success) {
      return NextResponse.json({
        error: 'Parámetros inválidos',
        details: parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const companyId = parsed.data.companyId || session.user.companyId;
    const { generateModelo303 } = await import('@/lib/fiscal-models-service');
    const modelo = await generateModelo303(
      companyId,
      parsed.data.ejercicio,
      parsed.data.trimestre as 1 | 2 | 3 | 4
    );

    return NextResponse.json({ success: true, data: modelo });
  } catch (error: any) {
    logger.error('[Modelo 303 API]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
