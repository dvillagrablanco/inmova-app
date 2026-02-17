import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';
import { getGCClient, eurosToCents } from '@/lib/gocardless-integration';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/gocardless/subscriptions
 * Lista suscripciones SEPA (cobros recurrentes)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = { companyId: session.user.companyId };
    if (status) where.status = status;

    const subscriptions = await prisma.sepaSubscription.findMany({
      where,
      include: {
        mandate: {
          select: {
            gcMandateId: true,
            reference: true,
            status: true,
            customer: {
              select: { givenName: true, familyName: true, email: true, tenantId: true },
            },
          },
        },
        _count: { select: { payments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: subscriptions.map(s => ({
        ...s,
        amountEuros: s.amount / 100,
      })),
    });
  } catch (error: any) {
    logger.error('[GC Subscriptions GET]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/gocardless/subscriptions
 * Crear cobro recurrente mensual (alquiler)
 * Body: { tenantId, amount (€), dayOfMonth, description?, startDate?, endDate?, contractId? }
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
    const { tenantId, amount, dayOfMonth, description, startDate, endDate, contractId } = body;

    if (!tenantId || !amount) {
      return NextResponse.json({ error: 'tenantId y amount requeridos' }, { status: 400 });
    }

    // Buscar mandato activo
    const mandate = await prisma.sepaMandate.findFirst({
      where: {
        companyId: session.user.companyId,
        customer: { tenantId },
        status: 'active',
      },
      include: {
        customer: { select: { givenName: true, familyName: true } },
      },
    });

    if (!mandate) {
      return NextResponse.json({ error: 'Inquilino sin mandato SEPA activo' }, { status: 400 });
    }

    const tenant = mandate.customer;
    const subName = description || `Alquiler mensual - ${tenant.givenName} ${tenant.familyName}`;
    const amountCents = eurosToCents(amount);

    const gcSub = await gc.createSubscription({
      amount: amountCents,
      currency: 'EUR',
      name: subName,
      interval: 1,
      intervalUnit: 'monthly',
      dayOfMonth: dayOfMonth || 1,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      mandateId: mandate.gcMandateId,
      metadata: {
        inmova_tenant_id: tenantId,
        inmova_company_id: session.user.companyId,
        inmova_contract_id: contractId || '',
        tipo: 'alquiler',
      },
    });

    // Guardar en BD local
    const subscription = await prisma.sepaSubscription.create({
      data: {
        companyId: session.user.companyId,
        gcSubscriptionId: gcSub.id!,
        mandateId: mandate.id,
        name: subName,
        amount: amountCents,
        currency: 'EUR',
        interval: 1,
        intervalUnit: 'monthly',
        dayOfMonth: dayOfMonth || 1,
        startDate: startDate || null,
        endDate: endDate || null,
        status: (gcSub.status as any) || 'active',
        tenantId,
        contractId: contractId || null,
        metadata: gcSub.metadata as any,
      },
    });

    logger.info(`[GC Subscription] Created: ${gcSub.id} | ${amount}€/mes | tenant ${tenantId} | día ${dayOfMonth || 1}`);

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        gcSubscriptionId: gcSub.id,
        amount,
        dayOfMonth: dayOfMonth || 1,
        status: gcSub.status,
      },
      message: `Cobro recurrente de ${amount}€/mes configurado para el día ${dayOfMonth || 1} de cada mes.`,
    }, { status: 201 });
  } catch (error: any) {
    logger.error('[GC Subscriptions POST]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/gocardless/subscriptions
 * Pausar, reanudar o cancelar suscripción
 * Body: { subscriptionId, action: 'pause' | 'resume' | 'cancel' }
 */
export async function PATCH(request: NextRequest) {
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
    const { subscriptionId, action } = await request.json();

    if (!subscriptionId || !action) {
      return NextResponse.json({ error: 'subscriptionId y action requeridos' }, { status: 400 });
    }

    const sub = await prisma.sepaSubscription.findFirst({
      where: { id: subscriptionId, companyId: session.user.companyId },
    });

    if (!sub) {
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 });
    }

    let success = false;
    let newStatus: string = sub.status;

    switch (action) {
      case 'pause':
        success = await gc.pauseSubscription(sub.gcSubscriptionId);
        if (success) newStatus = 'paused';
        break;
      case 'resume':
        success = await gc.resumeSubscription(sub.gcSubscriptionId);
        if (success) newStatus = 'active';
        break;
      case 'cancel':
        success = await gc.cancelSubscription(sub.gcSubscriptionId);
        if (success) newStatus = 'cancelled';
        break;
      default:
        return NextResponse.json({ error: 'action debe ser pause, resume o cancel' }, { status: 400 });
    }

    if (success) {
      await prisma.sepaSubscription.update({
        where: { id: subscriptionId },
        data: { status: newStatus as any },
      });
    }

    return NextResponse.json({ success, action, newStatus });
  } catch (error: any) {
    logger.error('[GC Subscriptions PATCH]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
