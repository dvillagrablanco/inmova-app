import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';
import { getGCClient, eurosToCents } from '@/lib/gocardless-integration';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/gocardless/payments
 * Lista pagos SEPA de la empresa (desde BD local)
 * Query: ?status=confirmed&page=1&limit=20&tenantId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const status = searchParams.get('status');
    const tenantId = searchParams.get('tenantId');
    const conciliado = searchParams.get('conciliado');

    const prisma = getPrismaClient();

    const where: any = { companyId: session.user.companyId };
    if (status) where.status = status;
    if (tenantId) where.tenantId = tenantId;
    if (conciliado !== null && conciliado !== undefined) {
      where.conciliado = conciliado === 'true';
    }

    const [payments, total] = await Promise.all([
      prisma.sepaPayment.findMany({
        where,
        include: {
          mandate: {
            select: {
              gcMandateId: true,
              reference: true,
              customer: {
                select: { givenName: true, familyName: true, email: true, tenantId: true },
              },
            },
          },
          inmovaPayment: {
            select: { id: true, periodo: true, monto: true, estado: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sepaPayment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: payments.map(p => ({
        ...p,
        amountEuros: p.amount / 100,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    logger.error('[GC Payments GET]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/gocardless/payments
 * Crear un cobro SEPA único
 * Body: { tenantId, amount (€), description, chargeDate?, contractId?, paymentId? }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const gc = getGCClient();
    if (!gc) {
      return NextResponse.json({ error: 'GoCardless no configurado' }, { status: 503 });
    }

    const prisma = getPrismaClient();
    const body = await request.json();
    const { tenantId, amount, description, chargeDate, contractId, paymentId } = body;

    if (!tenantId || !amount || !description) {
      return NextResponse.json(
        { error: 'tenantId, amount y description son requeridos' },
        { status: 400 }
      );
    }

    // Buscar mandato activo del inquilino
    const mandate = await prisma.sepaMandate.findFirst({
      where: {
        companyId: session.user.companyId,
        customer: { tenantId },
        status: 'active',
      },
      include: { customer: true },
    });

    if (!mandate) {
      return NextResponse.json({
        error: 'Inquilino sin mandato SEPA activo',
        message: 'El inquilino debe autorizar la domiciliación primero',
      }, { status: 400 });
    }

    const amountCents = eurosToCents(amount);
    const reference = `INM-${tenantId.slice(-6)}-${Date.now().toString(36).toUpperCase()}`;

    // Crear pago en GoCardless
    const gcPayment = await gc.createPayment({
      amount: amountCents,
      currency: 'EUR',
      description,
      chargeDate: chargeDate || undefined,
      reference,
      mandateId: mandate.gcMandateId,
      metadata: {
        inmova_tenant_id: tenantId,
        inmova_company_id: session.user.companyId,
        inmova_contract_id: contractId || '',
        inmova_payment_id: paymentId || '',
      },
    });

    // Guardar en BD local
    const sepaPayment = await prisma.sepaPayment.create({
      data: {
        companyId: session.user.companyId,
        gcPaymentId: gcPayment.id!,
        mandateId: mandate.id,
        amount: amountCents,
        currency: 'EUR',
        description,
        reference,
        chargeDate: gcPayment.chargeDate,
        status: (gcPayment.status as any) || 'pending_submission',
        tenantId,
        contractId: contractId || null,
        inmovaPaymentId: paymentId || null,
        metadata: gcPayment.metadata as any,
      },
    });

    logger.info(`[GC Payment] Created: ${gcPayment.id} | ${amount}€ | tenant ${tenantId}`);

    return NextResponse.json({
      success: true,
      payment: {
        id: sepaPayment.id,
        gcPaymentId: gcPayment.id,
        amount,
        currency: 'EUR',
        status: gcPayment.status,
        chargeDate: gcPayment.chargeDate,
        reference,
        description,
      },
      message: `Cobro de ${amount}€ iniciado. Se procesará en 3-5 días hábiles.`,
    }, { status: 201 });
  } catch (error: any) {
    logger.error('[GC Payments POST]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
