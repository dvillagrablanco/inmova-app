// @ts-nocheck
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

const postSchema = z.object({
  ejercicio: z.number().int().min(2020).max(2050),
  companyId: z.string().min(1).optional(),
  fecha: z.string().optional(),
  hora: z.string().optional(),
  lugar: z.string().optional(),
  asistentes: z
    .array(
      z.object({
        nombre: z.string(),
        cargo: z.string(),
        participaciones: z.number().min(0).max(100),
      })
    )
    .optional(),
  distribucionResultado: z
    .object({
      aReservas: z.number().min(0),
      aDividendos: z.number().min(0),
    })
    .optional(),
});

/**
 * GET /api/investment/board-minutes?ejercicio=2025
 * Genera borrador de acta de junta ordinaria con datos por defecto.
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
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const companyId = parsed.data.companyId || session.user.companyId;
    const { generateBoardMinutes } = await import('@/lib/board-minutes-service');
    const minutes = await generateBoardMinutes(companyId, parsed.data.ejercicio);

    return NextResponse.json({ success: true, data: minutes });
  } catch (error: any) {
    logger.error('[Board Minutes GET]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/investment/board-minutes
 * Genera acta personalizada con parámetros específicos.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const companyId = parsed.data.companyId || session.user.companyId;
    const { generateBoardMinutes } = await import('@/lib/board-minutes-service');
    const minutes = await generateBoardMinutes(companyId, parsed.data.ejercicio, {
      fecha: parsed.data.fecha,
      hora: parsed.data.hora,
      lugar: parsed.data.lugar,
      asistentes: parsed.data.asistentes,
      distribucionResultado: parsed.data.distribucionResultado,
    });

    return NextResponse.json({ success: true, data: minutes });
  } catch (error: any) {
    logger.error('[Board Minutes POST]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
