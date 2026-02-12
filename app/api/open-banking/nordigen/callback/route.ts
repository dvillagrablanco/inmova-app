import { NextRequest, NextResponse } from 'next/server';
import { getRequisition, getAccountDetails, isNordigenConfigured } from '@/lib/nordigen-service';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/open-banking/nordigen/callback
 * Callback después de que el usuario autoriza acceso en el banco.
 * Nordigen redirige aquí con ref en query params.
 */
export async function GET(request: NextRequest) {
  try {
    const ref = request.nextUrl.searchParams.get('ref');
    const companyId = request.nextUrl.searchParams.get('companyId');
    const userId = request.nextUrl.searchParams.get('userId');

    if (!ref && !companyId) {
      return NextResponse.redirect(new URL('/dashboard/finanzas?error=missing_params', request.url));
    }

    const prisma = getPrismaClient();

    // Find connection by requisition ID
    const connection = await prisma.bankConnection.findFirst({
      where: {
        proveedor: 'nordigen',
        OR: [
          { consentId: ref || '' },
          { companyId: companyId || '', userId: userId || '', estado: 'renovacion_requerida' },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!connection || !connection.consentId) {
      return NextResponse.redirect(new URL('/dashboard/finanzas?error=connection_not_found', request.url));
    }

    if (!isNordigenConfigured()) {
      return NextResponse.redirect(new URL('/dashboard/finanzas?error=nordigen_not_configured', request.url));
    }

    // Check requisition status
    const requisition = await getRequisition(connection.consentId);

    if (!requisition || requisition.status !== 'LN') {
      // LN = Linked (authorized)
      await prisma.bankConnection.update({
        where: { id: connection.id },
        data: { estado: 'error' },
      });
      return NextResponse.redirect(new URL(`/dashboard/finanzas?error=auth_failed&status=${requisition?.status || 'unknown'}`, request.url));
    }

    // Get account details
    const accounts = [];
    for (const accountId of requisition.accounts) {
      const details = await getAccountDetails(accountId);
      if (details) {
        accounts.push({ ...details, nordigenAccountId: accountId });
      }
    }

    // Update connection
    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: {
        estado: 'conectado',
        cuentas: JSON.stringify(accounts),
        ultimaSincronizacion: new Date(),
        accessToken: requisition.accounts.join(','), // Store account IDs
      },
    });

    logger.info(`[Nordigen] Callback OK: ${connection.id} con ${accounts.length} cuentas`);

    return NextResponse.redirect(new URL(`/dashboard/finanzas?success=bank_connected&accounts=${accounts.length}`, request.url));
  } catch (error: any) {
    logger.error('[Nordigen Callback Error]:', error);
    return NextResponse.redirect(new URL('/dashboard/finanzas?error=callback_failed', request.url));
  }
}
