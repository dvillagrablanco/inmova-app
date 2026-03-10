export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { trackFeedback } from '@/lib/help-center/metrics';

const schema = z.object({
  articleId: z.string().min(1),
  helpful: z.boolean(),
});

/**
 * POST /api/help/feedback — Registra feedback útil/no útil
 * Público (no requiere auth) — feedback anónimo
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId, helpful } = schema.parse(body);

    trackFeedback(articleId, helpful);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
