import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { GoCardlessClient } from '@/lib/gocardless-integration';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/open-banking/gocardless/charge
 * 
 * Cobra un pago único a un inquilino via SEPA Direct Debit.
 * El inquilino debe tener un mandato activo.
 * 
 * Body: { tenantId: string, amount: number (€), description: string, chargeDate?: string }
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

    const { tenantId, amount, description, chargeDate } = await request.json();
    if (!tenantId || !amount || !description) {
      return NextResponse.json({ error: 'tenantId, amount y description requeridos' }, { status: 400 });
    }

    // Find mandate for this tenant
    const connection = await prisma.bankConnection.findFirst({
      where: {
        tenantId,
        companyId: session.user.companyId,
        proveedor: 'gocardless',
        estado: 'conectado',
      },
    });

    if (!connection || !connection.accessToken) {
      return NextResponse.json({
        error: 'Inquilino sin mandato SEPA activo',
        message: 'El inquilino debe autorizar la domiciliación primero (POST /api/open-banking/gocardless/setup-tenant)',
      }, { status: 400 });
    }

    // Extract mandate ID from accessToken field
    const mandateMatch = connection.accessToken.match(/mandate:([^|]+)/);
    const mandateId = mandateMatch?.[1] || connection.proveedorItemId;

    if (!mandateId) {
      return NextResponse.json({ error: 'No se encontró mandato SEPA' }, { status: 400 });
    }

    // Create payment (amount in cents)
    const amountCents = Math.round(amount * 100);
    const payment = await gc.createPayment({
      amount: amountCents,
      currency: 'EUR',
      description,
      chargeDate: chargeDate || undefined,
      reference: `INM-${tenantId.slice(-6)}-${Date.now().toString(36)}`,
      mandateId,
      metadata: {
        inmova_tenant_id: tenantId,
        inmova_company_id: session.user.companyId,
      },
    });

    // Save payment to DB
    await prisma.bankTransaction.create({
      data: {
        companyId: session.user.companyId,
        connectionId: connection.id,
        proveedorTxId: payment.id || `gc_${Date.now()}`,
        fecha: chargeDate ? new Date(chargeDate) : new Date(),
        descripcion: description,
        monto: -amount, // Negative = cobro al inquilino
        moneda: 'EUR',
        categoria: 'alquiler',
        estado: 'pendiente_revision',
      },
    });

    logger.info(`[GC Charge] Pago creado: ${payment.id} | ${amount}€ | tenant ${tenantId}`);

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      amount,
      currency: 'EUR',
      status: payment.status,
      chargeDate: payment.chargeDate,
      description,
      message: `Cobro de ${amount}€ iniciado. Se procesará en 3-5 días hábiles.`,
    });
  } catch (error: any) {
    logger.error('[GC Charge Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
