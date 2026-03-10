export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { trackView } from '@/lib/help-center/metrics';

const schema = z.object({
  articleId: z.string().min(1),
});

/**
 * POST /api/help/track — Registra una vista de artículo
 * Público (no requiere auth) — solo tracking anónimo
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId } = schema.parse(body);

    trackView(articleId);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
