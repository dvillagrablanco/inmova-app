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

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = await getPrisma();

    const solicitud = await prisma.insuranceQuoteRequest.findUnique({
      where: { id: params.id },
      select: { companyId: true, estado: true },
    });

    if (!solicitud) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    if (solicitud.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { sendQuoteRequestEmails } = await import('@/lib/insurance/quote-request-service');

    const result = await sendQuoteRequestEmails(params.id);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('[API] Error sending quote request emails:', error);
    return NextResponse.json({ error: 'Error al enviar solicitud de cotización' }, { status: 500 });
  }
}
