import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// POST - Accept a quotation (mark as selected, reject others for the same request)
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const prisma = await getPrisma();

    const quotation = await prisma.insuranceQuotation.findUnique({
      where: { id },
      select: { companyId: true, requestId: true, estado: true },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    if (quotation.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    if (quotation.estado === 'aceptada') {
      return NextResponse.json({ error: 'La cotización ya está aceptada' }, { status: 400 });
    }

    // If this quotation belongs to a request, reject all other quotations for that request
    if (quotation.requestId) {
      await prisma.insuranceQuotation.updateMany({
        where: {
          requestId: quotation.requestId,
          id: { not: id },
          estado: { notIn: ['expirada'] },
        },
        data: {
          estado: 'rechazada',
          seleccionada: false,
        },
      });
    }

    // Mark this quotation as accepted
    const accepted = await prisma.insuranceQuotation.update({
      where: { id },
      data: {
        estado: 'aceptada',
        seleccionada: true,
      },
      include: {
        provider: true,
        request: true,
      },
    });

    logger.info('Quotation accepted', {
      quotationId: id,
      providerId: accepted.providerId,
      requestId: accepted.requestId,
      userId: session.user.id,
    });

    return NextResponse.json(accepted);
  } catch (error) {
    logger.error('[Cotización Aceptar POST]:', error);
    return NextResponse.json({ error: 'Error al aceptar cotización' }, { status: 500 });
  }
}
