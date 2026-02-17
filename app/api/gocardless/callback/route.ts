import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db';
import { getGCClient } from '@/lib/gocardless-integration';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/gocardless/callback
 * Callback después de que el inquilino autoriza la domiciliación SEPA.
 * GoCardless redirige aquí con redirect_flow_id.
 * Completa el redirect flow, obtiene el mandato y lo guarda en BD.
 */
export async function GET(request: NextRequest) {
  try {
    const redirectFlowId = request.nextUrl.searchParams.get('redirect_flow_id');
    const tenantId = request.nextUrl.searchParams.get('tenantId');
    const companyId = request.nextUrl.searchParams.get('companyId');
    const sessionToken = request.nextUrl.searchParams.get('session_token');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://inmovaapp.com';

    if (!redirectFlowId) {
      return NextResponse.redirect(new URL('/dashboard/pagos?error=missing_flow_id', appUrl));
    }

    const gc = getGCClient();
    if (!gc) {
      return NextResponse.redirect(new URL('/dashboard/pagos?error=gc_not_configured', appUrl));
    }

    // Completar el redirect flow
    const result = await gc.completeRedirectFlow(
      redirectFlowId,
      sessionToken || `tenant_${tenantId}_auto`
    );

    const { mandateId, customerId, customerBankAccountId } = result;

    if (!mandateId) {
      logger.error('[GC Callback] No mandate ID in redirect flow completion');
      return NextResponse.redirect(new URL('/dashboard/pagos?error=no_mandate', appUrl));
    }

    const prisma = getPrismaClient();

    // Obtener detalles del mandato desde GC
    let mandateDetails;
    try {
      mandateDetails = await gc.getMandate(mandateId);
    } catch (e) {
      logger.warn('[GC Callback] Could not fetch mandate details');
    }

    if (tenantId && companyId) {
      // Buscar o crear GCCustomer
      let gcCustomerRecord = await prisma.gCCustomer.findFirst({
        where: { gcCustomerId: customerId },
      });

      if (!gcCustomerRecord) {
        // Obtener info del customer desde GC
        let customerInfo;
        try {
          customerInfo = await gc.getCustomer(customerId);
        } catch (e) {
          logger.warn('[GC Callback] Could not fetch customer details');
        }

        gcCustomerRecord = await prisma.gCCustomer.create({
          data: {
            companyId,
            gcCustomerId: customerId,
            gcBankAccountId: customerBankAccountId,
            tenantId,
            email: customerInfo?.email || '',
            givenName: customerInfo?.givenName || '',
            familyName: customerInfo?.familyName || '',
            countryCode: customerInfo?.countryCode || 'ES',
          },
        });
      } else {
        // Actualizar bank account ID si no lo tenía
        if (!gcCustomerRecord.gcBankAccountId && customerBankAccountId) {
          await prisma.gCCustomer.update({
            where: { id: gcCustomerRecord.id },
            data: { gcBankAccountId: customerBankAccountId },
          });
        }
      }

      // Crear mandato en BD local
      await prisma.sepaMandate.create({
        data: {
          companyId,
          gcMandateId: mandateId,
          gcCustomerId: customerId,
          customerId: gcCustomerRecord.id,
          reference: mandateDetails?.reference || mandateId,
          scheme: mandateDetails?.scheme || 'sepa_core',
          status: (mandateDetails?.status as any) || 'pending_submission',
          nextPossibleChargeDate: mandateDetails?.nextPossibleChargeDate,
        },
      });

      // Mantener compatibilidad: crear BankConnection para integraciones existentes
      try {
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
      } catch (e) {
        logger.warn('[GC Callback] BankConnection already exists or failed');
      }
    }

    logger.info(`[GC Callback] Mandate SEPA activated: ${mandateId} for tenant ${tenantId}`);

    return NextResponse.redirect(
      new URL(`/dashboard/pagos?success=mandate_created&mandate=${mandateId}`, appUrl)
    );
  } catch (error: any) {
    logger.error('[GC Callback Error]:', error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://inmovaapp.com';
    return NextResponse.redirect(new URL('/dashboard/pagos?error=callback_exception', appUrl));
  }
}
