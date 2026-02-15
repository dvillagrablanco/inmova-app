import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/investment/analysis/[id] - Obtener analisis completo
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const analysis = await prisma.investmentAnalysis.findFirst({
      where: { id: params.id, companyId: session.user.companyId },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analisis no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: analysis });
  } catch (error: any) {
    logger.error('[Analysis GET by ID]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error obteniendo analisis' }, { status: 500 });
  }
}

/**
 * DELETE /api/investment/analysis/[id] - Eliminar analisis
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const analysis = await prisma.investmentAnalysis.findFirst({
      where: { id: params.id, companyId: session.user.companyId },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analisis no encontrado' }, { status: 404 });
    }

    await prisma.investmentAnalysis.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('[Analysis DELETE]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error eliminando analisis' }, { status: 500 });
  }
}
