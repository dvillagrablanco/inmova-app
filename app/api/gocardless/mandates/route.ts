import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';
import { getGCClient } from '@/lib/gocardless-integration';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/gocardless/mandates
 * Lista mandatos SEPA de la empresa
 * Query: ?status=active&tenantId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tenantId = searchParams.get('tenantId');

    const prisma = getPrismaClient();

    const where: any = { companyId: session.user.companyId };
    if (status) where.status = status;
    if (tenantId) where.customer = { tenantId };

    const mandates = await prisma.sepaMandate.findMany({
      where,
      include: {
        customer: {
          select: {
            gcCustomerId: true,
            email: true,
            givenName: true,
            familyName: true,
            tenantId: true,
            bankName: true,
            iban: true,
          },
        },
        _count: {
          select: {
            payments: true,
            subscriptions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: mandates,
      summary: {
        total: mandates.length,
        active: mandates.filter(m => m.status === 'active').length,
        pending: mandates.filter(m => m.status === 'pending_submission' || m.status === 'submitted').length,
      },
    });
  } catch (error: any) {
    logger.error('[GC Mandates GET]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/gocardless/mandates
 * Cancelar un mandato
 * Body: { mandateId: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const gc = getGCClient();
    if (!gc) {
      return NextResponse.json({ error: 'GoCardless no configurado' }, { status: 503 });
    }

    const { mandateId } = await request.json();
    if (!mandateId) {
      return NextResponse.json({ error: 'mandateId requerido' }, { status: 400 });
    }

    const prisma = getPrismaClient();
    const mandate = await prisma.sepaMandate.findFirst({
      where: { id: mandateId, companyId: session.user.companyId },
    });

    if (!mandate) {
      return NextResponse.json({ error: 'Mandato no encontrado' }, { status: 404 });
    }

    const cancelled = await gc.cancelMandate(mandate.gcMandateId);
    if (cancelled) {
      await prisma.sepaMandate.update({
        where: { id: mandateId },
        data: { status: 'cancelled' },
      });
    }

    return NextResponse.json({ success: cancelled });
  } catch (error: any) {
    logger.error('[GC Mandates DELETE]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
