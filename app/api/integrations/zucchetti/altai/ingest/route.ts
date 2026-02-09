/**
 * API Route: Ingesta de movimientos para Altai
 *
 * POST /api/integrations/zucchetti/altai/ingest
 * Recibe asientos contables y los envía a Altai
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import { z } from 'zod';
import { sendAltaiEntry } from '@/lib/zucchetti-altai-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ingestSchema = z.object({
  companyId: z.string().optional(),
  dryRun: z.boolean().optional().default(false),
  entries: z
    .array(
      z.object({
        entry_date: z.string(),
        description: z.string(),
        reference: z.string().optional(),
        lines: z.array(
          z.object({
            account_code: z.string(),
            account_name: z.string().optional(),
            debit: z.number(),
            credit: z.number(),
            cost_center: z.string().optional(),
          })
        ),
      })
    )
    .min(1),
});

function hasValidIngestToken(req: NextRequest): boolean {
  const ingestToken = process.env.ZUCCHETTI_ALTAI_INGEST_TOKEN;
  if (!ingestToken) return false;

  const authHeader = req.headers.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const headerToken = req.headers.get('x-altai-ingest-token') || '';

  return ingestToken === bearer || ingestToken === headerToken;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const tokenAuthorized = hasValidIngestToken(req);

    if (!session?.user?.companyId && !tokenAuthorized) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session?.user?.companyId) {
      const role = session.user.role;
      const allowedRoles = new Set(['administrador', 'super_admin']);
      if (role && !allowedRoles.has(role)) {
        return NextResponse.json(
          { error: 'Solo administradores pueden ingestar asientos' },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const validated = ingestSchema.parse(body);

    const companyId =
      session?.user?.companyId || validated.companyId || req.headers.get('x-company-id');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId requerido para ingesta sin sesión' },
        { status: 400 }
      );
    }

    if (validated.dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        summary: {
          total: validated.entries.length,
        },
        entries: validated.entries,
      });
    }

    const results = [];
    let synced = 0;
    let failed = 0;

    for (const entry of validated.entries) {
      const response = await sendAltaiEntry(companyId, entry);
      if (response.ok) {
        synced += 1;
        results.push({ status: 'synced', response: response.data });
      } else {
        failed += 1;
        results.push({ status: 'failed', error: response.error });
      }
    }

    logger.info('[Altai Ingest] Resultado:', {
      companyId,
      synced,
      failed,
    });

    return NextResponse.json({
      success: failed === 0,
      summary: {
        total: validated.entries.length,
        synced,
        failed,
      },
      results,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    logger.error('[Altai Ingest] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error procesando ingesta',
      },
      { status: 500 }
    );
  }
}
