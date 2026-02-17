import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/open-banking/gocardless/callback
 *
 * Callback después de que el inquilino autoriza la domiciliación SEPA.
 * GoCardless redirige aquí con redirect_flow_id.
 */
export async function GET(request: NextRequest) {
  try {
    const redirectFlowId = request.nextUrl.searchParams.get('redirect_flow_id');
    const tenantId = request.nextUrl.searchParams.get('tenantId');
    const companyId = request.nextUrl.searchParams.get('companyId');

    if (!redirectFlowId) {
      return NextResponse.redirect(new URL('/dashboard/pagos?error=missing_flow_id', request.url));
    }

    const token = process.env.GOCARDLESS_ACCESS_TOKEN;
    const env = process.env.GOCARDLESS_ENVIRONMENT || 'live';
    const baseUrl =
      env === 'live' ? 'https://api.gocardless.com' : 'https://api-sandbox.gocardless.com';

    if (!token) {
      return NextResponse.redirect(
        new URL('/dashboard/pagos?error=gc_not_configured', request.url)
      );
    }

    // Complete the redirect flow to get the mandate
    const res = await fetch(`${baseUrl}/redirect_flows/${redirectFlowId}/actions/complete`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'GoCardless-Version': '2015-07-06',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          session_token:
            request.nextUrl.searchParams.get('session_token') || `tenant_${tenantId}_auto`,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      logger.error('[GC Callback] Error completing redirect flow:', data);
      return NextResponse.redirect(new URL('/dashboard/pagos?error=complete_failed', request.url));
    }

    const mandateId = data.redirect_flows?.links?.mandate;
    const customerId = data.redirect_flows?.links?.customer;
    const customerBankAccountId = data.redirect_flows?.links?.customer_bank_account;

    if (!mandateId) {
      return NextResponse.redirect(new URL('/dashboard/pagos?error=no_mandate', request.url));
    }

    // Save mandate to database
    const prisma = getPrismaClient();

    if (tenantId && companyId) {
      // Update tenant with GoCardless IDs
      await prisma.tenant
        .update({
          where: { id: tenantId },
          data: {
            // Store in JSON metadata since specific GC fields may not exist
            observaciones: `GC_MANDATE=${mandateId}|GC_CUSTOMER=${customerId}|GC_BANK_ACCOUNT=${customerBankAccountId}`,
          },
        })
        .catch(() => {
          // If observaciones field doesn't work, try other approach
          logger.warn('[GC Callback] Could not update tenant metadata');
        });

      // Create a bank connection record
      await prisma.bankConnection.create({
        data: {
          companyId,
          proveedor: 'gocardless',
          provider: 'gocardless',
          proveedorItemId: mandateId,
          consentId: mandateId,
          nombreBanco: 'GoCardless SEPA Direct Debit',
          estado: 'conectado',
          accessToken: `mandate:${mandateId}|customer:${customerId}|bank_account:${customerBankAccountId}`,
          tenantId,
          ultimaSync: new Date(),
        },
      });
    }

    logger.info(`[GC Callback] Mandato SEPA activado: ${mandateId} para tenant ${tenantId}`);

    return NextResponse.redirect(
      new URL(`/dashboard/pagos?success=mandate_created&mandate=${mandateId}`, request.url)
    );
  } catch (error: any) {
    logger.error('[GC Callback Error]:', error);
    return NextResponse.redirect(new URL('/dashboard/pagos?error=callback_exception', request.url));
  }
}
