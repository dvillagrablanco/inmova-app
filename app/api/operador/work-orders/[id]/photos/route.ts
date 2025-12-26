/**
 * API de Fotos para Órdenes de Trabajo
 * POST - Añade fotos a una orden de trabajo
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { addWorkOrderPhotos } from '@/lib/work-order-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    // Verificar que es un operador
    if (role !== 'operador') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { photoUrls } = body;

    if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
      return NextResponse.json({ error: 'Se requieren URLs de fotos' }, { status: 400 });
    }

    // Añadir fotos
    const updated = await addWorkOrderPhotos(params.id, userId, photoUrls);

    logger.info(`Operador ${userId} añadió ${photoUrls.length} fotos a orden ${params.id}`);

    return NextResponse.json(updated);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'POST /api/operador/work-orders/[id]/photos',
      workOrderId: params.id,
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al añadir fotos' },
      { status: 500 }
    );
  }
}
