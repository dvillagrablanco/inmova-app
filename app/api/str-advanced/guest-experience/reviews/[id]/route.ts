import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const responseSchema = z.object({
  response: z.string().min(2),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;
    const body = await request.json();
    const validated = responseSchema.parse(body);

    const review = await prisma.sTRReview.findUnique({
      where: { id: params.id },
      include: { listing: { select: { companyId: true } } },
    });

    if (!review || review.listing.companyId !== companyId) {
      return NextResponse.json({ error: 'Reseña no encontrada' }, { status: 404 });
    }

    const updated = await prisma.sTRReview.update({
      where: { id: params.id },
      data: {
        respuesta: validated.response,
        respondidoEn: new Date(),
      },
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        response: updated.respuesta,
        respondedAt: updated.respondidoEn?.toISOString() || null,
      },
    });
  } catch (error) {
    logger.error('[Guest Experience] Error respondiendo reseña', error);
    return NextResponse.json({ error: 'Error al responder reseña' }, { status: 500 });
  }
}
