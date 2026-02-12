import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { GoCardlessClient } from '@/lib/gocardless-integration';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/open-banking/gocardless/subscribe
 * 
 * Crea un cobro recurrente mensual (alquiler) para un inquilino.
 * 
 * Body: { tenantId, amount (€), dayOfMonth (1-28), description, startDate?, endDate? }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const token = process.env.GOCARDLESS_ACCESS_TOKEN;
    const env = (process.env.GOCARDLESS_ENVIRONMENT || 'live') as 'sandbox' | 'live';
    if (!token) {
      return NextResponse.json({ error: 'GoCardless no configurado' }, { status: 503 });
    }

    const gc = new GoCardlessClient({ accessToken: token, environment: env, enabled: true });
    const prisma = getPrismaClient();

    const { tenantId, amount, dayOfMonth, description, startDate, endDate } = await request.json();
    if (!tenantId || !amount) {
      return NextResponse.json({ error: 'tenantId y amount requeridos' }, { status: 400 });
    }

    // Find mandate
    const connection = await prisma.bankConnection.findFirst({
      where: {
        tenantId,
        companyId: session.user.companyId,
        proveedor: 'gocardless',
        estado: 'conectado',
      },
    });

    if (!connection?.accessToken) {
      return NextResponse.json({
        error: 'Inquilino sin mandato SEPA activo',
      }, { status: 400 });
    }

    const mandateMatch = connection.accessToken.match(/mandate:([^|]+)/);
    const mandateId = mandateMatch?.[1] || connection.proveedorItemId;

    if (!mandateId) {
      return NextResponse.json({ error: 'No se encontró mandato SEPA' }, { status: 400 });
    }

    // Get tenant info for description
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { nombreCompleto: true },
    });

    const amountCents = Math.round(amount * 100);
    const sub = await gc.createSubscription({
      amount: amountCents,
      currency: 'EUR',
      name: description || `Alquiler mensual - ${tenant?.nombreCompleto || tenantId}`,
      interval: 1,
      intervalUnit: 'monthly',
      dayOfMonth: dayOfMonth || 1,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      mandateId,
      metadata: {
        inmova_tenant_id: tenantId,
        inmova_company_id: session.user.companyId,
        tipo: 'alquiler',
      },
    });

    logger.info(`[GC Subscribe] Suscripción creada: ${sub.id} | ${amount}€/mes | tenant ${tenantId} | día ${dayOfMonth}`);

    return NextResponse.json({
      success: true,
      subscriptionId: sub.id,
      amount,
      currency: 'EUR',
      interval: 'monthly',
      dayOfMonth: dayOfMonth || 1,
      status: sub.status,
      startDate,
      endDate,
      message: `Cobro recurrente de ${amount}€/mes configurado para el día ${dayOfMonth || 1} de cada mes.`,
    });
  } catch (error: any) {
    logger.error('[GC Subscribe Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
